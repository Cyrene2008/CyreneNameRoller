using System.Text.Json;
using System.Text.Json.Nodes;
using CommunityToolkit.Mvvm.ComponentModel;
using Cyrene.App.Services;

namespace Cyrene.App.ViewModels;

public partial class SettingsViewModel : ObservableObject
{
    private readonly SettingsService _service;
    private bool _ready;

    [ObservableProperty]
    private bool isLoading = true;

    [ObservableProperty]
    private string language = "zh";

    [ObservableProperty]
    private bool darkMode;

    [ObservableProperty]
    private bool recordCounts = true;

    [ObservableProperty]
    private bool multiMode;

    [ObservableProperty]
    private int peopleCount = 2;

    [ObservableProperty]
    private bool allowDuplicates;

    [ObservableProperty]
    private int autoStopDuration = 3;

    [ObservableProperty]
    private double uiScale = 100;

    [ObservableProperty]
    private double animSpeed = 1;

    [ObservableProperty]
    private string colorTheme = "peach";

    [ObservableProperty]
    private string fontFamily = "MiSans";

    public string[] LanguageOptions { get; } = ["中文", "English"];
    public string[] ColorThemeOptions { get; } = ["peach", "blue", "green", "purple"];
    public string[] FontFamilyOptions { get; } = ["MiSans", "HarmonyOS Sans", "Microsoft YaHei", "SimSun"];

    public CommunityToolkit.Mvvm.Input.IAsyncRelayCommand SaveCommand { get; }

    public event Action<bool>? DarkModeChanged;

    public SettingsViewModel(SettingsService service)
    {
        _service = service;
        SaveCommand = new CommunityToolkit.Mvvm.Input.AsyncRelayCommand(SaveAsync);
    }

    [ObservableProperty]
    private int selectedLanguageIndex;

    partial void OnSelectedLanguageIndexChanged(int value)
    {
        Language = value == 1 ? "en" : "zh";
    }

    public async Task InitializeAsync()
    {
        try
        {
            var settings = await _service.LoadAsync();
            Language = settings.GetProperty("language").GetString() ?? "zh";
            SelectedLanguageIndex = Language == "en" ? 1 : 0;
            DarkMode = settings.GetProperty("darkMode").GetBoolean();
            RecordCounts = settings.GetProperty("recordCounts").GetBoolean();
            MultiMode = settings.GetProperty("multiMode").GetBoolean();
            PeopleCount = settings.GetProperty("peopleCount").GetInt32();
            AllowDuplicates = settings.GetProperty("allowDuplicates").GetBoolean();
            AutoStopDuration = settings.GetProperty("autoStopDuration").GetInt32();
            UiScale = settings.GetProperty("uiScale").GetInt32();
            AnimSpeed = settings.GetProperty("animSpeed").GetDouble();
            ColorTheme = settings.GetProperty("colorTheme").GetString() ?? "peach";
            FontFamily = settings.GetProperty("fontFamily").GetString() ?? "MiSans";
        }
        finally
        {
            IsLoading = false;
            _ready = true;
        }
    }

    public async Task SaveAsync()
    {
        if (!_ready) return;
        var node = new JsonObject
        {
            ["language"] = Language,
            ["darkMode"] = DarkMode,
            ["recordCounts"] = RecordCounts,
            ["multiMode"] = MultiMode,
            ["peopleCount"] = PeopleCount,
            ["allowDuplicates"] = AllowDuplicates,
            ["autoStopDuration"] = AutoStopDuration,
            ["uiScale"] = (int)UiScale,
            ["animSpeed"] = AnimSpeed,
            ["colorTheme"] = ColorTheme,
            ["fontFamily"] = FontFamily
        };
        await _service.SaveAsync(JsonDocument.Parse(node.ToJsonString()).RootElement);
    }

    partial void OnDarkModeChanged(bool value)
    {
        DarkModeChanged?.Invoke(value);
    }
}
