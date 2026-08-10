using Avalonia.Controls;
using Cyrene.App.ViewModels;

namespace Cyrene.App;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        DataContext = new MainViewModel();
    }
}