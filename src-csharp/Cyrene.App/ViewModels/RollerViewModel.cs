using System.Collections.ObjectModel;
using System.Diagnostics;
using System.Text.Json;
using Avalonia.Threading;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Cyrene.Host;

namespace Cyrene.App.ViewModels;

/// <summary>与 Tauri 版 RollerView 对齐的点名视图模型：名字舞台滚动 + 右下控制区。</summary>
public partial class RollerViewModel : ObservableObject
{
    private static readonly TimeSpan TickInterval = TimeSpan.FromMilliseconds(50);

    private readonly JintCoreHost _core;
    private readonly ListsViewModel _lists;
    private readonly RecordsViewModel? _records;
    private readonly Stopwatch _watch = new();
    private DispatcherTimer? _timer;
    private int _index;
    private readonly Random _random = Random.Shared;

    public RollerViewModel(JintCoreHost core, ListsViewModel lists, RecordsViewModel? records = null)
    {
        _core = core;
        _lists = lists;
        _records = records;
        ToggleRollCommand = new AsyncRelayCommand(ToggleRollAsync);
        ChangeCountCommand = new RelayCommand<object>(p => ChangeCount(ToDelta(p)));
        SetTargetCommand = new RelayCommand<object>(p => GroupMode = p as string == "groups");
        SetGenderCommand = new RelayCommand<object>(p => GenderFilter = p as string ?? "all");
        SetCountModeCommand = new RelayCommand<object>(p => MultiMode = p as string == "multiple");
    }

    // ---- 名字舞台 ----
    [ObservableProperty]
    private ObservableCollection<string> nameDisplays = [""];

    [ObservableProperty]
    private bool isRunning;

    [ObservableProperty]
    private string? lastResult;

    [ObservableProperty]
    private string statusText = "就绪";

    // ---- 控制区（对齐 Tauri 版筛选器）----
    [ObservableProperty]
    private bool englishMode;

    [ObservableProperty]
    private bool groupMode;

    /// <summary>性别筛选：all / male / female。</summary>
    [ObservableProperty]
    private string genderFilter = "all";

    [ObservableProperty]
    private bool multiMode;

    [ObservableProperty]
    private bool forbidDuplicates = true;

    [ObservableProperty]
    private int peopleCount = 2;

    [ObservableProperty]
    private string currentListName = "默认名单";

    public IReadOnlyList<string> ListOptions { get; } = ["默认名单"];

    [ObservableProperty]
    private string balanceStatusText = "平衡算法已启用";

    public AsyncRelayCommand ToggleRollCommand { get; }
    public RelayCommand<object> ChangeCountCommand { get; }
    public RelayCommand<object> SetTargetCommand { get; }
    public RelayCommand<object> SetGenderCommand { get; }
    public RelayCommand<object> SetCountModeCommand { get; }

    public int DisplayCount => MultiMode ? Math.Max(2, PeopleCount) : 1;

    private IReadOnlyList<PersonItem> EligiblePeople => _lists.People
        .Where(person => person.Name.Length > 0)
        .Where(person => GroupMode || GenderFilter == "all" || person.Gender == GenderFilter)
        .ToList();

    partial void OnMultiModeChanged(bool value) => RebuildDisplays();

    partial void OnPeopleCountChanged(int value)
    {
        if (MultiMode) RebuildDisplays();
    }

    partial void OnGenderFilterChanged(string value) => RebuildDisplays();

    partial void OnGroupModeChanged(bool value) => RebuildDisplays();

    private void RebuildDisplays()
    {
        var displays = new ObservableCollection<string>();
        for (var i = 0; i < DisplayCount; i++) displays.Add("");
        NameDisplays = displays;
        OnPropertyChanged(nameof(DisplayCount));
    }

    private static int ToDelta(object? parameter) => parameter switch
    {
        int i => i,
        string s when int.TryParse(s, out var parsed) => parsed,
        _ => 0
    };

