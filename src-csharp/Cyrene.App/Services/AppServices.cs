using System.IO;
using Cyrene.Core.Bridge;
using Cyrene.Host;

namespace Cyrene.App.Services;

public sealed class AppServices : IDisposable
{
    public JintCoreHost Core { get; }
    public DefaultHostBridge Bridge { get; }
    public SecureHostBridge SecureBridge { get; }
    public SettingsService Settings { get; }
    public RecordsService Records { get; }
    public FileSystemHostStorage Storage { get; }

    public AppServices()
    {
        var appDataRoot = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "CyreneNameRoller", "data");
        var bundlePath = Path.Combine(AppContext.BaseDirectory, "Assets", "cyrene-core-bundle.js");
        Core = new JintCoreHost(bundlePath);
        Storage = new FileSystemHostStorage(appDataRoot);
        Bridge = new DefaultHostBridge(Storage);
        SecureBridge = new SecureHostBridge(Bridge, new EmptyPermissions());
        Settings = new SettingsService(Core, Bridge);
        Records = new RecordsService(Core, Bridge);
    }

    public void Dispose()
    {
        Core.Dispose();
    }

    private sealed class EmptyPermissions : IHostBridgePermissionProvider
    {
        public IReadOnlySet<string> PermissionsFor(string pluginId) => new HashSet<string>();
    }
}
