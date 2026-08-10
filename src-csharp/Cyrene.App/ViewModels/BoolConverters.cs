using System.Globalization;
using Avalonia.Animation;
using Avalonia.Data.Converters;
using Avalonia.Media.Transformation;

namespace Cyrene.App.ViewModels;

public static class BoolConverters
{
    public static readonly IValueConverter Not = new FuncConverter(value => value is bool boolean && !boolean);

    public static readonly IValueConverter IsNotNull = new FuncConverter(value => value is not null);

    public static readonly IValueConverter HasResultOpacity = new FuncConverter(value =>
        value is null ? 0.0 : 1.0);

    public static readonly IValueConverter SelectedOpacity = new FuncConverter(value =>
        value is true ? 1.0 : 0.0);

    public static readonly IValueConverter SelectedScale = new FuncConverter(value =>
        TransformOperations.Parse(value is true ? "scale(1, 1)" : "scale(1, 0.4)"));

    public static readonly IValueConverter Rotate180 = new FuncConverter(value =>
        TransformOperations.Parse(value is true ? "rotate(180deg)" : "rotate(0deg)"));

    public static readonly IValueConverter ExpandHeight = new FuncConverter(value =>
        value is true ? 400.0 : 0.0);

    public static readonly IValueConverter CollapsedOpacity = new FuncConverter(value =>
        value is true ? 0.0 : 1.0);

    public static readonly IValueConverter CountPositive = new FuncConverter(value =>
        value is int count && count > 0);

    public static readonly IValueConverter TimestampToLocal = new FuncConverter(value =>
        value is long timestamp ? DateTimeOffset.FromUnixTimeMilliseconds(timestamp).LocalDateTime.ToString("yyyy-MM-dd HH:mm:ss") : "");

    private sealed class FuncConverter(Func<object?, object?> convert) : IValueConverter
    {
        public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture) => convert(value);

        public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture) =>
            throw new NotSupportedException();
    }
}
