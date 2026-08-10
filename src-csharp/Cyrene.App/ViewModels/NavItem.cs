using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;

namespace Cyrene.App.ViewModels;

public partial class NavItem : ObservableObject
{
    public string Title { get; }
    public string IconGlyph { get; }
    public object? ViewModel { get; }
    public NavItem? Parent { get; internal set; }
    public ObservableCollection<NavItem> Children { get; } = [];

    public bool HasChildren => Children.Count > 0;

    [ObservableProperty]
    private bool isExpanded;

    [ObservableProperty]
    private bool isSelected;

    public NavItem(string title, string iconGlyph, object? viewModel = null, NavItem? parent = null, IEnumerable<NavItem>? children = null)
    {
        Title = title;
        IconGlyph = iconGlyph;
        ViewModel = viewModel;
        Parent = parent;
        if (children is not null)
        {
            foreach (var child in children) Children.Add(child);
        }
    }
}
