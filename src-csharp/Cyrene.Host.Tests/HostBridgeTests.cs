using System.Text.Json;
using Cyrene.Core.Bridge;
using Cyrene.Host;

namespace Cyrene.Host.Tests;

public class HostBridgeTests : IDisposable
{
    private readonly string _storageRoot = Path.Combine(Path.GetTempPath(), $"cyrene-bridge-test-{Guid.NewGuid():N}");
    private readonly DefaultHostBridge _bridge;

    public HostBridgeTests()
    {
        _bridge = new DefaultHostBridge(new FileSystemHostStorage(_storageRoot));
    }

    public void Dispose()
    {
        try { Directory.Delete(_storageRoot, recursive: true); } catch { }
    }

    [Fact]
    public async Task Storage_RoundTripsPerPlugin()
    {
        var written = JsonSerializer.SerializeToElement(new { enabled = true, count = 3 });
        await _bridge.InvokeAsync("cn.example.demo", "storage.write", JsonSerializer.SerializeToElement(new { key = "settings", value = written }));

        var result = await _bridge.InvokeAsync("cn.example.demo", "storage.read", JsonSerializer.SerializeToElement(new { key = "settings" }));
        Assert.Equal(true, result.GetProperty("enabled").GetBoolean());
        Assert.Equal(3, result.GetProperty("count").GetInt32());

        var other = await _bridge.InvokeAsync("cn.other.plugin", "storage.read", JsonSerializer.SerializeToElement(new { key = "settings" }));
        Assert.Equal(JsonValueKind.Null, other.ValueKind);
    }

    [Fact]
    public async Task OpenUrl_RejectsNonHttp()
    {
        var error = await Assert.ThrowsAsync<HostBridgeException>(() =>
            _bridge.InvokeAsync("plugin", "system.open-url", JsonSerializer.SerializeToElement(new { url = "file:///etc/passwd" })));
        Assert.Equal("HOST_BRIDGE_INVALID_ARGS", error.Code);
    }

    [Fact]
    public async Task SecureBridge_EnforcesPermissionGate()
    {
        var secure = new SecureHostBridge(_bridge, new StaticPermissions(new Dictionary<string, IReadOnlySet<string>>
        {
            ["cn.example.demo"] = new HashSet<string> { "storage:read" }
        }));

        await secure.InvokeAsync("cn.example.demo", "storage.read", JsonSerializer.SerializeToElement(new { key = "x" }));
        var denied = await Assert.ThrowsAsync<HostBridgeException>(() =>
            secure.InvokeAsync("cn.example.demo", "storage.write", JsonSerializer.SerializeToElement(new { key = "x", value = 1 })));
        Assert.Equal("PLUGIN_PERMISSION_DENIED", denied.Code);

        var unknown = await Assert.ThrowsAsync<HostBridgeException>(() =>
            secure.InvokeAsync("cn.example.demo", "system.evil", JsonSerializer.SerializeToElement(new { })));
        Assert.Equal("HOST_BRIDGE_UNKNOWN_METHOD", unknown.Code);
    }

    [Fact]
    public async Task SecureBridge_AppliesTimeout()
    {
        var slow = new SlowBridge();
        var secure = new SecureHostBridge(slow, new StaticPermissions(new Dictionary<string, IReadOnlySet<string>>
        {
            ["plugin"] = new HashSet<string> { "storage:read" }
        }), TimeSpan.FromMilliseconds(50));
        var stopped = new CancellationTokenSource();
        stopped.CancelAfter(3000);
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() =>
            secure.InvokeAsync("plugin", "storage.read", JsonSerializer.SerializeToElement(new { key = "x" }), stopped.Token));
    }

    private sealed class StaticPermissions(Dictionary<string, IReadOnlySet<string>> permissions) : IHostBridgePermissionProvider
    {
        public IReadOnlySet<string> PermissionsFor(string pluginId) =>
            permissions.TryGetValue(pluginId, out var set) ? set : new HashSet<string>();
    }

    private sealed class SlowBridge : IHostBridge
    {
        public async Task<JsonElement> InvokeAsync(string pluginId, string method, JsonElement args, CancellationToken cancellationToken = default)
        {
            await Task.Delay(TimeSpan.FromSeconds(10), cancellationToken);
            return default;
        }
    }
}
