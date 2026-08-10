using System.Collections.Concurrent;
using System.Text.Json;
using Cyrene.Core.Bridge;
using Jint;
using Jint.Native;
using Jint.Runtime;
using Jint.Runtime.Interop;

namespace Cyrene.Host;

public sealed class JintPluginSandbox : IDisposable
{
    private const string Bootstrap = """
        const self = globalThis;
        for (const key of ['fetch', 'WebSocket', 'EventSource', 'XMLHttpRequest', 'importScripts', 'Worker', 'SharedWorker']) {
          try { Object.defineProperty(self, key, { value: undefined, writable: false, configurable: false }); } catch {}
        }
        globalThis.crypto = {
          getRandomValues: (arr) => { for (let i = 0; i < arr.length; i++) arr[i] = __hostRandomByte(); return arr; },
          randomUUID: () => __hostRandomUuid()
        };
        self.postMessage = (message) => __hostWorkerPost(JSON.stringify(message));
        Object.defineProperty(self, 'onmessage', {
          set: (value) => { self.__handler = value; },
          get: () => self.__handler
        });
        globalThis.__sandboxSettled = false;
        globalThis.__sandboxError = undefined;
        globalThis.__sandboxDispatch = (messageJson) => {
          const handler = self.__handler;
          if (typeof handler !== 'function') { globalThis.__sandboxSettled = true; return true; }
          globalThis.__sandboxSettled = false;
          globalThis.__sandboxError = undefined;
          const promise = handler({ data: JSON.parse(messageJson) });
          Promise.resolve(promise).then(
            () => { globalThis.__sandboxSettled = true; },
            error => { globalThis.__sandboxError = String(error?.stack || error?.message || error); globalThis.__sandboxSettled = true; }
          );
          return true;
        };
        globalThis.__sandboxReply = (messageJson) => {
          const handler = self.__handler;
          if (typeof handler !== 'function') return true;
          const promise = handler({ data: JSON.parse(messageJson) });
          Promise.resolve(promise).catch(() => {});
          return true;
        };
        """;

    private readonly Engine _engine = new();
    private readonly Thread _thread;
    private readonly BlockingCollection<Func<object?>> _queue = new();
    private readonly IHostBridge _bridge;
    private readonly ConcurrentQueue<string> _outbox = new();
    private readonly ConcurrentQueue<string> _replies = new();
    private volatile bool _running = true;
    private bool _disposed;

    public JintPluginSandbox(string pluginSource, IHostBridge bridge)
    {
        _bridge = bridge;
        _thread = new Thread(() => RunLoop(pluginSource))
        {
            IsBackground = true,
            Name = "cyrene-plugin"
        };
        _thread.Start();
    }

    private volatile string _pluginId = "plugin";

    public Task ActivateAsync(JsonElement context)
    {
        if (context.TryGetProperty("pluginId", out var pluginId))
        {
            _pluginId = pluginId.GetString() ?? "plugin";
        }
        return DispatchAsync(JsonSerializer.SerializeToElement(new { type = "activate", context }));
    }

    public Task PostEventAsync(string eventName, JsonElement payload)
    {
        return DispatchAsync(JsonSerializer.SerializeToElement(new { type = "event", @event = eventName, payload }));
    }

    public Task DeactivateAsync()
    {
        return DispatchAsync(JsonSerializer.SerializeToElement(new { type = "deactivate" }));
    }

    public IReadOnlyList<string> DrainOutbox()
    {
        var messages = new List<string>();
        while (_outbox.TryDequeue(out var message)) messages.Add(message);
        return messages;
    }

    public Task<string> EvaluateForDebugAsync(string jsExpression)
    {
        var completion = new TaskCompletionSource<string>(TaskCreationOptions.RunContinuationsAsynchronously);
        _queue.Add(() =>
        {
            try
            {
                var result = _engine.Evaluate(jsExpression);
                completion.SetResult(result.IsUndefined() ? "undefined" : result.ToString());
            }
            catch (Exception error)
            {
                completion.SetException(error);
            }
            return null;
        });
        return completion.Task;
    }

    private void RunLoop(string pluginSource)
    {
        var protocol = BuildPluginWorkerProtocol(pluginSource);
        _engine.Execute(Bootstrap);
        _engine.SetValue("__hostRandomByte", new ClrFunction(_engine, "__hostRandomByte", (_, _) =>
        {
            Span<byte> buffer = stackalloc byte[1];
            System.Security.Cryptography.RandomNumberGenerator.Fill(buffer);
            return (int)buffer[0];
        }));
        _engine.SetValue("__hostRandomUuid", new ClrFunction(_engine, "__hostRandomUuid", (_, _) =>
            JsValue.FromObject(_engine, Guid.NewGuid().ToString("D"))));
        _engine.SetValue("__hostWorkerPost", new ClrFunction(_engine, "__hostWorkerPost", (_, args) =>
        {
            var messageJson = args[0].AsString();
            using var document = JsonDocument.Parse(messageJson);
            var message = document.RootElement;
            if (message.TryGetProperty("type", out var type) && type.GetString() == "rpc-request")
            {
                var reply = HandleRpcRequest(message);
                _replies.Enqueue(reply);
            }
            else
            {
                _outbox.Enqueue(messageJson);
            }
            return true;
        }));
        _engine.Execute(protocol);

        foreach (var action in _queue.GetConsumingEnumerable())
        {
            try
            {
                action();
            }
            catch
            {
                // 已通过任务源上报
            }
        }
    }

