using Avalonia.Controls;
using Avalonia.Input;
using Cyrene.App.ViewModels;

namespace Cyrene.App.Views;

public partial class SidebarView : UserControl
{
    public SidebarView()
    {
        InitializeComponent();
    }

    private void OnNavItemTapped(object? sender, TappedEventArgs e)
    {
        if (sender is Border { DataContext: NavItem item } && DataContext is MainViewModel viewModel)
        {
            viewModel.SelectNavItem(item);
        }
    }

    private void OnNavItemPointerPressed(object? sender, PointerPressedEventArgs e)
    {
        if (sender is Control control) control.Classes.Add("pressed");
    }

    private void OnNavItemPointerReleased(object? sender, PointerReleasedEventArgs e)
    {
        if (sender is Control control) control.Classes.Remove("pressed");
    }

    private void OnNavItemPointerReleased(object? sender, PointerCaptureLostEventArgs e)
    {
        if (sender is Control control) control.Classes.Remove("pressed");
    }
}
