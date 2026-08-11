using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Cyrene.App.ViewModels;

public partial class AllocationRow : ObservableObject
{
    [ObservableProperty]
    private int index;

    [ObservableProperty]
    private string personName;

    [ObservableProperty]
    private string prizeName;

    [ObservableProperty]
    private string prizeQuality;

    public AllocationRow(int index, string personName, string prizeName, string prizeQuality)
    {
        this.index = index;
        this.personName = personName;
        this.prizeName = prizeName;
        this.prizeQuality = prizeQuality;
    }
}

public partial class LotteryAssignViewModel : ObservableObject
{
    private readonly PrizesViewModel _prizes;
    private readonly ListsViewModel _lists;
    private readonly Random _random = new();

    [ObservableProperty]
    private int assignmentCount = 3;

    [ObservableProperty]
    private string validationMessage = string.Empty;

    public ObservableCollection<AllocationRow> Allocations { get; } = [];

    public RelayCommand AssignCommand { get; }

    public LotteryAssignViewModel(PrizesViewModel prizes, ListsViewModel lists)
    {
        _prizes = prizes;
        _lists = lists;
        AssignCommand = new RelayCommand(Assign);
    }

    public int EligiblePeopleCount => _lists.People.Count(person => person.Name.Length > 0);
    public int TotalStock => _prizes.TotalStock;

    private void Assign()
    {
        ValidationMessage = string.Empty;
        var people = _lists.People.Where(person => person.Name.Length > 0).ToList();
        if (people.Count == 0)
        {
            ValidationMessage = "人员名单为空，请先在名单管理中添加人员";
            return;
        }
        if (_prizes.TotalStock < 1)
        {
            ValidationMessage = "当前奖品单没有可抽取库存";
            return;
        }
        var count = Math.Min(AssignmentCount, Math.Min(people.Count, _prizes.TotalStock));
        if (count < 1)
        {
            ValidationMessage = "分配人数至少为 1";
            return;
        }

        var shuffledPeople = people.OrderBy(_ => _random.Next()).Take(count).ToList();
        Allocations.Clear();
        for (var i = 0; i < shuffledPeople.Count; i++)
        {
            var prize = _prizes.PickWeighted();
            if (prize is null) break;
            prize.Quantity -= 1;
            Allocations.Add(new AllocationRow(i + 1, shuffledPeople[i].Name, prize.Name, prize.Quality));
        }
        OnPropertyChanged(nameof(TotalStock));
        OnPropertyChanged(nameof(EligiblePeopleCount));
    }
}