    private void ChangeCount(int delta)
    {
        var next = Math.Clamp((MultiMode ? PeopleCount : 1) + delta, 1, 64);
        if (next <= 1)
        {
            MultiMode = false;
            PeopleCount = 2;
        }
        else
        {
            if (!MultiMode) MultiMode = true;
            PeopleCount = next;
        }
        RebuildDisplays();
    }

    private async Task ToggleRollAsync()
    {
        if (IsRunning)
        {
            await StopRollAsync();
            return;
        }
        await StartRollAsync();
    }

    private async Task StartRollAsync()
    {
        if (IsRunning) return;
        var people = EligiblePeople;
        if (people.Count == 0)
        {
            StatusText = "请先在「名单」页添加人员";
            return;
        }
        RebuildDisplays();
        _index = 0;
        LastResult = null;
        IsRunning = true;
        StatusText = "滚动中…";
        _watch.Restart();
        _timer = new DispatcherTimer(TickInterval, DispatcherPriority.Render, (_, _) => Tick(people));
        _timer.Start();
        await Task.CompletedTask;
    }

    private void Tick(IReadOnlyList<PersonItem> people)
    {
        var displays = NameDisplays;
        for (var i = 0; i < displays.Count; i++)
        {
            displays[i] = people[_random.Next(people.Count)].Name;
        }
        _index += 1;
    }

    private async Task StopRollAsync()
    {
        if (!IsRunning) return;
        _timer?.Stop();
        _timer = null;
        var people = EligiblePeople;
        try
        {
            var displays = NameDisplays;
            var picks = new List<string>(displays.Count);
            var exclude = new List<string>();
            for (var i = 0; i < displays.Count; i++)
            {
                string selected;
                if (MultiMode && ForbidDuplicates)
                {
                    selected = await SelectViaBalanceAsync(people, counts: null, exclude);
                    exclude.Add(selected);
                }
                else
                {
                    selected = await SelectViaBalanceAsync(people);
                }
                picks.Add(selected);
            }
            for (var i = 0; i < displays.Count; i++) displays[i] = picks[i];
            LastResult = string.Join("、", picks);
            StatusText = "已结束";
            if (_records is not null)
            {
                foreach (var pick in picks)
                {
                    var person = people.FirstOrDefault(item => item.Name == pick);
                    await _records.AddAsync(new Cyrene.App.Services.DrawRecord(pick, person?.EnglishName ?? "", DateTimeOffset.Now.ToUnixTimeMilliseconds()));
                }
            }
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

    public async Task<string> SelectViaBalanceAsync(IReadOnlyList<PersonItem> people, IReadOnlyDictionary<string, int>? counts = null, IReadOnlyList<string>? exclude = null)
    {
        var personElements = people.Select(person => JsonSerializer.SerializeToElement(new
        {
            id = person.Name,
            cn = person.Name,
            en = person.EnglishName ?? "",
            gender = person.Gender,
            isWhiteList = person.IsWhiteList
        })).ToArray();
        var whiteList = people.Where(person => person.IsWhiteList)
            .Select(person => JsonSerializer.SerializeToElement(new { id = person.Name, cn = person.Name })).ToArray();
        var countMap = counts ?? people.ToDictionary(person => person.Name, _ => 0);
        var settings = JsonSerializer.SerializeToElement(new { enabled = true });

        var probabilities = await _core.InvokeAsync("computeCyreneBalanceProbability",
            JsonSerializer.SerializeToElement(personElements),
            JsonSerializer.SerializeToElement(whiteList),
            JsonSerializer.SerializeToElement(countMap),
            settings);

        var total = 0.0;
        foreach (var person in people)
        {
            if (exclude is not null && exclude.Contains(person.Name)) continue;
            if (probabilities.TryGetProperty(person.Name, out var probability)) total += probability.GetDouble();
        }
        if (total <= 0) return people[^1].Name;
        var roll = _random.NextDouble() * total;
        var cumulative = 0.0;
        foreach (var person in people)
        {
            if (exclude is not null && exclude.Contains(person.Name)) continue;
            if (!probabilities.TryGetProperty(person.Name, out var probability)) continue;
            cumulative += probability.GetDouble();
            if (roll <= cumulative) return person.Name;
        }
        return people[^1].Name;
    }
}
