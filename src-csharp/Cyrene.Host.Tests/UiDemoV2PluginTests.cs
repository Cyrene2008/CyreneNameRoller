using System.Text;
using System.Text.Json;
using Cyrene.Core.Bridge;
using Cyrene.Host;

namespace Cyrene.Host.Tests;

public class UiDemoV2PluginTests : IDisposable
{
    private readonly JintCoreHost _core = new(Path.Combine(AppContext.BaseDirectory, "Assets", "cyrene-core-bundle.js"));
    private readonly PluginPackageLoader _loader;

    public UiDemoV2PluginTests()
    {
        _loader = new PluginPackageLoader(_core);
    }

    public void Dispose() => _core.Dispose();

    private static byte[] Fixture(string name) => File.ReadAllBytes(Path.Combine(AppContext.BaseDirectory, "fixtures", name));

    [Fact]
    public async Task LoadV2Package_ManifestHasSdkAndUiSection()
    {
        var pkg = await _loader.LoadAsync(Fixture("ui-demo-v2-1.0.0.cnrp"));
        var manifest = pkg.GetProperty("manifest");
        Assert.Equal(2, manifest.GetProperty("sdkVersion").GetInt32());
        Assert.Equal("cn.cyrene2008.ui-demo-v2", manifest.GetProperty("id").GetString());
        Assert.Equal("ui/main.json", manifest.GetProperty("ui").GetProperty("pages")[0].GetProperty("source").GetString());
    }

    [Fact]
    public async Task LoadV2Package_UiTreeValidatedBySharedCore()
    {
        var pkg = await _loader.LoadAsync(Fixture("ui-demo-v2-1.0.0.cnrp"));
        var uiPages = pkg.GetProperty("uiPages");
        var page = Assert.Single(uiPages.EnumerateArray());
        Assert.Equal("ui-demo-v2.main", page.GetProperty("id").GetString());
        var tree = page.GetProperty("tree");
        Assert.Equal(1, tree.GetProperty("schemaVersion").GetInt32());
        Assert.Equal("page", tree.GetProperty("root").GetProperty("type").GetString());
        Assert.Equal(10, tree.GetProperty("nodeCount").GetInt32());
    }

    [Fact]
    public async Task LoadV2Package_RenderPlanFeedsAvaloniaMapper()
    {
        var pkg = await _loader.LoadAsync(Fixture("ui-demo-v2-1.0.0.cnrp"));
        var page = pkg.GetProperty("uiPages")[0];
        var tree = page.GetProperty("tree");
        var dataContext = JsonSerializer.SerializeToElement(new
        {
            pluginStorage = new { enabled = true, volume = 50, mode = "a" },
            uiState = new { progress = 42 }
        });
        var plan = await _core.InvokeAsync("buildRenderPlan", tree, dataContext);
        var planJson = plan.GetRawText();
        var root = UiTreeMapper.Map(planJson);
        Assert.Equal("UserControl", root.Component);
        var button = root.FindById("btn");
        Assert.NotNull(button);
        Assert.Equal("Button", button!.Component);
        Assert.Equal("primary", button.Props["Variant"]);
        var toggle = root.FindById("t1");
        Assert.Equal("ToggleSwitch", toggle!.Component);
        Assert.Equal(true, toggle.Props["Value"]);
        var progress = root.FindById("p1");
        Assert.Equal(42d, progress!.Props["Value"]);
    }

    [Fact]
    public async Task LoadV2Package_TreeMatchesGoldenRenderPlan()
    {
        var pkg = await _loader.LoadAsync(Fixture("ui-demo-v2-1.0.0.cnrp"));
        var tree = pkg.GetProperty("uiPages")[0].GetProperty("tree");
        var dataContext = JsonSerializer.SerializeToElement(new
        {
            pluginStorage = new { enabled = true, volume = 50, mode = "a" },
            uiState = new { progress = 42 }
        });
        var plan = await _core.InvokeAsync("buildRenderPlan", tree, dataContext);
        var toggle = plan.GetProperty("root").GetProperty("children")[0].GetProperty("children")[0].GetProperty("children")[0];
        Assert.Equal(true, toggle.GetProperty("binding").GetProperty("value").GetBoolean());
        Assert.Equal("plugin.storage.enabled", toggle.GetProperty("binding").GetProperty("path").GetString());
    }
}
