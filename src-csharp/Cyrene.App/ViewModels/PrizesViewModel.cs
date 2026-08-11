using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Cyrene.App.ViewModels;

public partial class PrizeItem : ObservableObject
{
    public string Id { get; } = Guid.NewGuid().ToString("N")[..8];

    [ObservableProperty]
    private string name = string.Empty;

    [ObservableProperty]
    private string quality = "N";

    [ObservableProperty]
    private int quantity = 1;

    [ObservableProperty]
    private double weight = 1;
}

public partial class PrizeList : ObservableObject
{
    [ObservableProperty]
    private string name;

    public ObservableCollection<PrizeItem> Prizes { get; } = [];

    public PrizeList(string name)
    {
        this.name = name;
    }

    public int TotalStock => Prizes.Sum(prize => prize.Quantity);
}

public partial class PrizesViewModel : ObservableObject
{
    private readonly Random _random = new();

    [ObservableProperty]
    private PrizeList currentList;

    [ObservableProperty]
    private string newPrizeName = string.Empty;

    [ObservableProperty]
    private string newPrizeQuality = "N";

    [ObservableProperty]
    private int newPrizeQuantity = 1;

    [ObservableProperty]
    private double newPrizeWeight = 1;

    public ObservableCollection<PrizeList> Lists { get; } = [];

    public RelayCommand AddPrizeCommand { get; }
    public RelayCommand<PrizeItem?> DeletePrizeCommand { get; }

    public PrizesViewModel()
    {
        var defaultList = new PrizeList("默认奖品单");
        defaultList.Prizes.Add(new PrizeItem { Name = "一等奖", Quality = "SSR", Quantity = 1, Weight = 1 });
        defaultList.Prizes.Add(new PrizeItem { Name = "二等奖", Quality = "SR", Quantity = 3, Weight = 3 });
        defaultList.Prizes.Add(new PrizeItem { Name = "三等奖", Quality = "R", Quantity = 6, Weight = 6 });
        defaultList.Prizes.Add(new PrizeItem { Name = "参与奖", Quality = "N", Quantity = 20, Weight = 10 });
        Lists.Add(defaultList);
        currentList = defaultList;

        AddPrizeCommand = new RelayCommand(AddPrize);
        DeletePrizeCommand = new RelayCommand<PrizeItem?>(DeletePrize);
    }

    public int TotalStock => CurrentList.TotalStock;

    public PrizeItem? PickWeighted()
    {
        var available = CurrentList.Prizes.Where(prize => prize.Quantity > 0).ToList();
        if (available.Count == 0) return null;
        var total = available.Sum(prize => prize.Weight);
        if (total <= 0) return null;
        var roll = _random.NextDouble() * total;
        var cumulative = 0.0;
        foreach (var prize in available)
        {
            cumulative += prize.Weight;
            if (roll <= cumulative) return prize;
        }
        return available[^1];
    }

    private void AddPrize()
    {
        var name = NewPrizeName.Trim();
        if (name.Length == 0 || NewPrizeQuantity < 1) return;
        CurrentList.Prizes.Add(new PrizeItem
        {
            Name = name,
            Quality = string.IsNullOrWhiteSpace(NewPrizeQuality) ? "N" : NewPrizeQuality.Trim(),
            Quantity = NewPrizeQuantity,
            Weight = NewPrizeWeight > 0 ? NewPrizeWeight : 1
        });
        NewPrizeName = string.Empty;
    }

    private void DeletePrize(PrizeItem? prize)
    {
        if (prize is not null) CurrentList.Prizes.Remove(prize);
    }
}
