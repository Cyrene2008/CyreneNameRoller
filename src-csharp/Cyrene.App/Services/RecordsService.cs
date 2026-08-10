using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Cyrene.Host;

namespace Cyrene.App.Services;

public sealed record DrawRecord(string Name, string EnglishName, long Time);

public sealed class RecordsService
{
    private const string RecordsKey = "records";
    private readonly JintCoreHost _core;
    private readonly DefaultHostBridge _bridge;

    public RecordsService(JintCoreHost core, DefaultHostBridge bridge)
    {
        _core = core;
        _bridge = bridge;
    }

    public async Task<List<DrawRecord>> LoadAsync(CancellationToken cancellationToken = default)
    {
        var stored = await _bridge.InvokeAsync("core", "storage.read", JsonSerializer.SerializeToElement(new { key = RecordsKey }), cancellationToken);
        if (stored.ValueKind != JsonValueKind.Array) return [];
        return stored.EnumerateArray().Select(item => new DrawRecord(
            item.TryGetProperty("name", out var name) ? name.GetString() ?? "" : "",
            item.TryGetProperty("englishName", out var english) ? english.GetString() ?? "" : "",
            item.TryGetProperty("time", out var time) ? time.GetInt64() : 0)).ToList();
    }

    public async Task SaveAsync(IEnumerable<DrawRecord> records, CancellationToken cancellationToken = default)
    {
        var array = new JsonArray();
        foreach (var record in records)
        {
            array.Add(new JsonObject
            {
                ["name"] = record.Name,
                ["englishName"] = record.EnglishName,
                ["time"] = record.Time
            });
        }
        await _bridge.InvokeAsync("core", "storage.write",
            JsonSerializer.SerializeToElement(new { key = RecordsKey, value = JsonDocument.Parse(array.ToJsonString()).RootElement }),
            cancellationToken);
    }
}

public static class CsvExporter
{
    public static string BuildCsv(IEnumerable<DrawRecord> records)
    {
        var builder = new StringBuilder();
        builder.AppendLine("姓名,英文名,时间");
        foreach (var record in records)
        {
            builder.Append(Escape(record.Name)).Append(',')
                   .Append(Escape(record.EnglishName)).Append(',')
                   .Append(Escape(DateTimeOffset.FromUnixTimeMilliseconds(record.Time).LocalDateTime.ToString("yyyy-MM-dd HH:mm:ss")))
                   .AppendLine();
        }
        return builder.ToString();
    }

    private static string Escape(string value)
    {
        var safe = value ?? string.Empty;
        if (safe.Contains(',') || safe.Contains('"') || safe.Contains('\n'))
        {
            return $"\"{safe.Replace("\"", "\"\"")}\"";
        }
        return safe;
    }
}