    private string HandleRpcRequest(JsonElement message)
    {
        var method = message.GetProperty("method").GetString()!;
        var args = message.GetProperty("args");
        var id = message.GetProperty("id").GetString()!;
        try
        {
            var result = _bridge.InvokeAsync(_pluginId, method, args).GetAwaiter().GetResult();
            return JsonSerializer.Serialize(new { type = "rpc-response", id, result });
        }
        catch (HostBridgeException error)
        {
            return JsonSerializer.Serialize(new { type = "rpc-response", id, error = error.Message, code = error.Code });
        }
        catch (Exception error)
        {
            return JsonSerializer.Serialize(new { type = "rpc-response", id, error = error.Message, code = "HOST_BRIDGE_FAILED" });
        }
    }

    private Task DispatchAsync(JsonElement message)
    {
        var completion = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        _queue.Add(() =>
        {
            try
            {
                DispatchOnEngine(message);
                completion.SetResult(true);
            }
            catch (Exception error)
            {
                completion.SetException(error);
            }
            return null;
        });
        return completion.Task;
    }

    private void DispatchOnEngine(JsonElement message)
    {
        var messageJson = message.GetRawText();
        var expression = $"__sandboxDispatch({JsonSerializer.Serialize(messageJson)})";
        _engine.Evaluate(expression);
        var attempt = 0;
        while (_engine.Evaluate("globalThis.__sandboxSettled === true").AsBoolean() == false)
        {
            DrainReplies();
            _engine.Advanced.ProcessTasks();
            if (attempt++ > 2_000_000) throw new InvalidOperationException("插件消息处理超时");
        }
        DrainReplies();
        var error = _engine.Evaluate("globalThis.__sandboxError");
        if (!error.IsUndefined() && error.AsString().Length > 0)
        {
            throw new InvalidOperationException($"插件处理失败：{error.AsString()}");
        }
        var hostError = TakeHostError();
        if (hostError is not null)
        {
            using var document = JsonDocument.Parse(hostError);
            throw new InvalidOperationException($"插件报错：{document.RootElement.GetProperty("error").GetString()}");
        }
    }

    private string? TakeHostError()
    {
        var remaining = new List<string>();
        string? hostError = null;
        while (_outbox.TryDequeue(out var message))
        {
            if (message.Contains("\"host-error\"") && hostError is null) hostError = message;
            else remaining.Add(message);
        }
        foreach (var message in remaining) _outbox.Enqueue(message);
        return hostError;
    }

    private void DrainReplies()
    {
        while (_replies.TryDequeue(out var replyJson))
        {
            _engine.Evaluate($"__sandboxReply({JsonSerializer.Serialize(replyJson)})");
            _engine.Advanced.ProcessTasks();
        }
    }

    private static string BuildPluginWorkerProtocol(string pluginSource)
    {
        // 与 packages/cyrene-core/src/plugin-worker-protocol.js 的模板保持一致
        const string template = """
            'use strict';
            for (const key of ['fetch', 'WebSocket', 'EventSource', 'XMLHttpRequest', 'importScripts', 'Worker', 'SharedWorker']) {
              try { Object.defineProperty(self, key, { value: undefined, writable: false, configurable: false }); } catch {}
            }
            {__PLUGIN_SOURCE__}
            const pending = new Map();
            let pluginModule = null;
            let activeCommandId = null;
            const freezePayload = value => {
              if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
              Object.freeze(value);
              for (const child of Object.values(value)) freezePayload(child);
              return value;
            };
            const request = (method, args = {}) => new Promise((resolve, reject) => {
              const id = (crypto.randomUUID && crypto.randomUUID()) || ('rpc-' + Date.now() + '-' + Math.random());
              pending.set(id, { resolve, reject });
              self.postMessage({ type: 'rpc-request', id, method, args, commandId: activeCommandId });
            });
            self.onmessage = async event => {
              const message = event.data || {};
              try {
                if (message.type === 'activate') {
                  pluginModule = self.CyrenePluginModule || self.cyrenePlugin;
                  if (!pluginModule || typeof pluginModule.activate !== 'function') throw new Error('插件未导出 cyrenePlugin.activate');
                  await pluginModule.activate(Object.freeze({ ...message.context, request }));
                  self.postMessage({ type: 'activated' });
                } else if (message.type === 'event' && pluginModule?.onEvent) {
                  await pluginModule.onEvent(message.event, freezePayload(message.payload));
                } else if (message.type === 'command') {
                  if (typeof pluginModule?.onCommand !== 'function') throw new Error('插件未实现 onCommand()');
                  activeCommandId = message.id;
                  try {
                    const result = await pluginModule.onCommand(message.commandId, freezePayload(message.args || {}));
                    self.postMessage({ type: 'command-result', id: message.id, result });
                  } catch (error) {
                    self.postMessage({ type: 'command-result', id: message.id, error: String(error?.message || error) });
                  } finally { activeCommandId = null; }
                } else if (message.type === 'deactivate') {
                  await pluginModule?.deactivate?.();
                  self.postMessage({ type: 'deactivated' });
                } else if (message.type === 'rpc-response') {
                  const task = pending.get(message.id);
                  if (!task) return;
                  pending.delete(message.id);
                  message.error ? task.reject(Object.assign(new Error(message.error), { code: message.code })) : task.resolve(message.result);
                }
              } catch (error) {
                self.postMessage({ type: 'host-error', error: String(error?.stack || error) });
              }
            };
            """;
        return template.Replace("{__PLUGIN_SOURCE__}", pluginSource);
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        _queue.CompleteAdding();
        if (!_thread.Join(TimeSpan.FromSeconds(5)))
        {
            _thread.Interrupt();
        }
        _engine.Dispose();
    }
}
