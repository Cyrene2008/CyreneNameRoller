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
        Assert.Equal(7, _viewModel.NavItems.Count);
        var records = _viewModel.NavItems.First(item => item.Title == "记录");
        Assert.True(records.HasChildren);
        Assert.Equal(2, records.Children.Count);
    }

    [Fact]
    public void SelectLeaf_HighlightsParentChain()
    {
        var records = _viewModel.NavItems.First(item => item.Title == "记录");
        var child = records.Children[0];
        _viewModel.SelectNavItem(child);

        Assert.True(child.IsSelected);
        Assert.True(records.IsSelected);
        Assert.True(records.IsExpanded);
        Assert.Equal(child, _viewModel.SelectedNavItem);
    }

    [Fact]
    public void SelectGroup_TogglesExpansion()
    {
        var records = _viewModel.NavItems.First(item => item.Title == "记录");
        Assert.False(records.IsExpanded);
        _viewModel.SelectNavItem(records);
        Assert.True(records.IsExpanded);
        _viewModel.SelectNavItem(records);
        Assert.False(records.IsExpanded);
    }

    [Fact]
    public void SelectAnotherLeaf_ClearsPreviousSelection()
    {
        var records = _viewModel.NavItems.First(item => item.Title == "记录");
        var recordsChild = records.Children[0];
        var settings = _viewModel.NavItems.First(item => item.Title == "设置");
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
