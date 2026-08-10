using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using Cyrene.App.Services;
using Cyrene.App.ViewModels;

namespace Cyrene.App.ViewModels;

public partial class MainViewModel : ObservableObject
{
    [ObservableProperty]
    private NavItem? selectedNavItem;

    public ObservableCollection<NavItem> NavItems { get; } = [];

    public SettingsViewModel Settings { get; }
    public ListsViewModel Lists { get; }
    public RollerViewModel Roller { get; }

    public MainViewModel(AppServices services)
    {
        Settings = new SettingsViewModel(services.Settings);
        Lists = new ListsViewModel();
        Lists.SeedSampleData();
        Roller = new RollerViewModel(services.Core, Lists);

        NavItems.Add(new NavItem("抽奖", Roller));
        NavItems.Add(new NavItem("名单", Lists));
        NavItems.Add(new NavItem("奖品", new PlaceholderViewModel("奖品", "PrizesView 占位")));
        NavItems.Add(new NavItem("记录", new PlaceholderViewModel("记录", "RecordsView 占位")));
        NavItems.Add(new NavItem("统计", new PlaceholderViewModel("统计", "StatisticsView 占位")));
        NavItems.Add(new NavItem("设置", Settings));
        NavItems.Add(new NavItem("插件", new PlaceholderViewModel("插件", "PluginManagerView 占位")));
        SelectedNavItem = NavItems[0];
    }
}
