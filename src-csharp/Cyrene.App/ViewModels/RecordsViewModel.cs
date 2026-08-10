using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Cyrene.App.Services;

namespace Cyrene.App.ViewModels;

public partial class RecordsViewModel : ObservableObject
{
    private readonly RecordsService _service;

    public ObservableCollection<DrawRecord> Records { get; } = [];

    [ObservableProperty]
    private bool isLoading;

    public Func<Task<string?>>? FilePicker { get; set; }

    public AsyncRelayCommand ExportCommand { get; }

    public RecordsViewModel(RecordsService service)
    {
        _service = service;
        ExportCommand = new AsyncRelayCommand(ExportAsync);
    }

    public async Task InitializeAsync()
    {
        IsLoading = true;
        try
        {
            var records = await _service.LoadAsync();
            Records.Clear();
            foreach (var record in records) Records.Add(record);
        }
        finally
        {
            IsLoading = false;
        }
    }

    public async Task AddAsync(DrawRecord record)
    {
        Records.Insert(0, record);
        await _service.SaveAsync(Records);
    }

    private async Task ExportAsync()
    {
        if (Records.Count == 0) return;
        var path = FilePicker is null ? null : await FilePicker();
        if (string.IsNullOrEmpty(path)) return;
        await File.WriteAllTextAsync(path, "\uFEFF" + CsvExporter.BuildCsv(Records));
    }
}
