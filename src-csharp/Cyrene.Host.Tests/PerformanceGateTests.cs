using System.Diagnostics;
using System.Text.Json;
using Cyrene.Host;

namespace Cyrene.Host.Tests;

public class PerformanceGateTests : IDisposable
{
    private readonly JintCoreHost _core = new(Path.Combine(AppContext.BaseDirectory, "Assets", "cyrene-core-bundle.js"));
    private readonly PluginPackageLoader _loader = null!;

    public PerformanceGateTests()
    {
        _loader = new PluginPackageLoader(_core);
    }

    public void Dispose() => _core.Dispose();

    private static JsonElement DrawState(int peopleCount)
    {
        var names = Enumerable.Range(0, peopleCount).Select(index => new { id = $"p{index}", cn = $"姓名{index}", gender = index % 2 == 0 ? "male" : "female" });
        var lists = new { lists = new Dictionary<string, object> { ["list-1"] = new { names = names.ToArray() } } };
        return JsonSerializer.SerializeToElement(new
        {
            names = lists,
            balance = new { enabled = true },
            statistics = new { counts = new { }, totalCount = 0 },
            records = Array.Empty<object>()
        });
    }

    [Fact]
    public async Task DrawTransaction_LatencyThroughJint()
    {
        var state = DrawState(500);
        var watch = Stopwatch.StartNew();
        for (var index = 0; index < 100; index += 1)
        {
            var result = await _core.InvokeAsync("executeCoreDrawRequest", new Dictionary<string, object?>
            {
                ["input"] = new Dictionary<string, object?> { ["listId"] = "list-1", ["target"] = "people", ["count"] = 1, ["allowDuplicates"] = false, ["gender"] = "all" },
                ["caller"] = new Dictionary<string, object?> { ["kind"] = "core-ui", ["pluginId"] = "core" },
                ["state"] = state
            });
            Assert.Equal(1, result.GetProperty("receipt").GetProperty("count").GetInt32());
        }
        watch.Stop();
        var meanMs = watch.Elapsed.TotalMilliseconds / 100;
        Assert.True(meanMs < 25, $"经 Jint 的抽取事务平均耗时 {meanMs:F2}ms 超出门禁 25ms");
    }

    [Fact]
    public async Task BalanceSelection_LatencyThroughJint()
    {
        var people = Enumerable.Range(0, 500).Select(index => JsonSerializer.SerializeToElement(new { id = $"p{index}", cn = $"姓名{index}" })).ToArray();
        var counts = JsonSerializer.SerializeToElement(Enumerable.Range(0, 500).ToDictionary(index => $"p{index}", index => index % 20));
        var settings = JsonSerializer.SerializeToElement(new { enabled = true });
        var watch = Stopwatch.StartNew();
        for (var index = 0; index < 50; index += 1)
        {
            var result = await _core.InvokeAsync("computeCyreneBalanceProbability",
                JsonSerializer.SerializeToElement(people), JsonSerializer.SerializeToElement(Array.Empty<object>()), counts, settings);
            Assert.True(result.EnumerateObject().Any());
        }
        watch.Stop();
        var meanMs = watch.Elapsed.TotalMilliseconds / 50;
        Assert.True(meanMs < 100, $"经 Jint 的平衡选择平均耗时 {meanMs:F2}ms 超出门禁 100ms");
    }

    [Fact]
    public async Task PluginLoad_LatencyThroughFullStack()
    {
        var bytes = File.ReadAllBytes(Path.Combine(AppContext.BaseDirectory, "fixtures", "ui-demo-v2-1.0.0.cnrp"));
        var watch = Stopwatch.StartNew();
        for (var index = 0; index < 5; index += 1)
        {
            var pkg = await _loader.LoadAsync(bytes);
            Assert.Equal(2, pkg.GetProperty("manifest").GetProperty("sdkVersion").GetInt32());
        }
        watch.Stop();
        var meanMs = watch.Elapsed.TotalMilliseconds / 5;
        Assert.True(meanMs < 2000, $"插件全栈加载平均耗时 {meanMs:F1}ms 超出门禁 2000ms");
    }
}
