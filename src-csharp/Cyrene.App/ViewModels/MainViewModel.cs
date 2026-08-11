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

    /// <summary>当前打开的二级滑入面板（对应 Tauri 版 SecondarySidebarMenu），null 表示关闭。</summary>
    [ObservableProperty]
    private NavItem? activeMenu;

    /// <summary>二级面板子项集合（编译绑定友好）。</summary>
    [ObservableProperty]
    private ObservableCollection<NavItem> activeMenuChildren = [];

    partial void OnActiveMenuChanged(NavItem? value) =>
        ActiveMenuChildren = value?.Children ?? [];

    public ObservableCollection<NavItem> NavItems { get; } = [];
    public ObservableCollection<NavItem> BottomNavItems { get; } = [];

    public SettingsViewModel Settings { get; }
    public ListsViewModel Lists { get; }
    public RollerViewModel Roller { get; }
    public CardViewModel Card { get; }
    public PrizesViewModel Prizes { get; }
    public RecordsViewModel Records { get; }
    public StatisticsViewModel Statistics { get; }

    public RelayCommand ToggleCompactCommand { get; }
    public RelayCommand CloseMenuCommand { get; }

    private readonly Dictionary<string, Func<NavItem>> _pageResolvers = [];

    public MainViewModel(AppServices services, string[]? args = null)
    {
        Settings = new SettingsViewModel(services.Settings);
        Lists = new ListsViewModel();
        Lists.SeedSampleData();
        Records = new RecordsViewModel(services.Records);
        Roller = new RollerViewModel(services.Core, Lists, Records);
        Card = new CardViewModel(Lists);
        Prizes = new PrizesViewModel();
        Statistics = new StatisticsViewModel(Records);

        // 与 Tauri 版 NavigationDock 主导航顺序、图标一致（fluent 图标同源同形）：
        // 随机点名 / 翻牌点名 / 抽奖模式(二级) / 统计 / 抽取记录(二级) / 名单管理(二级)
        var roller = new NavItem("随机点名", "", Roller, iconName: "flash-24-regular");
        var card = new NavItem("翻牌点名", "", Card, iconName: "card-ui-portrait-flip-24-regular");
        var lottery = new NavItem("抽奖模式", "", children: new[]
        {
            new NavItem("奖品抽取", "", new LotteryDrawViewModel(Prizes), iconName: "gift-20-regular"),
            new NavItem("人员奖品分配", "", new LotteryAssignViewModel(Prizes, Lists), iconName: "people-team-20-regular")
        }, iconName: "gift-24-regular");
        var statistics = new NavItem("统计", "", Statistics, iconName: "chart-multiple-24-regular");
        var records = new NavItem("抽取记录", "", Records, children: new[]
        {
            new NavItem("点名记录", "", Records, iconName: "history-20-regular"),
            new NavItem("抽奖记录", "", new PlaceholderViewModel("抽奖记录", "LotteryRecordsView 占位"), iconName: "gift-20-regular")
        }, iconName: "history-24-regular");
        var lists = new NavItem("名单管理", "", Lists, children: new[]
        {
            new NavItem("人员名单", "", Lists, iconName: "person-20-regular"),
            new NavItem("小组名单", "", new PlaceholderViewModel("小组名单", "GroupManageView 占位"), iconName: "people-team-20-regular"),
            new NavItem("奖品管理", "", Prizes, iconName: "clipboard-bullet-list-20-regular")
        }, iconName: "people-list-24-regular");

        // 底部导航：公告 / 插件 / 设置(二级) / 关于
        var announcement = new NavItem("公告", "", new AnnouncementViewModel(), iconName: "megaphone-24-regular");
        var plugins = new NavItem("插件", "", new PlaceholderViewModel("插件", "PluginManagerView 占位"), iconName: "plug-connected-24-regular");
        var settings = new NavItem("设置", "", Settings, children: new[]
        {
            new NavItem("基本", "", Settings, iconName: "options-20-regular"),
            new NavItem("外观", "", new PlaceholderViewModel("外观", "外观设置占位"), iconName: "color-20-regular"),
            new NavItem("功能", "", new PlaceholderViewModel("功能", "功能设置占位"), iconName: "play-20-regular"),
            new NavItem("数据", "", new PlaceholderViewModel("数据", "数据设置占位"), iconName: "database-20-regular")
        }, iconName: "settings-24-regular");
        var about = new NavItem("关于", "", new AboutViewModel(), iconName: "info-24-regular");

        foreach (var item in new[] { roller, card, lottery, statistics, records, lists }) NavItems.Add(item);
        foreach (var item in new[] { announcement, plugins, settings, about }) BottomNavItems.Add(item);

        foreach (var item in NavItems.Concat(BottomNavItems)) LinkChildren(item);

        _pageResolvers["roller"] = () => roller;
        _pageResolvers["card"] = () => card;
        _pageResolvers["lottery-draw"] = () => lottery.Children[0];
        _pageResolvers["lottery-assign"] = () => lottery.Children[1];
        _pageResolvers["statistics"] = () => statistics;
        _pageResolvers["records"] = () => records.Children[0];
        _pageResolvers["lists"] = () => lists.Children[0];
        _pageResolvers["prizes"] = () => lists.Children[2];
        _pageResolvers["announcement"] = () => announcement;
        _pageResolvers["about"] = () => about;

        ToggleCompactCommand = new RelayCommand(ToggleCompact);
        CloseMenuCommand = new RelayCommand(() => ActiveMenu = null);

        var initial = ResolveInitialPage(args);
        SelectedNavItem = initial;
        UpdateSelectionState(initial);
    }

    private NavItem ResolveInitialPage(string[]? args)
    {
        var page = args?.FirstOrDefault(arg => arg.StartsWith("--page="))?.Substring("--page=".Length);
        if (page is not null && _pageResolvers.TryGetValue(page, out var resolver)) return resolver();
        return NavItems[0];
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
            // 对齐 Tauri 版：点击带二级菜单的 dock 项，主菜单滑出、二级面板滑入，且打开即导航到首个子项
            ActiveMenu = item;
            item.IsSelected = true;
            if (item.Children.Count > 0)
            {
                SelectedNavItem = item.Children[0];
                UpdateSelectionState(item.Children[0]);
            }
            return;
        }
        ActiveMenu = null;
        SelectedNavItem = item;
        UpdateSelectionState(item);
    }

    private void UpdateSelectionState(NavItem selected)
    {
        foreach (var top in NavItems.Concat(BottomNavItems)) ClearSelection(top);
        var current = selected;
        while (current is not null)
        {
            current.IsSelected = true;
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
