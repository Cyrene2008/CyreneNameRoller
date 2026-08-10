using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Jint;
using Jint.Native;
using Jint.Runtime;
using Jint.Runtime.Interop;
using Org.BouncyCastle.Crypto.Parameters;
using Org.BouncyCastle.Crypto.Signers;

namespace Cyrene.Host;

public sealed class JintCoreHost : IDisposable
{
    public const string BundleAsset = "Assets/cyrene-core-bundle.js";

    private const string InvokeBootstrap = """
        const __b64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        const btoa = (input) => {
          const binary = String(input);
          let out = '';
          for (let i = 0; i < binary.length; i += 3) {
            const b0 = binary.charCodeAt(i);
            const b1 = i + 1 < binary.length ? binary.charCodeAt(i + 1) : NaN;
            const b2 = i + 2 < binary.length ? binary.charCodeAt(i + 2) : NaN;
            out += __b64Chars.charAt(b0 >> 2);
            out += __b64Chars.charAt(((b0 & 3) << 4) | (Number.isNaN(b1) ? 0 : b1 >> 4));
            out += Number.isNaN(b1) ? '=' : __b64Chars.charAt(((b1 & 15) << 2) | (Number.isNaN(b2) ? 0 : b2 >> 6));
            out += Number.isNaN(b2) ? '=' : __b64Chars.charAt(b2 & 63);
          }
          return out;
        };
        const atob = (input) => {
          const binary = String(input).replace(/=+$/, '');
          let out = '';
          for (let i = 0; i < binary.length; i += 4) {
            const c0 = __b64Chars.indexOf(binary[i]);
            const c1 = i + 1 < binary.length ? __b64Chars.indexOf(binary[i + 1]) : NaN;
            const c2 = i + 2 < binary.length ? __b64Chars.indexOf(binary[i + 2]) : NaN;
            const c3 = i + 3 < binary.length ? __b64Chars.indexOf(binary[i + 3]) : NaN;
            const triplet = (c0 << 18) | ((Number.isNaN(c1) ? 0 : c1) << 12) | ((Number.isNaN(c2) ? 0 : c2) << 6) | (Number.isNaN(c3) ? 0 : c3);
            out += String.fromCharCode((triplet >> 16) & 0xff);
            if (!Number.isNaN(c2)) out += String.fromCharCode((triplet >> 8) & 0xff);
            if (!Number.isNaN(c3)) out += String.fromCharCode(triplet & 0xff);
          }
          return out;
        };
        const toB64 = (bytes) => {
          let bin = '';
          for (let i = 0; i < bytes.length; i += 256) {
            let part = '';
            const end = Math.min(i + 256, bytes.length);
            for (let j = i; j < end; j++) part += String.fromCharCode(bytes[j]);
            bin += part;
          }
          return btoa(bin);
        };
        const fromB64 = (value) => {
          const binary = atob(value);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          return bytes;
        };
        globalThis.TextEncoder = class { encode(input) { return fromB64(__hostUtf8Encode(String(input))); } };
        globalThis.TextDecoder = class { decode(bytes) { return __hostUtf8Decode(toB64(bytes)); } };
        const __keyStore = new Map();
        let __keySeq = 0;
        const __storeKey = (type, bytes) => { const id = 'k' + (__keySeq++); __keyStore.set(id, { type, bytes }); return { type: 'key', id }; };
        globalThis.crypto = {
          getRandomValues: (arr) => { for (let i = 0; i < arr.length; i++) arr[i] = __hostRandomByte(); return arr; },
          randomUUID: () => __hostRandomUuid(),
          subtle: {
            digest: (algo, data) => fromB64(__hostSha256(toB64(data))),
            importKey: (format, keyData, algo) =>
              __storeKey(format === 'spki' ? 'spki' : 'raw', Array.from(keyData)),
            deriveKey: (algo, baseKey, derivedKeyType) => {
              const base = __keyStore.get(baseKey.id);
              const keyB64 = __hostPbkdf2(toB64(Uint8Array.from(base.bytes)), toB64(algo.salt), algo.iterations);
              return __storeKey('aes-gcm', keyB64);
            },
            decrypt: (algo, key, data) => {
              const k = __keyStore.get(key.id);
              const plainB64 = __hostAesGcmDecryptJson(JSON.stringify({
                key: k.bytes, iv: toB64(algo.iv), data: toB64(data), aad: toB64(algo.additionalData)
              }));
              return fromB64(plainB64);
            },
            verify: (algo, key, signature, data) => {
              const k = __keyStore.get(key.id);
              return __hostEd25519Verify(k.bytes, toB64(signature), toB64(data));
            }
          }
        };
        globalThis.__peopleCache = new Map();
        globalThis.__cyreneInvoke = async (name, argsJson) => {          const args = JSON.parse(argsJson);
          if (name === 'executeCoreDrawRequest') args[0].peopleCache = globalThis.__peopleCache;
          return JSON.stringify(await CyreneCore[name](...args));
        };
        globalThis.__cyreneInvokeDeferred = (name, argsJson) => {
          const args = JSON.parse(argsJson).map(argument =>
            argument && argument.__bytes
              ? Uint8Array.from(atob(argument.__bytes), char => char.charCodeAt(0))
              : argument);
          const promise = globalThis.__cyreneInvokeRaw(name, args);
          globalThis.__lastPromiseSettled = false;
          globalThis.__lastResult = undefined;
          globalThis.__lastError = undefined;
          promise.then(value => { globalThis.__lastResult = value; globalThis.__lastPromiseSettled = true; },
                       error => { globalThis.__lastError = String(error?.message || error); globalThis.__lastPromiseSettled = true; });
          return true;
        };
        globalThis.__cyreneInvokeRaw = async (name, args) => {
          if (name === 'executeCoreDrawRequest') args[0].peopleCache = globalThis.__peopleCache;
          return JSON.stringify(await CyreneCore[name](...args));
        };
        """;

