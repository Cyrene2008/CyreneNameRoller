using System.Globalization;
using Avalonia.Data.Converters;

namespace Cyrene.App.ViewModels;

public static class BoolConverters
{
    public static readonly IValueConverter Not = new FuncConverter(value => value is bool boolean && !boolean);

    public static readonly IValueConverter IsNotNull = new FuncConverter(value => value is not null);

    public static readonly IValueConverter HasResultOpacity = new FuncConverter(value =>
        value is null ? 0.0 : 1.0);

    private sealed class FuncConverter(Func<object?, object?> convert) : IValueConverter
    {
        public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture) => convert(value);

        public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture) =>
            throw new NotSupportedException();
    }
}
