using Cyrene.Host;

namespace Cyrene.Host.Tests;

public class PluginSafetyPolicyTests
{
    private static readonly DateTimeOffset Now = DateTimeOffset.UtcNow;

    [Fact]
    public void BelowThreshold_NotDisabled()
    {
        var policy = new PluginSafetyPolicy(failureThreshold: 3);
        policy.RecordFailure("p1", Now);
        policy.RecordFailure("p1", Now);
        Assert.False(policy.IsDisabled("p1", Now));
    }

    [Fact]
    public void AtThreshold_Disabled()
    {
        var policy = new PluginSafetyPolicy(failureThreshold: 3);
        for (var index = 0; index < 3; index += 1) policy.RecordFailure("p1", Now);
        Assert.True(policy.IsDisabled("p1", Now));
        Assert.Contains("p1", policy.DisabledPlugins(Now));
    }

    [Fact]
    public void CooldownExpiry_Reenables()
    {
        var policy = new PluginSafetyPolicy(failureThreshold: 2, cooldown: TimeSpan.FromMinutes(10));
        for (var index = 0; index < 2; index += 1) policy.RecordFailure("p1", Now);
        Assert.True(policy.IsDisabled("p1", Now));
        Assert.False(policy.IsDisabled("p1", Now.AddMinutes(11)));
    }

    [Fact]
    public void Reset_ClearsFailures()
    {
        var policy = new PluginSafetyPolicy(failureThreshold: 1);
        policy.RecordFailure("p1", Now);
        policy.Reset("p1");
        Assert.False(policy.IsDisabled("p1", Now));
    }

    [Fact]
    public void FailuresAreIsolatedPerPlugin()
    {
        var policy = new PluginSafetyPolicy(failureThreshold: 2);
        for (var index = 0; index < 2; index += 1) policy.RecordFailure("p1", Now);
        Assert.True(policy.IsDisabled("p1", Now));
        Assert.False(policy.IsDisabled("p2", Now));
    }
}
