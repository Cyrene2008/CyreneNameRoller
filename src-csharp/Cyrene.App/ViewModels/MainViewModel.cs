using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Cyrene.App.Services;

namespace Cyrene.App.ViewModels;

public partial class MainViewModel : ObservableObject
{
    public const double ExpandedSidebarWidth = 220;
    public const double CompactSidebarWidth = 64;

    [ObservableProperty]
    private NavItem? selectedNavItem;

    [ObservableProperty]
    private bool isCompact;

    [ObservableProperty]
    private double sidebarWidth = ExpandedSidebarWidth;

    public ObservableCollection<NavItem> NavItems { get; } = [];

    public SettingsViewModel Settings { get; }
    public ListsViewModel Lists { get; }
    public RollerViewModel Roller { get; }
    public RecordsViewModel Records { get; }

    public RelayCommand ToggleCompactCommand { get; }

    public MainViewModel(AppServices services)
    {
        Settings = new SettingsViewModel(services.Settings);
        Lists = new ListsViewModel();
        Lists.SeedSampleData();
        Records = new RecordsViewModel(services.Records);
        Roller = new RollerViewModel(services.Core, Lists, Records);

        var lottery = new NavItem("抽奖", "\uE7EF", Roller);
        var lists = new NavItem("名单", "\uE716", Lists);
        var prizes = new NavItem("奖品", "\uE734", new PlaceholderViewModel("奖品", "PrizesView 占位"));
        var records = new NavItem("记录", "\uE8FD", children: new[]
        {
            new NavItem("抽取记录", "\uE8FD", Records),
            new NavItem("卡牌记录", "\uE734", new PlaceholderViewModel("卡牌记录", "LotteryRecordsView 占位"))
        });
        var statistics = new NavItem("统计", "\uE9D2", new PlaceholderViewModel("统计", "StatisticsView 占位"));
        var settings = new NavItem("设置", "\uE713", children: new[]
        {
            new NavItem("常规", "\uE713", Settings),
            new NavItem("外观", "\uE790", new PlaceholderViewModel("外观", "外观设置占位"))
        });
        var plugins = new NavItem("插件", "\uE71D", new PlaceholderViewModel("插件", "PluginManagerView 占位"));

        var all = new[] { lottery, lists, prizes, records, statistics, settings, plugins };
        foreach (var item in all) NavItems.Add(item);
        foreach (var item in all) LinkChildren(item);

        ToggleCompactCommand = new RelayCommand(ToggleCompact);
        SelectedNavItem = lottery;
    }

    private static void LinkChildren(NavItem item)
    {
        foreach (var child in item.Children)
        {
            child.Parent = item;
            LinkChildren(child);
        }
    }

    public void SelectNavItem(NavItem item)
    {
        if (item.HasChildren)
        {
            item.IsExpanded = !item.IsExpanded;
            return;
        }
        SelectedNavItem = item;
        UpdateSelectionState(item);
    }

    private void UpdateSelectionState(NavItem selected)
    {
        foreach (var top in NavItems) ClearSelection(top);
        var current = selected;
        while (current is not null)
        {
            current.IsSelected = true;
            if (current.HasChildren) current.IsExpanded = true;
            current = current.Parent;
        }
    }

    private static void ClearSelection(NavItem item)
    {
        item.IsSelected = false;
        foreach (var child in item.Children) ClearSelection(child);
    }

    private void ToggleCompact()
    {
        IsCompact = !IsCompact;
        SidebarWidth = IsCompact ? CompactSidebarWidth : ExpandedSidebarWidth;
    }
}
