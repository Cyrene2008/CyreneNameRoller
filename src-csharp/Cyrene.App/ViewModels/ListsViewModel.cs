using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Cyrene.App.ViewModels;

public partial class PersonItem : ObservableObject
{
    [ObservableProperty]
    private string name = string.Empty;

    [ObservableProperty]
    private string? englishName;

    [ObservableProperty]
    private string? group;

    [ObservableProperty]
    private bool isWhiteList;
}

public partial class ListsViewModel : ObservableObject
{
    [ObservableProperty]
    private string currentListName = "默认名单";

    public System.Collections.ObjectModel.ObservableCollection<PersonItem> People { get; } = [];

    [ObservableProperty]
    private string newPersonName = string.Empty;

    [RelayCommand]
    private void AddPerson()
    {
        var name = NewPersonName.Trim();
        if (name.Length == 0) return;
        People.Add(new PersonItem { Name = name });
        NewPersonName = string.Empty;
    }

    [RelayCommand]
    private void RemovePerson(PersonItem? person)
    {
        if (person is null) return;
        People.Remove(person);
    }

    public void SeedSampleData()
    {
        if (People.Count > 0) return;
        People.Add(new PersonItem { Name = "张三", EnglishName = "Zhang San", Group = "A 组" });
        People.Add(new PersonItem { Name = "李四", EnglishName = "Li Si", Group = "A 组" });
        People.Add(new PersonItem { Name = "王五", EnglishName = "Wang Wu", Group = "B 组", IsWhiteList = true });
        People.Add(new PersonItem { Name = "赵六", EnglishName = "Zhao Liu", Group = "B 组" });
    }
}
