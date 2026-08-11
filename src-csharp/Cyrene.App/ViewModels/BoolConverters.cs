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

    public static readonly IValueConverter RollingLabel = new FuncConverter(value =>
        value is true ? "停止" : "开始");

    public static readonly IValueConverter IsNotEmpty = new FuncConverter(value =>
        value is string text && text.Length > 0);

    public static readonly IValueConverter TimestampToLocal = new FuncConverter(value =>
        value is long timestamp ? DateTimeOffset.FromUnixTimeMilliseconds(timestamp).LocalDateTime.ToString("yyyy-MM-dd HH:mm:ss") : "");

    public static readonly IValueConverter IconGeometry = new FuncConverter(
        value => value is string name && name.Length > 0 ? Services.FluentIcons.Get(name) : null,
        (value, parameter) => parameter is string name ? Services.FluentIcons.Get(name) : null);

    public static readonly IValueConverter StringEquals = new FuncConverter(
        value => false,
        (value, parameter) => value is string text && parameter is string target && text == target);

    public static readonly IValueConverter RollingIcon = new FuncConverter(value =>
        Services.FluentIcons.Get(value is true ? "stop-24-filled" : "play-24-filled"));

    public static readonly IValueConverter CountToFontSize = new FuncConverter(value =>
        value is int count && count > 1 ? 34.0 : 52.0);

    public static readonly IValueConverter EqualsTwoWay = new TwoWayConverter(
        (value, parameter) => value as string == parameter as string,
        (value, parameter) => value is true ? parameter : Avalonia.Data.BindingOperations.DoNothing);

    public static readonly IValueConverter BoolNotTwoWay = new TwoWayConverter(
        (value, _) => value is bool b && !b,
        (value, _) => value is true ? false : value is false ? true : Avalonia.Data.BindingOperations.DoNothing);

    public static readonly IValueConverter IdentityTwoWay = new TwoWayConverter(
        (value, _) => value,
        (value, _) => value);

    public static readonly IValueConverter MenuOpen = new FuncConverter(value => value is not null);

    public static readonly IValueConverter EqualsParamTwoWay = new TwoWayConverter(
        (value, parameter) => value as string == parameter as string,
        (value, parameter) => value is true ? parameter : Avalonia.Data.BindingOperations.DoNothing);

    public static readonly IValueConverter PrimarySlideX = new FuncConverter(value =>
        new Avalonia.Media.TranslateTransform(value is not null ? -260 : 0, 0));

    public static readonly IValueConverter SecondarySlideX = new FuncConverter(value =>
        new Avalonia.Media.TranslateTransform(value is not null ? 0 : 260, 0));

    public static readonly IValueConverter Rotate90 = new FuncConverter(value =>
        TransformOperations.Parse(value is true ? "rotate(90deg)" : "rotate(0deg)"));

    private sealed class FuncConverter : IValueConverter
    {
        private readonly Func<object?, object?> _convert;
        private readonly Func<object?, object?, object?>? _convertWithParam;

        public FuncConverter(Func<object?, object?> convert, Func<object?, object?, object?>? convertWithParam = null)
        {
            _convert = convert;
            _convertWithParam = convertWithParam;
        }

        public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
        {
            var primary = _convert(value);
            if (primary is not null) return primary;
            return _convertWithParam is not null ? _convertWithParam(value, parameter) : null;
        }

        public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture) =>
            throw new NotSupportedException();
    }

    private sealed class TwoWayConverter(Func<object?, object?, object?> convert, Func<object?, object?, object?> convertBack) : IValueConverter
    {
        public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture) => convert(value, parameter);

        public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture) => convertBack(value, parameter);
    }
}
