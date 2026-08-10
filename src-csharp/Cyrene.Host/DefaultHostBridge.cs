using System.Diagnostics;
using System.Net.Http.Headers;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using Cyrene.Core.Bridge;

namespace Cyrene.Host;

public sealed class HostBridgeExceptionHandler : IHostBridge
{
    private readonly IHostBridge _inner;

    public HostBridgeExceptionHandler(IHostBridge inner)
    {
        _inner = inner;
    }

    public async Task<JsonElement> InvokeAsync(string pluginId, string method, JsonElement args, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _inner.InvokeAsync(pluginId, method, args, cancellationToken);
        }
        catch (HostBridgeException)
        {
            throw;
        }
        catch (Exception error)
        {
            throw new HostBridgeException("HOST_BRIDGE_FAILED", $"{method} 执行失败：{error.Message}");
        }
    }
}

public sealed class DefaultHostBridge : IHostBridge
{
    public delegate Task<JsonElement>? HostDelegate(JsonElement args, CancellationToken cancellationToken);

    private readonly IHostStorage _storage;
    private readonly HttpClient _http;

    public HostDelegate? ClipboardRead { get; set; }
    public HostDelegate? ClipboardWrite { get; set; }
    public HostDelegate? SelectFile { get; set; }
    public HostDelegate? SelectDirectory { get; set; }
    public HostDelegate? RevealFile { get; set; }
    public HostDelegate? PlayAudio { get; set; }
    public HostDelegate? NotificationsShow { get; set; }
    public HostDelegate? ExecuteSystemCommand { get; set; }

    public DefaultHostBridge(IHostStorage storage, HttpClient? http = null)
    {
        _storage = storage;
        _http = http ?? new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
    }

