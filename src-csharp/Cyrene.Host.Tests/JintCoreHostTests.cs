using System.Text.Json;
using Cyrene.Host;

namespace Cyrene.Host.Tests;

public class JintCoreHostTests : IDisposable
{
    private readonly JintCoreHost _host = new(Path.Combine(AppContext.BaseDirectory, "Assets", "cyrene-core-bundle.js"));

    private static JsonElement DrawState() =>
        JsonDocument.Parse("""
            {
              "names": { "lists": { "list-1": { "names": [
                { "id": "p1", "cn": "张三", "gender": "male" },
                { "id": "p2", "cn": "李四", "gender": "male" },
                { "id": "p3", "cn": "王五", "gender": "female" }
              ] } } },
              "balance": { "enabled": true },
              "statistics": { "counts": {}, "totalCount": 0 },
              "records": []
            }
            """).RootElement;

    public void Dispose() => _host.Dispose();

    [Fact]
    public async Task DrawTransaction_CompletesAndCounts()
    {
        var state = DrawState();
        var result = await _host.InvokeAsync("executeCoreDrawRequest", new Dictionary<string, object?>
        {
            ["input"] = new Dictionary<string, object?> { ["listId"] = "list-1", ["target"] = "people", ["count"] = 1, ["allowDuplicates"] = false, ["gender"] = "all" },
            ["caller"] = new Dictionary<string, object?> { ["kind"] = "core-ui", ["pluginId"] = "core" },
            ["state"] = state
        });
        var receipt = result.GetProperty("receipt");

        Assert.Equal(1, receipt.GetProperty("count").GetInt32());
        Assert.Equal("cyrenenameroller-balance/v3", receipt.GetProperty("algorithm").GetString());
        Assert.Matches("^[0-9a-f-]{36}$", receipt.GetProperty("operationId").GetString()!);
        Assert.Equal(1, result.GetProperty("nextStatistics").GetProperty("totalCount").GetInt32());
    }

    [Fact]
    public async Task DrawTransaction_RejectsInvalidList()
    {
        var error = await Assert.ThrowsAsync<InvalidOperationException>(() => _host.InvokeAsync("executeCoreDrawRequest", new Dictionary<string, object?>
        {
            ["input"] = new Dictionary<string, object?> { ["listId"] = "missing", ["target"] = "people", ["count"] = 1, ["allowDuplicates"] = false, ["gender"] = "all" },
            ["caller"] = new Dictionary<string, object?> { ["kind"] = "core-ui", ["pluginId"] = "core" },
            ["state"] = DrawState()
        }));
        Assert.Contains("抽取名单不存在", error.Message);
    }

    [Fact]
    public async Task BalanceAlgorithm_ComputesProbabilities()
    {
        var result = await _host.InvokeAsync("computeCyreneBalanceProbability",
            new object[]
            {
                JsonSerializer.SerializeToElement(new object[]
                {
                    new { id = "a", cn = "甲" },
                    new { id = "b", cn = "乙" }
                }),
                new object[] { },
                JsonSerializer.SerializeToElement(new { a = 0, b = 10 }),
                JsonSerializer.SerializeToElement(new { enabled = true })
            });
        Assert.True(result.TryGetProperty("a", out var probabilityA));
        Assert.True(probabilityA.GetDouble() > 0.5);
    }

    [Fact]
    public async Task SettingsMigration_ScalesUiScaleForV1Data()
    {
        var result = await _host.InvokeAsync("normalizeStoredSettings",
            JsonSerializer.SerializeToElement(new { uiScale = 100 }));
        Assert.Equal(80, result.GetProperty("uiScale").GetInt32());
        Assert.Equal(2, result.GetProperty("uiScaleVersion").GetInt32());
    }

    [Fact]
    public async Task ConcurrentCalls_AreSerializedOnEngineThread()
    {
        var tasks = Enumerable.Range(0, 20).Select(_ => _host.InvokeAsync("executeCoreDrawRequest", new Dictionary<string, object?>
        {
            ["input"] = new Dictionary<string, object?> { ["listId"] = "list-1", ["target"] = "people", ["count"] = 1, ["allowDuplicates"] = false, ["gender"] = "all" },
            ["caller"] = new Dictionary<string, object?> { ["kind"] = "core-ui", ["pluginId"] = "core" },
            ["state"] = DrawState()
        }));
        var results = await Task.WhenAll(tasks);
        Assert.All(results, result => Assert.Equal(1, result.GetProperty("receipt").GetProperty("count").GetInt32()));
    }
}
