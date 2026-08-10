using System.Collections.Concurrent;

namespace Cyrene.Host;

public sealed class PluginSafetyPolicy
{
    private const int DefaultFailureThreshold = 3;
    private const int DefaultCooldownMinutes = 10;

    private readonly int _failureThreshold;
    private readonly TimeSpan _cooldown;
    private readonly ConcurrentDictionary<string, FailureRecord> _failures = new();

    private sealed record FailureRecord(int Count, DateTimeOffset LastFailure);

    public PluginSafetyPolicy(int failureThreshold = DefaultFailureThreshold, TimeSpan? cooldown = null)
    {
        _failureThreshold = failureThreshold;
        _cooldown = cooldown ?? TimeSpan.FromMinutes(DefaultCooldownMinutes);
    }

    public bool IsDisabled(string pluginId, DateTimeOffset now) =>
        _failures.TryGetValue(pluginId, out var record) && record.Count >= _failureThreshold && now - record.LastFailure < _cooldown;

    public void RecordFailure(string pluginId, DateTimeOffset now)
    {
        _failures.AddOrUpdate(pluginId,
            _ => new FailureRecord(1, now),
            (_, existing) => new FailureRecord(existing.Count + 1, now));
    }

    public void Reset(string pluginId) => _failures.TryRemove(pluginId, out _);

    public IReadOnlyList<string> DisabledPlugins(DateTimeOffset now) =>
        _failures.Where(pair => pair.Value.Count >= _failureThreshold && now - pair.Value.LastFailure < _cooldown)
                 .Select(pair => pair.Key)
                 .ToList();
}
