using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;

namespace Cyrene.App.ViewModels;

public partial class NavItem : ObservableObject
{
    public string Title { get; }
    public string IconGlyph { get; }

    /// <summary>fluent 图标名（与 Tauri 版 NavigationDock 的 fluent: 图标同源），供矢量渲染。</summary>
    public string IconName { get; }

    public object? ViewModel { get; }
    public NavItem? Parent { get; internal set; }
    public ObservableCollection<NavItem> Children { get; } = [];

    public bool HasChildren => Children.Count > 0;

    [ObservableProperty]
    private bool isExpanded;

    [ObservableProperty]
    private bool isSelected;

    public NavItem(string title, string iconGlyph, object? viewModel = null, NavItem? parent = null, IEnumerable<NavItem>? children = null, string iconName = "")
    {
        Title = title;
        IconGlyph = iconGlyph;
        IconName = iconName;
        ViewModel = viewModel;
        Parent = parent;
        if (children is not null)
        {
            foreach (var child in children) Children.Add(child);
        }
    }
}
