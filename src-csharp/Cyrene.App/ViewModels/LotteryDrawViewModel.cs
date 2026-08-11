using System.Collections.ObjectModel;
using Avalonia.Threading;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Cyrene.App.ViewModels;

public partial class LotteryDrawViewModel : ObservableObject
{
    private readonly PrizesViewModel _prizes;
    private DispatcherTimer? _timer;

    [ObservableProperty]
    private string drawStyle = "roller";

    [ObservableProperty]
    private bool rolling;

    [ObservableProperty]
    private string visiblePrizeName = "奖品抽取";

    [ObservableProperty]
    private string visibleQuality = "等待抽取";

    [ObservableProperty]
    private string stockText = "准备好后开始抽奖";

    [ObservableProperty]
    private PrizeItem? resultPrize;

    public ObservableCollection<string> DrawStyleOptions { get; } = ["滚动抽取", "加权转盘"];
    public ObservableCollection<string> PrizeListNames { get; } = [];

    [ObservableProperty]
    private string selectedPrizeList = "";

    [ObservableProperty]
    private string selectedDrawStyle = "滚动抽取";

    public RelayCommand ToggleRollCommand { get; }

    public LotteryDrawViewModel(PrizesViewModel prizes)
    {
        _prizes = prizes;
        ToggleRollCommand = new RelayCommand(ToggleRoll);
        RefreshPrizeListOptions();
        _prizes.CurrentList.Prizes.CollectionChanged += (_, _) =>
        {
            OnPropertyChanged(nameof(TotalStock));
            OnPropertyChanged(nameof(NoStock));
            if (!Rolling) ResetResult();
        };
    }

    public int TotalStock => _prizes.TotalStock;
    public bool NoStock => TotalStock < 1;

    partial void OnSelectedPrizeListChanged(string value)
    {
        var list = _prizes.Lists.FirstOrDefault(item => item.Name == value);
        if (list is not null) _prizes.CurrentList = list;
    }

    public void RefreshPrizeListOptions()
    {
        PrizeListNames.Clear();
        foreach (var list in _prizes.Lists) PrizeListNames.Add(list.Name);
        if (PrizeListNames.Count > 0 && string.IsNullOrEmpty(SelectedPrizeList))
            SelectedPrizeList = PrizeListNames[0];
    }

    private void ToggleRoll()
    {
        if (Rolling) StopRoll();
        else StartRoll();
    }

    private void StartRoll()
    {
        if (_prizes.TotalStock < 1) return;
        ResultPrize = null;
        Rolling = true;
        VisibleQuality = "抽取中";
        _timer = new DispatcherTimer(TimeSpan.FromMilliseconds(60), DispatcherPriority.Render, (_, _) =>
        {
            var pool = _prizes.CurrentList.Prizes.Where(prize => prize.Quantity > 0).ToList();
            if (pool.Count == 0) return;
            var prize = pool[Random.Shared.Next(pool.Count)];
            VisiblePrizeName = prize.Name;
            VisibleQuality = prize.Quality;
        });
        _timer.Start();
    }

    private void StopRoll()
    {
        _timer?.Stop();
        _timer = null;
        Rolling = false;
        var picked = _prizes.PickWeighted();
        if (picked is null)
        {
            ResetResult();
            return;
        }
        picked.Quantity -= 1;
        ResultPrize = picked;
        VisiblePrizeName = picked.Name;
        VisibleQuality = picked.Quality;
        StockText = $"剩余 {picked.Quantity}";
        OnPropertyChanged(nameof(TotalStock));
    }

    private void ResetResult()
    {
        ResultPrize = null;
        VisiblePrizeName = "奖品抽取";
        VisibleQuality = "等待抽取";
        StockText = "准备好后开始抽奖";
    }
}
