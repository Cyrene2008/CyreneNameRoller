using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Markup.Xaml;
using Avalonia.Platform.Storage;
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
        AppDomain.CurrentDomain.UnhandledException += (_, e) =>
        {
            try
            {
                File.WriteAllText(Path.Combine(AppContext.BaseDirectory, "crash.log"),
                    e.ExceptionObject.ToString());
            }
            catch
            {
                // 忽略日志写入失败
            }
        };
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
            _ = mainViewModel.Records.InitializeAsync();
            mainViewModel.Records.FilePicker = () => PickCsvPathAsync();

            var window = new MainWindow { DataContext = mainViewModel };
            desktop.MainWindow = window;
            desktop.ShutdownRequested += (_, _) => _services?.Dispose();
        }

        base.OnFrameworkInitializationCompleted();
    }

    private async Task<string?> PickCsvPathAsync()
    {
        var topLevel = Avalonia.Controls.TopLevel.GetTopLevel(ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop ? desktop.MainWindow : null);
        if (topLevel is null) return null;
        var file = await topLevel.StorageProvider.SaveFilePickerAsync(new Avalonia.Platform.Storage.FilePickerSaveOptions
        {
            Title = "导出抽取记录",
            SuggestedFileName = $"cyrene-records-{DateTime.Now:yyyyMMdd-HHmmss}.csv",
            DefaultExtension = "csv",
            FileTypeChoices = [new Avalonia.Platform.Storage.FilePickerFileType("CSV 文件") { Patterns = ["*.csv"] }]
        });
        return file?.TryGetLocalPath();
    }
}
