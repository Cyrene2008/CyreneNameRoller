using System.Text;
using System.Text.Json;
using Cyrene.Core.Bridge;
using Cyrene.Host;

namespace Cyrene.Host.Tests;

public class RecordingBridge : IHostBridge
{
    public List<(string Method, string Args)> Calls { get; } = [];
    private readonly IHostBridge _inner;

    public RecordingBridge(IHostBridge inner)
    {
        _inner = inner;
    }

    public async Task<JsonElement> InvokeAsync(string pluginId, string method, JsonElement args, CancellationToken cancellationToken = default)
    {
        Calls.Add((method, args.GetRawText()));
        return await _inner.InvokeAsync(pluginId, method, args, cancellationToken);
    }
}

public class JintPluginSandboxTests : IDisposable
{
    private readonly string _storageRoot = Path.Combine(Path.GetTempPath(), $"cyrene-sandbox-{Guid.NewGuid():N}");
    private readonly JintCoreHost _core = new(Path.Combine(AppContext.BaseDirectory, "Assets", "cyrene-core-bundle.js"));
    private readonly PluginPackageLoader _loader;
    private readonly DefaultHostBridge _bridge;
    private readonly RecordingBridge _recorder;

    public JintPluginSandboxTests()
    {
        _loader = new PluginPackageLoader(_core);
        _bridge = new DefaultHostBridge(new FileSystemHostStorage(_storageRoot))
        {
            PlayAudio = (_, _) => Task.FromResult(JsonSerializer.SerializeToElement(new { ok = true })),
            NotificationsShow = (_, _) => Task.FromResult(JsonSerializer.SerializeToElement(new { ok = true }))
        };
        _recorder = new RecordingBridge(_bridge);
    }

    public void Dispose()
    {
        _core.Dispose();
        try { Directory.Delete(_storageRoot, recursive: true); } catch { }
    }

    private async Task<string> LoadWorkerSourceAsync()
    {
        var workerFixture = Path.Combine(AppContext.BaseDirectory, "fixtures", "sound-effects-worker.bundle.js");
        if (File.Exists(workerFixture)) return await File.ReadAllTextAsync(workerFixture);
        var pkg = await _loader.LoadAsync(File.ReadAllBytes(Path.Combine(AppContext.BaseDirectory, "fixtures", "sound-effects-1.1.1.cnrp")));
        var workerBase64 = pkg.GetProperty("files").GetProperty("src/worker.js").GetString()!;
        return Encoding.UTF8.GetString(Convert.FromBase64String(workerBase64));
    }

    private async Task SeedAudioSettingsAsync()
    {
        var settings = JsonSerializer.SerializeToElement(new
        {
            enabled = true,
            volume = 0.7,
            playbackMode = "once",
            roller = new { dataUrl = "data:audio/wav;base64,UklGRg==", name = "ding.wav" }
        });
        await _bridge.InvokeAsync("cn.cyrene2008.sound-effects", "storage.write",
            JsonSerializer.SerializeToElement(new { key = "settings", value = settings }));
    }

    [Fact]
    public async Task Activate_CompletesAndOutboxesActivated()
    {
        var sandbox = new JintPluginSandbox(await LoadWorkerSourceAsync(), _recorder);
        await sandbox.ActivateAsync(JsonSerializer.SerializeToElement(new
        {
            pluginId = "cn.cyrene2008.sound-effects",
            platform = "desktop",
            capabilities = new { }
        }));
        var outbox = sandbox.DrainOutbox();
        Assert.Contains(outbox, message => message.Contains("\"activated\""));
        sandbox.Dispose();
    }



    [Fact]
    public async Task DrawResult_TriggersAudioPlayThroughBridge()
    {
        await SeedAudioSettingsAsync();
        var seedFile = Path.Combine(_storageRoot, "cn.cyrene2008.sound-effects", "settings.json");
        Assert.True(File.Exists(seedFile), $"种子文件缺失：{seedFile}");
        var directRead = await _bridge.InvokeAsync("cn.cyrene2008.sound-effects", "storage.read",
            JsonSerializer.SerializeToElement(new { key = "settings" }));
        Assert.True(directRead.TryGetProperty("roller", out var _), $"桥直读无 roller：{directRead.GetRawText()}");
        var sandbox = new JintPluginSandbox(await LoadWorkerSourceAsync(), _recorder);
        await sandbox.ActivateAsync(JsonSerializer.SerializeToElement(new
        {
            pluginId = "cn.cyrene2008.sound-effects",
            platform = "desktop",
            capabilities = new { }
        }));
        _recorder.Calls.Clear();

        await sandbox.PostEventAsync("roller:result", JsonSerializer.SerializeToElement(new
        {
            results = new[] { new { id = "p1", name = "张三" } }
        }));

        Assert.Contains(_recorder.Calls, call => call.Method == "audio.play");
        var play = _recorder.Calls.First(call => call.Method == "audio.play");
        using var playArgs = JsonDocument.Parse(play.Args);
        Assert.Equal("data:audio/wav;base64,UklGRg==", playArgs.RootElement.GetProperty("source").GetString());
        sandbox.Dispose();
    }

    [Fact]
    public async Task Event_StorageReadsThroughBridge()
    {
        await SeedAudioSettingsAsync();
        var sandbox = new JintPluginSandbox(await LoadWorkerSourceAsync(), _recorder);
        await sandbox.ActivateAsync(JsonSerializer.SerializeToElement(new
        {
            pluginId = "cn.cyrene2008.sound-effects",
            platform = "desktop",
            capabilities = new { }
        }));
        _recorder.Calls.Clear();

        await sandbox.PostEventAsync("roller:result", JsonSerializer.SerializeToElement(new { results = new[] { new { id = "p1", name = "张三" } } }));

        Assert.Contains(_recorder.Calls, call => call.Method == "storage.read");
        sandbox.Dispose();
    }

    [Fact]
    public async Task Deactivate_Completes()
    {
        var sandbox = new JintPluginSandbox(await LoadWorkerSourceAsync(), _recorder);
        await sandbox.ActivateAsync(JsonSerializer.SerializeToElement(new
        {
            pluginId = "cn.cyrene2008.sound-effects",
            platform = "desktop",
            capabilities = new { }
        }));
        await sandbox.DeactivateAsync();
        var outbox = sandbox.DrainOutbox();
        Assert.Contains(outbox, message => message.Contains("\"deactivated\""));
        sandbox.Dispose();
    }
}

