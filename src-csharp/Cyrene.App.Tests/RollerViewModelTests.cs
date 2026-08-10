using Cyrene.App.ViewModels;
using Cyrene.Host;

namespace Cyrene.App.Tests;

public class RollerViewModelTests : IDisposable
{
    private readonly JintCoreHost _core = new(Path.Combine(AppContext.BaseDirectory, "Assets", "cyrene-core-bundle.js"));
    private readonly ListsViewModel _lists = new();

    public void Dispose() => _core.Dispose();

    [Fact]
    public void StartRoll_WithEmptyList_ShowsGuidance()
    {
        var roller = new RollerViewModel(_core, _lists);
        roller.StartRollCommand.Execute(null);
        Assert.False(roller.IsRunning);
        Assert.Contains("名单", roller.StatusText);
    }

    [Fact]
    public async Task StopRoll_SelectsPersonFromList()
    {
        _lists.SeedSampleData();
        var roller = new RollerViewModel(_core, _lists);
        var selected = await roller.SelectViaBalanceAsync(_lists.People.ToList());
        Assert.Contains(selected, _lists.People.Select(person => person.Name));
    }

    [Fact]
    public async Task BalanceSelection_WithUnevenCounts_PrefersUnderrepresented()
    {
        _lists.SeedSampleData();
        var roller = new RollerViewModel(_core, _lists);
        var people = _lists.People.ToList();
        var counts = new Dictionary<string, int>
        {
            ["张三"] = 20,
            ["李四"] = 0,
            ["王五"] = 0,
            ["赵六"] = 0
        };
        var selections = new List<string>();
        for (var index = 0; index < 40; index += 1)
        {
            selections.Add(await roller.SelectViaBalanceAsync(people, counts));
        }
        var highCountPicks = selections.Count(name => name == "张三");
        Assert.True(highCountPicks < 20, $"已抽取 20 次的张三仍被选中 {highCountPicks}/40 次，平衡算法未生效");
    }
}
