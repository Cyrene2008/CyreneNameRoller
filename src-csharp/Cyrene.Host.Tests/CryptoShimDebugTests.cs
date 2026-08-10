using Cyrene.Host;

namespace Cyrene.Host.Tests;

public class CryptoShimDebugTests : IDisposable
{
    private readonly JintCoreHost _host = new(Path.Combine(AppContext.BaseDirectory, "Assets", "cyrene-core-bundle.js"));

    public void Dispose() => _host.Dispose();

    private async Task<string> Eval(string expression) =>
        (await _host.InvokeExpressionAsync(expression)).GetString()!;

    [Fact]
    public async Task MaterialEncoding_MatchesNode()
    {
        var material = await Eval("__hostUtf8Encode('cn.cyrene2008.sound-effects@1.1.1:CyreneNameRollerPlugin-v1')");
        Assert.Equal("Y24uY3lyZW5lMjAwOC5zb3VuZC1lZmZlY3RzQDEuMS4xOkN5cmVuZU5hbWVSb2xsZXJQbHVnaW4tdjE=", material);
    }

    [Fact]
    public async Task Sha256_MatchesNode()
    {
        var sha = await Eval("__hostSha256('Y24uY3lyZW5lMjAwOC5zb3VuZC1lZmZlY3RzQDEuMS4xOkN5cmVuZU5hbWVSb2xsZXJQbHVnaW4tdjE=')");
        Assert.Equal("f5VZZ1OmzwhkmgawXiABzA7ME9eFbrpCiSLmAw2mC1M=", sha);
    }

    [Fact]
    public async Task Base64Polyfills_RoundTrip()
    {
        var roundTrip = await Eval("btoa(atob('fFrxB1QRTW/QFkCv6WVfhg=='))");
        Assert.Equal("fFrxB1QRTW/QFkCv6WVfhg==", roundTrip);
        var saltBytes = await Eval("toB64(fromB64('fFrxB1QRTW/QFkCv6WVfhg=='))");
        Assert.Equal("fFrxB1QRTW/QFkCv6WVfhg==", saltBytes);
    }

    [Fact]
    public async Task Pbkdf2_MatchesNode()
    {
        var key = await Eval("__hostPbkdf2('Y24uY3lyZW5lMjAwOC5zb3VuZC1lZmZlY3RzQDEuMS4xOkN5cmVuZU5hbWVSb2xsZXJQbHVnaW4tdjE=', 'fFrxB1QRTW/QFkCv6WVfhg==', 120000)");
        Assert.Equal("pYgHDXgLV0bKvdUsxbTFEbE3JAYUKO/tMdNgclT3qhU=", key);
    }
}



