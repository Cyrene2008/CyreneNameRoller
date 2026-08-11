using System.Collections.ObjectModel;
using System.Text.Json;
using CommunityToolkit.Mvvm.ComponentModel;

namespace Cyrene.App.ViewModels;

public partial class AnnouncementItem : ObservableObject
{
    [ObservableProperty]
    private string title = string.Empty;

    [ObservableProperty]
    private string tag = string.Empty;

    [ObservableProperty]
    private string time = string.Empty;

    [ObservableProperty]
    private string content = string.Empty;

    [ObservableProperty]
    private bool important;
}

public partial class AnnouncementViewModel : ObservableObject
{
    private const string AnnouncementsPath = @"D:\CyreneProject\CyrenesNameRoller\public\announcements.json";

    [ObservableProperty]
    private AnnouncementItem? selected;

    public ObservableCollection<AnnouncementItem> Items { get; } = [];

    public AnnouncementViewModel()
    {
        try
        {
            var json = File.ReadAllText(AnnouncementsPath);
            using var document = JsonDocument.Parse(json);
            foreach (var element in document.RootElement.EnumerateArray())
            {
                var item = new AnnouncementItem
                {
                    Title = element.GetProperty("title").GetProperty("cn").GetString() ?? "",
                    Tag = element.TryGetProperty("tag", out var tag) ? tag.GetProperty("cn").GetString() ?? "" : "",
                    Time = element.TryGetProperty("time", out var time) ? time.GetString() ?? "" : "",
                    Content = element.GetProperty("content").GetProperty("cn").GetString() ?? "",
                    Important = element.TryGetProperty("important", out var important) && important.GetBoolean()
                };
                Items.Add(item);
            }
            if (Items.Count > 0) Selected = Items[0];
        }
        catch
        {
            // 公告文件缺失时保持空列表，页面显示空状态
        }
    }
}
