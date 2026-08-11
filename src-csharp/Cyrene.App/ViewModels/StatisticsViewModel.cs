using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;

namespace Cyrene.App.ViewModels;

public partial class StatRow : ObservableObject
{
    [ObservableProperty]
    private string name;

    [ObservableProperty]
    private int count;

    [ObservableProperty]
    private double percent;

    public StatRow(string name, int count, double percent)
    {
        this.name = name;
        this.count = count;
        this.percent = percent;
    }
}

public partial class StatisticsViewModel : ObservableObject
{
    private readonly RecordsViewModel _records;

    [ObservableProperty]
    private int totalCount;

    public ObservableCollection<StatRow> Rows { get; } = [];

    public StatisticsViewModel(RecordsViewModel records)
    {
        _records = records;
        _records.Records.CollectionChanged += (_, _) => Refresh();
        Refresh();
    }

    public void Refresh()
    {
        var grouped = _records.Records
            .GroupBy(record => record.Name)
            .Select(group => (Name: group.Key, Count: group.Count()))
            .OrderByDescending(item => item.Count)
            .ToList();
        TotalCount = _records.Records.Count;
        Rows.Clear();
        foreach (var item in grouped)
        {
            var percent = TotalCount > 0 ? Math.Round(item.Count * 100.0 / TotalCount, 1) : 0;
            Rows.Add(new StatRow(item.Name, item.Count, percent));
        }
    }
}
