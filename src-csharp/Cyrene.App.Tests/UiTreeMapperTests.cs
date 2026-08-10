using Cyrene.App.Rendering;

namespace Cyrene.App.Tests;

public class UiTreeMapperTests
{
    private static string LoadFixture() =>
        File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "fixtures", "sample-render-plan.json"));

    [Fact]
    public void Map_LoadsGoldenPlan_RootIsUserControl()
    {
        var root = UiTreeMapper.Map(LoadFixture());
        Assert.Equal("UserControl", root.Component);
        Assert.Equal("示例页面", root.Props["Title"]);
    }

    [Fact]
    public void Map_ButtonNode_MapsToFluentAvaloniaWithAction()
    {
        var root = UiTreeMapper.Map(LoadFixture());
        var button = root.FindById("btn");
        Assert.NotNull(button);
        Assert.Equal("Button", button!.Component);
        Assert.Equal("primary", button.Props["Variant"]);
    }

    [Fact]
    public void Map_ToggleNode_ResolvesBindingValue()
    {
        var root = UiTreeMapper.Map(LoadFixture());
        var toggle = root.FindById("t1");
        Assert.NotNull(toggle);
        Assert.Equal("ToggleSwitch", toggle!.Component);
        Assert.Equal(true, toggle.Props["Value"]);
    }

    [Fact]
    public void Map_ProgressNode_ResolvesBindingValue()
    {
        var root = UiTreeMapper.Map(LoadFixture());
        var progress = root.FindById("p1");
        Assert.NotNull(progress);
        Assert.Equal("ProgressBar", progress!.Component);
        Assert.Equal(42d, progress!.Props["Value"]);
    }

    [Fact]
    public void Map_UnknownKind_Throws()
    {
        var invalid = """{ "schemaVersion": 1, "nodeCount": 1, "root": { "kind": "iframe", "id": "x" } }""";
        Assert.Throws<InvalidOperationException>(() => UiTreeMapper.Map(invalid));
    }
}
