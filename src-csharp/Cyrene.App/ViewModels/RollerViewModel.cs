using System.Diagnostics;
using System.Text.Json;
using Avalonia.Threading;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Cyrene.Host;

namespace Cyrene.App.ViewModels;

public partial class RollerViewModel : ObservableObject
{
    private static readonly TimeSpan TickInterval = TimeSpan.FromMilliseconds(16);

    private readonly JintCoreHost _core;
    private readonly ListsViewModel _lists;
    private readonly Stopwatch _watch = new();
    private DispatcherTimer? _timer;
    private int _index;

    [ObservableProperty]
    private string currentName = "——";

    [ObservableProperty]
    private bool isRunning;

    [ObservableProperty]
    private double progress;

    [ObservableProperty]
    private string? lastResult;

    [ObservableProperty]
    private string statusText = "就绪";

    public AsyncRelayCommand StartRollCommand { get; }
    public AsyncRelayCommand StopRollCommand { get; }

    public RollerViewModel(JintCoreHost core, ListsViewModel lists)
    {
        _core = core;
        _lists = lists;
        StartRollCommand = new AsyncRelayCommand(StartRollAsync);
        StopRollCommand = new AsyncRelayCommand(StopRollAsync);
    }

    private IReadOnlyList<PersonItem> EligiblePeople =>
        _lists.People.Where(person => person.Name.Length > 0).ToList();

    private async Task StartRollAsync()
    {
        if (IsRunning) return;
        var people = EligiblePeople;
        if (people.Count == 0)
        {
            StatusText = "请先在「名单」页添加人员";
            return;
        }
        _index = 0;
        LastResult = null;
        Progress = 0;
        IsRunning = true;
        StatusText = "滚动中…";
        _watch.Restart();
        _timer = new DispatcherTimer(TickInterval, DispatcherPriority.Render, (_, _) => Tick(people));
        _timer.Start();
        await Task.CompletedTask;
    }

    private void Tick(IReadOnlyList<PersonItem> people)
    {
        CurrentName = people[_index % people.Count].Name;
        _index += 1;
        if (_index > people.Count * 40) _index = 0;
        Progress = Math.Min(100, _watch.Elapsed.TotalSeconds / 3 * 100);
    }

    private async Task StopRollAsync()
    {
        if (!IsRunning) return;
        _timer?.Stop();
        _timer = null;
        var people = EligiblePeople;
        try
        {
            var selected = await SelectViaBalanceAsync(people);
            CurrentName = selected;
            LastResult = selected;
            Progress = 100;
            StatusText = "已结束";
        }
        catch (Exception error)
        {
            StatusText = $"选择失败：{error.Message}";
        }
        finally
        {
            IsRunning = false;
        }
    }

    public async Task<string> SelectViaBalanceAsync(IReadOnlyList<PersonItem> people, IReadOnlyDictionary<string, int>? counts = null)
    {
        var personElements = people.Select(person => JsonSerializer.SerializeToElement(new
        {
            id = person.Name,
            cn = person.Name,
            en = person.EnglishName ?? "",
            gender = "all",
            isWhiteList = person.IsWhiteList
        })).ToArray();
        var whiteList = people.Where(person => person.IsWhiteList)
            .Select(person => JsonSerializer.SerializeToElement(new { id = person.Name, cn = person.Name })).ToArray();
        var countMap = counts ?? people.ToDictionary(person => person.Name, _ => 0);
        var settings = JsonSerializer.SerializeToElement(new { enabled = true });

        var probabilities = await _core.InvokeAsync("computeCyreneBalanceProbability",
            JsonSerializer.SerializeToElement(personElements),
            JsonSerializer.SerializeToElement(whiteList),
            JsonSerializer.SerializeToElement(counts),
            settings);

        var total = 0.0;
        foreach (var person in people)
        {
            if (probabilities.TryGetProperty(person.Name, out var probability)) total += probability.GetDouble();
        }
        if (total <= 0) return people[^1].Name;
        var roll = Random.Shared.NextDouble() * total;
        var cumulative = 0.0;
        foreach (var person in people)
        {
            if (!probabilities.TryGetProperty(person.Name, out var probability)) continue;
            cumulative += probability.GetDouble();
            if (roll <= cumulative) return person.Name;
        }
        return people[^1].Name;
    }
}