    public async Task<JsonElement> InvokeAsync(string pluginId, string method, JsonElement args, CancellationToken cancellationToken = default)
    {
        switch (method)
        {
            case "runtime.platform":
                return JsonSerializer.SerializeToElement(new
                {
                    runtime = "desktop",
                    os = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) ? "windows"
                        : RuntimeInformation.IsOSPlatform(OSPlatform.OSX) ? "macos"
                        : RuntimeInformation.IsOSPlatform(OSPlatform.Linux) ? "linux" : "unknown",
                    desktop = true,
                    arch = RuntimeInformation.ProcessArchitecture.ToString()
                });
            case "runtime.capabilities":
                return JsonSerializer.SerializeToElement(new { desktop = true });
            case "host.describe":
                return JsonSerializer.SerializeToElement(new { name = "Cyrene Name Roller (C#)", host = "avalonia" });
            case "storage.read":
                return await _storage.ReadAsync(pluginId, Require(args, "key").GetString()!, cancellationToken);
            case "storage.write":
                await _storage.WriteAsync(pluginId, Require(args, "key").GetString()!, args.GetProperty("value"), cancellationToken);
                return JsonSerializer.SerializeToElement(new { ok = true });
            case "dependency.storage.read":
                return await _storage.ReadAsync(Require(args, "pluginId").GetString()!, Require(args, "key").GetString()!, cancellationToken);
            case "names.read":
            case "records.read":
            case "statistics.read":
            case "balance.read":
            case "resources.query":
                throw new HostBridgeException("HOST_BRIDGE_NOT_IMPLEMENTED", $"{method} 需经共享核心快照注入");
            case "draw.execute":
            case "transactions.execute":
                throw new HostBridgeException("HOST_BRIDGE_NOT_IMPLEMENTED", $"{method} 需经 Jint 共享核心执行");
            case "notifications.show":
                return NotificationsShow is null
                    ? throw new HostBridgeException("HOST_BRIDGE_NOT_AVAILABLE", "通知能力未注入")
                    : await NotificationsShow(args, cancellationToken);
            case "audio.select":
                return SelectFile is null
                    ? throw new HostBridgeException("HOST_BRIDGE_NOT_AVAILABLE", "文件选择能力未注入")
                    : await SelectFile(JsonSerializer.SerializeToElement(new { accept = "audio/*,.mp3,.m4a,.wav,.flac,.ogg" }), cancellationToken);
            case "audio.play":
                return PlayAudio is null
                    ? throw new HostBridgeException("HOST_BRIDGE_NOT_AVAILABLE", "音频播放能力未注入")
                    : await PlayAudio(args, cancellationToken);
            case "system.open-url":
                return OpenUrl(Require(args, "url").GetString()!);
            case "system.select-file":
                return SelectFile is null
                    ? throw new HostBridgeException("HOST_BRIDGE_NOT_AVAILABLE", "文件选择能力未注入")
                    : await SelectFile(args, cancellationToken);
            case "system.select-directory":
                return SelectDirectory is null
                    ? throw new HostBridgeException("HOST_BRIDGE_NOT_AVAILABLE", "目录选择能力未注入")
                    : await SelectDirectory(args, cancellationToken);
            case "system.clipboard-read":
                return ClipboardRead is null
                    ? throw new HostBridgeException("HOST_BRIDGE_NOT_AVAILABLE", "剪贴板能力未注入")
                    : await ClipboardRead(args, cancellationToken);
            case "system.clipboard-write":
                return ClipboardWrite is null
                    ? throw new HostBridgeException("HOST_BRIDGE_NOT_AVAILABLE", "剪贴板能力未注入")
                    : await ClipboardWrite(args, cancellationToken);
            case "system.reveal-file":
                return RevealFile is null
                    ? throw new HostBridgeException("HOST_BRIDGE_NOT_AVAILABLE", "文件定位能力未注入")
                    : await RevealFile(args, cancellationToken);
            case "system.execute":
                return ExecuteSystemCommand is null
                    ? throw new HostBridgeException("HOST_BRIDGE_NOT_AVAILABLE", "系统命令能力未注入")
                    : await ExecuteSystemCommand(args, cancellationToken);
            case "http.fetch":
                return await FetchAsync(args, cancellationToken);
            case "ui.render":
            case "ui.action":
                throw new HostBridgeException("HOST_BRIDGE_NOT_IMPLEMENTED", $"{method} 待 M5 插件宿主接入");
            default:
                throw new HostBridgeException("HOST_BRIDGE_UNKNOWN_METHOD", $"未知宿主方法：{method}");
        }
    }

    private static JsonElement Require(JsonElement args, string key)
    {
        if (!args.TryGetProperty(key, out var value))
        {
            throw new HostBridgeException("HOST_BRIDGE_INVALID_ARGS", $"缺少参数 {key}");
        }
        return value;
    }

    private static JsonElement OpenUrl(string url)
    {
        if (string.IsNullOrWhiteSpace(url) || !Uri.TryCreate(url, UriKind.Absolute, out var uri) || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            throw new HostBridgeException("HOST_BRIDGE_INVALID_ARGS", "open-url 需要合法 http/https 链接");
        }
        Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
        return JsonSerializer.SerializeToElement(new { ok = true });
    }

    private async Task<JsonElement> FetchAsync(JsonElement args, CancellationToken cancellationToken)
    {
        var url = Require(args, "url").GetString()!;
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            throw new HostBridgeException("HOST_BRIDGE_INVALID_ARGS", "fetch 需要合法 http/https 链接");
        }
        using var request = new HttpRequestMessage(HttpMethod.Get, uri);
        var response = await _http.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        return JsonSerializer.SerializeToElement(new
        {
            ok = response.IsSuccessStatusCode,
            status = (int)response.StatusCode,
            body
        });
    }
}

public interface IHostStorage
{
    Task<JsonElement> ReadAsync(string pluginId, string key, CancellationToken cancellationToken = default);
    Task WriteAsync(string pluginId, string key, JsonElement value, CancellationToken cancellationToken = default);
}

public sealed class FileSystemHostStorage : IHostStorage
{
    private readonly string _root;

    public FileSystemHostStorage(string root)
    {
        _root = root;
    }

    public async Task<JsonElement> ReadAsync(string pluginId, string key, CancellationToken cancellationToken = default)
    {
        var file = PathFor(pluginId, key);
        if (!File.Exists(file)) return JsonSerializer.SerializeToElement(null as object);
        var json = await File.ReadAllTextAsync(file, Encoding.UTF8, cancellationToken);
        using var document = JsonDocument.Parse(json);
        return document.RootElement.Clone();
    }

    public async Task WriteAsync(string pluginId, string key, JsonElement value, CancellationToken cancellationToken = default)
    {
        var file = PathFor(pluginId, key);
        Directory.CreateDirectory(Path.GetDirectoryName(file)!);
        await File.WriteAllTextAsync(file, value.GetRawText(), Encoding.UTF8, cancellationToken);
    }

    private string PathFor(string pluginId, string key)
    {
        var safePluginId = Sanitize(pluginId);
        var safeKey = Sanitize(key);
        return Path.Combine(_root, safePluginId, $"{safeKey}.json");
    }

    private static string Sanitize(string value)
    {
        var sanitized = new string(value.Where(character => char.IsLetterOrDigit(character) || character is '.' or '-' or '_').ToArray());
        return string.IsNullOrEmpty(sanitized) ? "default" : sanitized;
    }
}
