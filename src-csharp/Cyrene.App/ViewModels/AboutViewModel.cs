using CommunityToolkit.Mvvm.ComponentModel;

namespace Cyrene.App.ViewModels;

public partial class AboutViewModel : ObservableObject
{
    public string AppName { get; } = "Cyreneの随机点名器";
    public string Version { get; } = "v26.2.0";
    public string BuildLine { get; } = "C# 线（Avalonia 12 + FluentAvalonia 3）";
    public string Description { get; } =
        "随机点名器桌面端 C# 版本：支持随机点名、翻牌点名、抽奖模式、统计、记录与名单管理，" +
        "与 Tauri/Web 线共享同一份核心算法（平衡算法 CAF）与数据格式。";
}
