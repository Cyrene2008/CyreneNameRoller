using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Markup.Xaml;
using Avalonia.Styling;
using Cyrene.App.Services;
using Cyrene.App.ViewModels;
using Cyrene.App.Views;

namespace Cyrene.App;

public partial class App : Application
{
    private AppServices? _services;

    public override void Initialize()
    {
        AvaloniaXamlLoader.Load(this);
    }

    public override void OnFrameworkInitializationCompleted()
    {
        if (ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop)
        {
            _services = new AppServices();
            var mainViewModel = new MainViewModel(_services);
            mainViewModel.Settings.DarkModeChanged += dark =>
                RequestedThemeVariant = dark ? ThemeVariant.Dark : ThemeVariant.Light;
            _ = mainViewModel.Settings.InitializeAsync();

            var window = new MainWindow { DataContext = mainViewModel };
            desktop.MainWindow = window;
            desktop.ShutdownRequested += (_, _) => _services?.Dispose();
        }

        base.OnFrameworkInitializationCompleted();
    }
}
