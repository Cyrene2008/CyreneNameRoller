using CommunityToolkit.Mvvm.ComponentModel;

namespace Cyrene.App.ViewModels;

public partial class PlaceholderViewModel : ObservableObject
{
    [ObservableProperty]
    private string title;

    [ObservableProperty]
    private string note;

    public PlaceholderViewModel(string title, string note)
    {
        this.title = title;
        this.note = note;
    }
}
