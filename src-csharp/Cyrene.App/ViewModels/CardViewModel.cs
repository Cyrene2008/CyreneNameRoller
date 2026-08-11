using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Cyrene.App.ViewModels;

public partial class CardItem : ObservableObject
{
    public string Name { get; }
    public string? EnglishName { get; }

    [ObservableProperty]
    private bool flipped;

    [ObservableProperty]
    private string displayName;

    public CardItem(string name, string? englishName, bool englishMode)
    {
        Name = name;
        EnglishName = englishName;
        displayName = ResolveName(englishMode);
    }

    public string ResolveName(bool englishMode) =>
        englishMode && !string.IsNullOrEmpty(EnglishName) ? EnglishName : Name;
}

public partial class CardViewModel : ObservableObject
{
    private readonly ListsViewModel _lists;
    private readonly Random _random = new();

    [ObservableProperty]
    private bool englishMode;

    [ObservableProperty]
    private int cardCount = 5;

    [ObservableProperty]
    private int quickCount = 4;

    [ObservableProperty]
    private int remainingCount;

    public ObservableCollection<CardItem> Cards { get; } = [];
    public ObservableCollection<string> TrayHistory { get; } = [];

    public RelayCommand ShuffleCommand { get; }
    public RelayCommand ResetCommand { get; }
    public RelayCommand<CardItem?> FlipCommand { get; }
    public RelayCommand QuickDrawCommand { get; }
    public RelayCommand IncrementCardCountCommand { get; }
    public RelayCommand DecrementCardCountCommand { get; }
    public RelayCommand IncrementQuickCountCommand { get; }
    public RelayCommand DecrementQuickCountCommand { get; }

    public CardViewModel(ListsViewModel lists)
    {
        _lists = lists;
        ShuffleCommand = new RelayCommand(Shuffle);
        ResetCommand = new RelayCommand(Reset);
        FlipCommand = new RelayCommand<CardItem?>(FlipCard);
        QuickDrawCommand = new RelayCommand(QuickDraw);
        IncrementCardCountCommand = new RelayCommand(() => { CardCount += 1; Shuffle(); });
        DecrementCardCountCommand = new RelayCommand(() => { CardCount = Math.Max(1, CardCount - 1); Shuffle(); });
        IncrementQuickCountCommand = new RelayCommand(() => QuickCount = Math.Min(Math.Max(2, MaxCards), QuickCount + 1));
        DecrementQuickCountCommand = new RelayCommand(() => QuickCount = Math.Max(2, QuickCount - 1));
    }

    public string ListName => _lists.CurrentListName;

    public int MaxCards => Math.Max(1, _lists.People.Count);

    partial void OnEnglishModeChanged(bool value)
    {
        foreach (var card in Cards) card.DisplayName = card.ResolveName(value);
    }

    public void Shuffle()
    {
        var pool = _lists.People.Where(person => person.Name.Length > 0).ToList();
        Cards.Clear();
        if (pool.Count > 0)
        {
            for (var i = 0; i < CardCount; i++)
            {
                var person = pool[_random.Next(pool.Count)];
                Cards.Add(new CardItem(person.Name, person.EnglishName, EnglishMode));
            }
        }
        RemainingCount = Cards.Count;
    }

    public void FlipCard(CardItem? card)
    {
        if (card is null) return;
        if (card.Flipped) return;
        card.Flipped = true;
        TrayHistory.Insert(0, card.DisplayName);
        RemainingCount = Cards.Count(c => !c.Flipped);
    }

    public void QuickDraw()
    {
        var pending = Cards.Where(card => !card.Flipped).Take(QuickCount).ToList();
        for (var i = 0; i < pending.Count; i++)
        {
            var card = pending[i];
            card.Flipped = true;
            TrayHistory.Insert(0, card.DisplayName);
        }
        RemainingCount = Cards.Count(c => !c.Flipped);
    }

    public void Reset()
    {
        foreach (var card in Cards) card.Flipped = false;
        TrayHistory.Clear();
        RemainingCount = Cards.Count;
    }
}
