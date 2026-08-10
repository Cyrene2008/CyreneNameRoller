using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;

namespace Cyrene.App.ViewModels;

public partial class MainViewModel : ObservableObject
{
    [ObservableProperty]
    private NavItem? selectedNavItem;

    public ObservableCollection<NavItem> NavItems { get; } = [];

    public MainViewModel()
    {
        NavItems.Add(new NavItem("抽奖", new PlaceholderViewModel("抽奖", "LotteryView 占位")));
        NavItems.Add(new NavItem("名单", new PlaceholderViewModel("名单", "ListsView 占位")));
        NavItems.Add(new NavItem("奖品", new PlaceholderViewModel("奖品", "PrizesView 占位")));
        NavItems.Add(new NavItem("记录", new PlaceholderViewModel("记录", "RecordsView 占位")));
        NavItems.Add(new NavItem("统计", new PlaceholderViewModel("统计", "StatisticsView 占位")));
        NavItems.Add(new NavItem("设置", new PlaceholderViewModel("设置", "SettingsView 占位")));
        NavItems.Add(new NavItem("插件", new PlaceholderViewModel("插件", "PluginManagerView 占位")));
        SelectedNavItem = NavItems[0];
    }
}
