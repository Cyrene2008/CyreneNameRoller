using System.Text.Json;
using Cyrene.Core.Bridge;

namespace Cyrene.Host;

public sealed class SecureHostBridge : IHostBridge
{
    private readonly IHostBridge _inner;
    private readonly IHostBridgePermissionProvider _permissions;
    private readonly TimeSpan _timeout;

    public SecureHostBridge(IHostBridge inner, IHostBridgePermissionProvider permissions, TimeSpan? timeout = null)
    {
        _inner = inner;
        _permissions = permissions;
        _timeout = timeout ?? TimeSpan.FromSeconds(15);
    }

    public async Task<JsonElement> InvokeAsync(string pluginId, string method, JsonElement args, CancellationToken cancellationToken = default)
    {
        if (!HostBridgeContract.TryGetPermission(method, out var requiredPermission))
        {
            throw new HostBridgeException("HOST_BRIDGE_UNKNOWN_METHOD", $"未知宿主方法：{method}");
        }
        if (requiredPermission is not null && !_permissions.PermissionsFor(pluginId).Contains(requiredPermission))
        {
            throw new HostBridgeException("PLUGIN_PERMISSION_DENIED", $"插件未获授权：{requiredPermission}");
        }
        using var timeoutSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutSource.CancelAfter(_timeout);
        return await _inner.InvokeAsync(pluginId, method, args, timeoutSource.Token);
    }
}

public static class HostBridgeContract
{
    public static readonly IReadOnlyList<KeyValuePair<string, string?>> Methods = new[]
    {
        new KeyValuePair<string, string?>("runtime.platform", null),
        new KeyValuePair<string, string?>("runtime.capabilities", null),
        new KeyValuePair<string, string?>("host.describe", null),
        new KeyValuePair<string, string?>("storage.read", "storage:read"),
        new KeyValuePair<string, string?>("storage.write", "storage:write"),
        new KeyValuePair<string, string?>("dependency.storage.read", null),
        new KeyValuePair<string, string?>("names.read", "names:read"),
        new KeyValuePair<string, string?>("records.read", "records:read"),
        new KeyValuePair<string, string?>("statistics.read", "statistics:read"),
        new KeyValuePair<string, string?>("balance.read", "balance:read"),
        new KeyValuePair<string, string?>("resources.query", null),
        new KeyValuePair<string, string?>("draw.execute", "draw:execute"),
        new KeyValuePair<string, string?>("transactions.execute", null),
        new KeyValuePair<string, string?>("notifications.show", "notifications:show"),
        new KeyValuePair<string, string?>("audio.select", "audio:select"),
        new KeyValuePair<string, string?>("audio.play", "audio:play"),
        new KeyValuePair<string, string?>("system.open-url", "system:open-url"),
        new KeyValuePair<string, string?>("system.select-file", "system:select-file"),
        new KeyValuePair<string, string?>("system.select-directory", "system:select-directory"),
        new KeyValuePair<string, string?>("system.clipboard-read", "system:clipboard-read"),
        new KeyValuePair<string, string?>("system.clipboard-write", "system:clipboard-write"),
        new KeyValuePair<string, string?>("system.reveal-file", "system:reveal-file"),
        new KeyValuePair<string, string?>("system.execute", "system:execute"),
        new KeyValuePair<string, string?>("ui.render", "ui:pages"),
        new KeyValuePair<string, string?>("ui.action", "ui:pages")
    };

    private static readonly IReadOnlyDictionary<string, string?> Table = Methods.ToDictionary(item => item.Key, item => item.Value);

    public static bool TryGetPermission(string method, out string? permission)
    {
        return Table.TryGetValue(method, out permission);
    }
}
