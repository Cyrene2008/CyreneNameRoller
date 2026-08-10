using System.Text.Json;
using Cyrene.Host;

namespace Cyrene.App.Services;

public sealed class SettingsService
{
    private const string SettingsKey = "settings";
    private readonly JintCoreHost _core;
    private readonly DefaultHostBridge _bridge;
    private readonly string _pluginId;

    public SettingsService(JintCoreHost core, DefaultHostBridge bridge, string pluginId = "core")
    {
        _core = core;
        _bridge = bridge;
        _pluginId = pluginId;
    }

    public async Task<JsonElement> LoadAsync(CancellationToken cancellationToken = default)
    {
        var stored = await _bridge.InvokeAsync(_pluginId, "storage.read", JsonSerializer.SerializeToElement(new { key = SettingsKey }), cancellationToken);
        var storedElement = stored.ValueKind == JsonValueKind.Null
            ? JsonSerializer.SerializeToElement(null as object)
            : stored;
        var migrated = await _core.InvokeAsync("normalizeStoredSettings", storedElement);
        return migrated;
    }

    public async Task SaveAsync(JsonElement settings, CancellationToken cancellationToken = default)
    {
        await _bridge.InvokeAsync(_pluginId, "storage.write", JsonSerializer.SerializeToElement(new { key = SettingsKey, value = settings }), cancellationToken);
    }
}
