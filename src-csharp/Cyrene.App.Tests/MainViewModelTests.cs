using Cyrene.App.Services;
using Cyrene.App.ViewModels;

namespace Cyrene.App.Tests;

public class MainViewModelTests : IDisposable
{
    private readonly AppServices _services = new();
    private readonly MainViewModel _viewModel;

    public MainViewModelTests()
    {
        _viewModel = new MainViewModel(_services);
    }

    public void Dispose() => _services.Dispose();

    [Fact]
    public void NavStructure_HasGroupsAndLeaves()
    {
        // 主导航与 Tauri 版一致：随机点名/翻牌点名/抽奖模式/统计/抽取记录/名单管理
        Assert.Equal(6, _viewModel.NavItems.Count);
        var records = _viewModel.NavItems.First(item => item.Title == "抽取记录");
        Assert.True(records.HasChildren);
        Assert.Equal(2, records.Children.Count);
        // 底部导航：公告/插件/设置/关于
        Assert.Equal(4, _viewModel.BottomNavItems.Count);
    }

    [Fact]
    public void NavStructure_IconsUseFluentNames()
    {
        Assert.Equal("flash-24-regular", _viewModel.NavItems[0].IconName);
        Assert.Equal("settings-24-regular", _viewModel.BottomNavItems.First(item => item.Title == "设置").IconName);
    }

    [Fact]
    public void SelectLeaf_HighlightsParentChain()
    {
        var records = _viewModel.NavItems.First(item => item.Title == "抽取记录");
        var child = records.Children[0];
        _viewModel.SelectNavItem(child);

        Assert.True(child.IsSelected);
        Assert.True(records.IsSelected);
        Assert.Equal(child, _viewModel.SelectedNavItem);
    }

    [Fact]
    public void SelectGroup_OpensSlidePanelAndNavigatesFirstChild()
    {
        // 对齐 Tauri 版：点击带二级的 dock 项打开滑入面板并导航到首个子项
        var lottery = _viewModel.NavItems.First(item => item.Title == "抽奖模式");
        _viewModel.SelectNavItem(lottery);

        Assert.Equal(lottery, _viewModel.ActiveMenu);
        Assert.Equal(lottery.Children[0], _viewModel.SelectedNavItem);
        Assert.True(lottery.IsSelected);

        _viewModel.CloseMenuCommand.Execute(null);
        Assert.Null(_viewModel.ActiveMenu);
    }

    [Fact]
    public void SelectAnotherLeaf_ClearsPreviousSelection()
    {
        var records = _viewModel.NavItems.First(item => item.Title == "抽取记录");
        var recordsChild = records.Children[0];
        var settings = _viewModel.BottomNavItems.First(item => item.Title == "设置");
        var settingsChild = settings.Children[0];

        _viewModel.SelectNavItem(recordsChild);
        _viewModel.SelectNavItem(settingsChild);

        Assert.False(recordsChild.IsSelected);
        Assert.False(records.IsSelected);
        Assert.True(settingsChild.IsSelected);
    }

    [Fact]
    public void ToggleCompact_SwitchesSidebarWidth()
    {
        Assert.Equal(MainViewModel.ExpandedSidebarWidth, _viewModel.SidebarWidth);
        _viewModel.ToggleCompactCommand.Execute(null);
        Assert.True(_viewModel.IsCompact);
        Assert.Equal(MainViewModel.CompactSidebarWidth, _viewModel.SidebarWidth);
        _viewModel.ToggleCompactCommand.Execute(null);
        Assert.False(_viewModel.IsCompact);
    }
}
