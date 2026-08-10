using System.Text.Json;
using Cyrene.App.Services;
using Cyrene.App.ViewModels;
using Cyrene.Host;

namespace Cyrene.App.Tests;

public class SettingsServiceTests : IDisposable
{
    private readonly string _storageRoot = Path.Combine(Path.GetTempPath(), $"cyrene-app-test-{Guid.NewGuid():N}");
    private readonly JintCoreHost _core;
    private readonly DefaultHostBridge _bridge;
    private readonly SettingsService _settings;

    public SettingsServiceTests()
    {
        _core = new JintCoreHost(Path.Combine(AppContext.BaseDirectory, "Assets", "cyrene-core-bundle.js"));
        _bridge = new DefaultHostBridge(new FileSystemHostStorage(_storageRoot));
        _settings = new SettingsService(_core, _bridge);
    }

    public void Dispose()
    {
        _core.Dispose();
        try { Directory.Delete(_storageRoot, recursive: true); } catch { }
    }

    [Fact]
    public async Task LoadAsync_MigratesV1UiScaleThroughSharedCore()
    {
        await _bridge.InvokeAsync("core", "storage.write",
            JsonSerializer.SerializeToElement(new { key = "settings", value = JsonSerializer.SerializeToElement(new { uiScale = 100 }) }));

        var settings = await _settings.LoadAsync();
        Assert.Equal(80, settings.GetProperty("uiScale").GetInt32());
        Assert.Equal(2, settings.GetProperty("uiScaleVersion").GetInt32());
    }

    [Fact]
    public async Task SaveAsync_RoundTrips()
    {
        var original = await _settings.LoadAsync();
        var modified = JsonSerializer.SerializeToElement(new
        {
            language = "en",
            darkMode = true,
            uiScale = 120,
            uiScaleVersion = 2
        });
        await _settings.SaveAsync(modified);
        var reloaded = await _settings.LoadAsync();
        Assert.Equal("en", reloaded.GetProperty("language").GetString());
        Assert.True(reloaded.GetProperty("darkMode").GetBoolean());
        Assert.Equal(120, reloaded.GetProperty("uiScale").GetInt32());
    }

    [Fact]
    public async Task SettingsViewModel_LoadsMigratedValues()
    {
        await _bridge.InvokeAsync("core", "storage.write",
            JsonSerializer.SerializeToElement(new { key = "settings", value = JsonSerializer.SerializeToElement(new { darkMode = true, uiScale = 100 }) }));

        var viewModel = new SettingsViewModel(_settings);
        await viewModel.InitializeAsync();
        Assert.False(viewModel.IsLoading);
        Assert.True(viewModel.DarkMode);
        Assert.Equal(80, viewModel.UiScale);
        Assert.Equal(2, viewModel.PeopleCount);
    }

    [Fact]
    public async Task SettingsViewModel_SavePersistsThroughSharedCore()
    {
        var viewModel = new SettingsViewModel(_settings);
        await viewModel.InitializeAsync();
        viewModel.DarkMode = true;
        viewModel.Language = "en";
        await viewModel.SaveAsync();

        var reloaded = await _settings.LoadAsync();
        Assert.True(reloaded.GetProperty("darkMode").GetBoolean());
        Assert.Equal("en", reloaded.GetProperty("language").GetString());
    }
}

public class ListsViewModelTests
{
    [Fact]
    public void AddPerson_AddsTrimmedEntry()
    {
        var viewModel = new ListsViewModel();
        viewModel.NewPersonName = "  张三  ";
        viewModel.AddPersonCommand.Execute(null);
        Assert.Single(viewModel.People);
        Assert.Equal("张三", viewModel.People[0].Name);
        Assert.Equal(string.Empty, viewModel.NewPersonName);
    }

    [Fact]
    public void RemovePerson_RemovesEntry()
    {
        var viewModel = new ListsViewModel();
        viewModel.SeedSampleData();
        viewModel.RemovePersonCommand.Execute(viewModel.People[0]);
        Assert.Equal(3, viewModel.People.Count);
    }

    [Fact]
    public void AddPerson_IgnoresBlank()
    {
        var viewModel = new ListsViewModel();
        viewModel.AddPersonCommand.Execute(null);
        Assert.Empty(viewModel.People);
    }
}
