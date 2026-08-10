using System.Text.Json;

namespace Cyrene.Core.Bridge;

public sealed class HostBridgeException : Exception
{
    public string Code { get; }

    public HostBridgeException(string code, string message) : base(message)
    {
        Code = code;
    }
}

public interface IHostBridgePermissionProvider
{
    IReadOnlySet<string> PermissionsFor(string pluginId);
}

public interface IHostBridge
{
    Task<JsonElement> InvokeAsync(string pluginId, string method, JsonElement args, CancellationToken cancellationToken = default);
}
