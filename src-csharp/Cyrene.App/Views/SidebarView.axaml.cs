using Avalonia.Controls;
using Avalonia.Input;
using Avalonia.Media;
using Avalonia.Threading;
using Cyrene.App.ViewModels;

namespace Cyrene.App.Views;

public partial class SidebarView : UserControl
{
    private readonly TranslateTransform _primaryTranslate = new(0, 0);
    private readonly TranslateTransform _secondaryTranslate = new(260, 0);

    public SidebarView()
    {
        InitializeComponent();
        PrimaryLayer.RenderTransform = _primaryTranslate;
        SecondaryLayer.RenderTransform = _secondaryTranslate;
        DataContextChanged += (_, _) => BindMenu();
    }

    private void BindMenu()
    {
        if (DataContext is MainViewModel viewModel)
        {
            viewModel.PropertyChanged += (_, e) =>
            {
                if (e.PropertyName == nameof(MainViewModel.ActiveMenu))
                {
                    Slide(viewModel.ActiveMenu is not null);
                }
            };
        }
    }

    private void Slide(bool open)
    {
        var width = Width > 0 ? Width : (DataContext is MainViewModel vm && vm.IsCompact ? MainViewModel.CompactSidebarWidth : MainViewModel.ExpandedSidebarWidth);
        AnimateX(_primaryTranslate, open ? -width : 0);
        AnimateX(_secondaryTranslate, open ? 0 : width);
    }

    private static void AnimateX(TranslateTransform transform, double to)
    {
        const double DurationMs = 260;
        var from = transform.X;
        var watch = System.Diagnostics.Stopwatch.StartNew();
        DispatcherTimer? timer = null;
        timer = new DispatcherTimer(TimeSpan.FromMilliseconds(16), DispatcherPriority.Render, (_, _) =>
        {
            var t = Math.Min(1, watch.ElapsedMilliseconds / DurationMs);
            var eased = t < 0.5 ? 4 * t * t * t : 1 - Math.Pow(-2 * t + 2, 3) / 2;
            transform.X = from + (to - from) * eased;
            if (t >= 1) timer?.Stop();
        });
        timer.Start();
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
