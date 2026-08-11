using Avalonia;
using Avalonia.Controls;

namespace Cyrene.App.Views;

public partial class RollerView : UserControl
{
    public RollerView()
    {
        InitializeComponent();
    }
}

/// <summary>流式布局面板：子项自左向右排列、自动换行并逐行水平居中，近似 Tauri 版名字舞台的网格居中布局。</summary>
public class FlowPanel : Panel
{
    private const double GapX = 24;
    private const double GapY = 8;

    protected override Size MeasureOverride(Size availableSize)
    {
        var maxWidth = double.IsInfinity(availableSize.Width) ? 4000 : availableSize.Width;
        double x = 0, y = 0, rowHeight = 0, maxRowWidth = 0;
        foreach (var child in Children)
        {
            child.Measure(availableSize);
            var size = child.DesiredSize;
            if (x > 0 && x + size.Width > maxWidth)
            {
                x = 0;
                y += rowHeight + GapY;
                rowHeight = 0;
            }
            x += size.Width + GapX;
            rowHeight = Math.Max(rowHeight, size.Height);
            maxRowWidth = Math.Max(maxRowWidth, x);
        }
        return new Size(Math.Min(maxWidth, maxRowWidth), y + rowHeight);
    }

    protected override Size ArrangeOverride(Size finalSize)
    {
        var rows = new List<List<Control>>();
        var current = new List<Control>();
        double x = 0;
        foreach (var child in Children)
        {
            var size = child.DesiredSize;
            if (current.Count > 0 && x + size.Width > finalSize.Width)
            {
                rows.Add(current);
                current = [];
                x = 0;
            }
            current.Add(child);
            x += size.Width + GapX;
        }
        if (current.Count > 0) rows.Add(current);

        double totalHeight = rows.Sum(r => r.Max(c => c.DesiredSize.Height)) + Math.Max(0, rows.Count - 1) * GapY;
        double y = Math.Max(0, (finalSize.Height - totalHeight) / 2);
        foreach (var row in rows)
        {
            var rowWidth = row.Sum(c => c.DesiredSize.Width) + Math.Max(0, row.Count - 1) * GapX;
            double rx = Math.Max(0, (finalSize.Width - rowWidth) / 2);
            var rh = row.Max(c => c.DesiredSize.Height);
            foreach (var child in row)
            {
                child.Arrange(new Rect(rx, y, child.DesiredSize.Width, rh));
                rx += child.DesiredSize.Width + GapX;
            }
            y += rh + GapY;
        }
        return finalSize;
    }
}