    private const string CryptoPatch = """
        (() => {
          const orig = crypto.subtle.decrypt.bind(crypto.subtle);
          crypto.subtle.decrypt = async (algo, key, data) => orig(algo, key, data);
          return true;
        })()
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

    private static object?[] PrepareArgs(object?[] args) => args
        .Select(argument => argument is byte[] bytes ? (object)new { __bytes = Convert.ToBase64String(bytes) } : argument)
        .ToArray();

    public Task<JsonElement> InvokeExpressionAsync(string jsExpression)
    {
        var wrapped = string.Concat(
            "(() => { globalThis.__lastPromiseSettled = false; globalThis.__lastResult = undefined; globalThis.__lastError = undefined; ",
            "Promise.resolve(", jsExpression, ").then(v => { globalThis.__lastResult = JSON.stringify(v); globalThis.__lastPromiseSettled = true; }, ",
            "e => { globalThis.__lastError = String(e?.message || e); globalThis.__lastPromiseSettled = true; }); return true; })()");
        var completion = new TaskCompletionSource<JsonElement>(TaskCreationOptions.RunContinuationsAsynchronously);
        _queue.Add(() =>
        {
            try
            {
                _engine.Evaluate(wrapped);
                var result = WaitForSettledResult();
                var serialized = result.IsUndefined() ? "undefined" : result.ToString();
                if (serialized == "undefined")
                {
                    completion.SetResult(default);
                    return null;
                }
                using var document = JsonDocument.Parse(serialized);
                completion.SetResult(document.RootElement.Clone());
            }
            catch (Exception error)
            {
                completion.SetException(error);
            }
            return null;
        });
        return completion.Task;
    }

    private JsValue WaitForSettledResult()
    {
        var attempt = 0;
        while (_engine.Evaluate("globalThis.__lastPromiseSettled === true").AsBoolean() == false)
        {
        _engine.Advanced.ProcessTasks();
            if (attempt++ > 5_000_000) throw new InvalidOperationException("表达式未在限定步数内完成");
        }
        var error = _engine.Evaluate("globalThis.__lastError");
        if (!error.IsUndefined() && error.AsString().Length > 0)
        {
            throw new InvalidOperationException($"表达式执行失败：{error.AsString()}");
        }
        return _engine.Evaluate("globalThis.__lastResult");
    }

    private JsonElement InvokeOnEngine(string name, object?[] args)
    {
        var argsJson = JsonSerializer.Serialize(PrepareArgs(args));
        var expression = $"__cyreneInvokeDeferred('{name}', {JsonSerializer.Serialize(argsJson)})";
        JsValue result;
        try
        {
            result = _engine.Evaluate(expression);
            if (result.IsUndefined())
            {
                return default;
            }
            result = WaitForSettledResult();
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
        _engine.SetValue("__hostUtf8Encode", new ClrFunction(_engine, "__hostUtf8Encode", (_, args) =>
            JsValue.FromObject(_engine, Convert.ToBase64String(Encoding.UTF8.GetBytes(args[0].AsString())))));
        _engine.SetValue("__hostUtf8Decode", new ClrFunction(_engine, "__hostUtf8Decode", (_, args) =>
            JsValue.FromObject(_engine, Encoding.UTF8.GetString(Convert.FromBase64String(args[0].AsString())))));
        _engine.SetValue("__hostSha256", new ClrFunction(_engine, "__hostSha256", (_, args) =>
            JsValue.FromObject(_engine, Convert.ToBase64String(SHA256.HashData(Convert.FromBase64String(args[0].AsString()))))));
        _engine.SetValue("__hostPbkdf2", new ClrFunction(_engine, "__hostPbkdf2", (_, args) =>
        {
            var material = Convert.FromBase64String(args[0].AsString());
            var salt = Convert.FromBase64String(args[1].AsString());
            var iterations = (int)args[2].AsNumber();
            var derived = Rfc2898DeriveBytes.Pbkdf2(material, salt, iterations, HashAlgorithmName.SHA256, 32);
            return JsValue.FromObject(_engine, Convert.ToBase64String(derived));
        }));
        _engine.SetValue("__hostAesGcmDecryptJson", new ClrFunction(_engine, "__hostAesGcmDecryptJson", (_, args) =>
        {
            using var document = JsonDocument.Parse(args[0].AsString());
            var root = document.RootElement;
            var key = Convert.FromBase64String(root.GetProperty("key").GetString());
            var iv = Convert.FromBase64String(root.GetProperty("iv").GetString());
            var data = Convert.FromBase64String(root.GetProperty("data").GetString());
            var additionalData = Convert.FromBase64String(root.GetProperty("aad").GetString());
            const int tagLength = 16;
            var tag = data[^tagLength..];
            var ciphertext = data[..^tagLength];
            using var aes = new AesGcm(key, tagLength);
            var plain = new byte[ciphertext.Length];
            aes.Decrypt(iv, ciphertext, tag, plain, additionalData);
            return JsValue.FromObject(_engine, Convert.ToBase64String(plain));
        }));
        _engine.SetValue("__hostEd25519Verify", new ClrFunction(_engine, "__hostEd25519Verify", (_, args) =>
        {
            var publicKey = Convert.FromBase64String(args[0].AsString());
            var signature = Convert.FromBase64String(args[1].AsString());
            var data = Convert.FromBase64String(args[2].AsString());
            var signer = new Ed25519Signer();
            signer.Init(false, new Ed25519PublicKeyParameters(publicKey, 0));
            signer.BlockUpdate(data, 0, data.Length);
            return JsValue.FromObject(_engine, signer.VerifySignature(signature));
        }));
        _engine.Execute(InvokeBootstrap);
        _engine.SetValue("__cyreneSha256Hex", new ClrFunction(_engine, "__cyreneSha256Hex", (_, args) =>
        {
            var bytes = args[0].ToObject() is object[] values
                ? values.Select(value => (byte)Convert.ToByte(value)).ToArray()
                : Array.Empty<byte>();
            return JsValue.FromObject(_engine, Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant());
        }));
        _engine.Advanced.ProcessTasks();
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
