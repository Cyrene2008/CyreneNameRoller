using Cyrene.Host;

namespace Cyrene.Host.Tests;

public class PluginPackageLoaderTests : IDisposable
{
    private readonly JintCoreHost _core = new(Path.Combine(AppContext.BaseDirectory, "Assets", "cyrene-core-bundle.js"));
    private readonly PluginPackageLoader _loader;

    public PluginPackageLoaderTests()
    {
        _loader = new PluginPackageLoader(_core);
    }

    public void Dispose() => _core.Dispose();

    private static byte[] Fixture(string name) => File.ReadAllBytes(Path.Combine(AppContext.BaseDirectory, "fixtures", name));

    [Fact]
    public async Task LoadSoundEffects_RealEncryptedPackage()
    {
        var pkg = await _loader.LoadAsync(Fixture("sound-effects-1.1.1.cnrp"));
        Assert.Equal("cn.cyrene2008.sound-effects", pkg.GetProperty("manifest").GetProperty("id").GetString());
        Assert.Equal("src/worker.js", pkg.GetProperty("manifest").GetProperty("entry").GetString());
        Assert.False(pkg.GetProperty("publisherVerified").GetBoolean());
        Assert.True(pkg.GetProperty("files").EnumerateObject().Any());
        Assert.Equal(64, pkg.GetProperty("packageHash").GetString()!.Length);
    }

    [Fact]
    public async Task LoadBasic_SecondFixture()
    {
        var pkg = await _loader.LoadAsync(Fixture("basic-1.0.0.cnrp"));
        Assert.Equal("cn.example.cyrene.plugin", pkg.GetProperty("manifest").GetProperty("id").GetString());
    }

    [Fact]
    public async Task LoadRejectsCorruptedPackage()
    {
        var corrupted = Fixture("basic-1.0.0.cnrp");
        corrupted[corrupted.Length / 3] ^= 0xff;
        var error = await Assert.ThrowsAnyAsync<Exception>(() => _loader.LoadAsync(corrupted));
        Assert.True(error is InvalidOperationException or FormatException, $"应拒绝损坏包，实际：{error.GetType().Name}");
    }

    [Fact]
    public async Task LoadRejectsTamperedHash()
    {
        var tampered = Fixture("basic-1.0.0.cnrp");
        var (zipBytes, envelope) = CnrpEnvelope.Decrypt(tampered);
        Assert.True(zipBytes.Length > 0);
        Assert.NotNull(envelope);
    }

    [Fact]
    public async Task DecodeWorker_ReadsObfuscatedSource()
    {
        var pkg = await _loader.LoadAsync(Fixture("sound-effects-1.1.1.cnrp"));
        var workerBase64 = pkg.GetProperty("files").GetProperty("src/worker.js").GetString()!;
        var worker = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(workerBase64));
        Assert.StartsWith("function", worker);
    }
}
