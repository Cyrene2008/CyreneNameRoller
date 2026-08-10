using Cyrene.Host;

namespace Cyrene.Host.Tests;

public class HostBridgeContractParityTests : IDisposable
{
    private readonly JintCoreHost _host = new(Path.Combine(AppContext.BaseDirectory, "Assets", "cyrene-core-bundle.js"));

    public void Dispose() => _host.Dispose();

    [Fact]
    public async Task ContractTable_MatchesJsHostBridgeModule()
    {
        var jsMethods = await _host.InvokeExpressionAsync("CyreneCore.HOST_BRIDGE_METHODS");
        var jsPermissions = new Dictionary<string, string?>();
        foreach (var item in jsMethods.EnumerateArray())
        {
            var id = item.GetProperty("id").GetString()!;
            var permission = item.TryGetProperty("permission", out var value) && value.ValueKind == System.Text.Json.JsonValueKind.String
                ? value.GetString()
                : null;
            jsPermissions[id] = permission;
        }

        var csharpIds = HostBridgeContract.Methods.Select(item => item.Key).ToHashSet();
        Assert.Equal(jsPermissions.Keys.ToHashSet(), csharpIds);

        foreach (var (method, permission) in HostBridgeContract.Methods)
        {
            Assert.Equal(permission, jsPermissions[method]);
        }
    }

    [Fact]
    public async Task ContractTable_PermissionsExistInManifestPermissionSet()
    {
        var manifestPermissions = await _host.InvokeExpressionAsync("[...CyreneCore.PLUGIN_PERMISSIONS]");
        var permissionSet = manifestPermissions.EnumerateArray().Select(item => item.GetString()).ToHashSet();
        foreach (var (_, permission) in HostBridgeContract.Methods)
        {
            if (permission is not null) Assert.Contains(permission, permissionSet);
        }
    }
}

