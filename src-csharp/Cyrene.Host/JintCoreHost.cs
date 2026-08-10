using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text.Json;
using Jint;
using Jint.Native;
using Jint.Runtime;
using Jint.Runtime.Interop;

namespace Cyrene.Host;

public sealed class JintCoreHost : IDisposable
{
    public const string BundleAsset = "Assets/cyrene-core-bundle.js";

    private const string InvokeBootstrap = """
        globalThis.__peopleCache = new Map();
        globalThis.crypto = {
          getRandomValues: (arr) => { for (let i = 0; i < arr.length; i++) arr[i] = __hostRandomByte(); return arr; },
          randomUUID: () => __hostRandomUuid()
        };
        globalThis.__cyreneInvoke = (name, argsJson) => {
          const args = JSON.parse(argsJson);
          if (name === 'executeCoreDrawRequest') args[0].peopleCache = globalThis.__peopleCache;
          return JSON.stringify(CyreneCore[name](...args));
        };
        """;

    private readonly BlockingCollection<Func<object?>> _queue = new();
    private readonly Thread _thread;
    private readonly Engine _engine = new();

    private bool _disposed;

    public JintCoreHost(string bundlePath)
    {
        _thread = new Thread(() => RunLoop(bundlePath))
        {
            IsBackground = true,
            Name = "cyrene-jint"
        };
        _thread.Start();
    }

    public Task<JsonElement> InvokeAsync(string name, params object?[] args)
    {
        var completion = new TaskCompletionSource<JsonElement>(TaskCreationOptions.RunContinuationsAsynchronously);
        _queue.Add(() =>
        {
            try
            {
                var result = InvokeOnEngine(name, args);
                completion.SetResult(result);
            }
            catch (Exception error)
            {
                completion.SetException(error);
            }
            return null;
        });
        return completion.Task;
    }

    private JsonElement InvokeOnEngine(string name, object?[] args)
    {
        var argsJson = JsonSerializer.Serialize(args);
        var expression = $"__cyreneInvoke('{name}', {JsonSerializer.Serialize(argsJson)})";
        JsValue result;
        try
        {
            result = _engine.Evaluate(expression);
        }
        catch (JintException error)
        {
            throw new InvalidOperationException($"共享核心函数 {name} 执行失败：{error.Message}", error);
        }
        var serialized = result.IsUndefined() ? "undefined" : result.ToString();
        if (serialized == "undefined") return default;
        using var document = JsonDocument.Parse(serialized);
        return document.RootElement.Clone();
    }

    private void RunLoop(string bundlePath)
    {
        var source = File.ReadAllText(bundlePath);
        _engine.Execute(source);
        _engine.SetValue("__hostRandomByte", new ClrFunction(_engine, "__hostRandomByte", (_, _) =>
        {
            Span<byte> buffer = stackalloc byte[1];
            RandomNumberGenerator.Fill(buffer);
            return (int)buffer[0];
        }));
        _engine.SetValue("__hostRandomUuid", new ClrFunction(_engine, "__hostRandomUuid", (_, _) =>
            JsValue.FromObject(_engine, Guid.NewGuid().ToString("D"))));
        _engine.Execute(InvokeBootstrap);
        foreach (var action in _queue.GetConsumingEnumerable())
        {
            try
            {
                action();
            }
            catch
            {
                // 已通过 TaskCompletionSource 上报，循环继续
            }
        }
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
