using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Cyrene.Host;

public static class CnrpEnvelope
{
    public const string Magic = "CNRP1\n";

    public static (byte[] ZipBytes, JsonElement Envelope) Decrypt(byte[] packageBytes)
    {
        if (packageBytes.Length < Magic.Length || Encoding.UTF8.GetString(packageBytes, 0, Magic.Length) != Magic)
        {
            throw new InvalidOperationException("不是有效的 .cnrp 插件包");
        }
        using var envelopeDocument = JsonDocument.Parse(Encoding.UTF8.GetString(packageBytes, Magic.Length, packageBytes.Length - Magic.Length));
        var envelope = envelopeDocument.RootElement;
        if (envelope.GetProperty("v").GetInt32() != 1 || !envelope.TryGetProperty("id", out _) || !envelope.TryGetProperty("version", out _)
            || !envelope.TryGetProperty("salt", out _) || !envelope.TryGetProperty("iv", out _) || !envelope.TryGetProperty("data", out _) || !envelope.TryGetProperty("hash", out _))
        {
            throw new InvalidOperationException("CNRP 加密封装无效");
        }
        var id = envelope.GetProperty("id").GetString()!;
        var version = envelope.GetProperty("version").GetString()!;
        var hash = envelope.GetProperty("hash").GetString()!;
        var material = Encoding.UTF8.GetBytes($"{id}@{version}:CyreneNameRollerPlugin-v1");
        var key = Rfc2898DeriveBytes.Pbkdf2(material, Convert.FromBase64String(envelope.GetProperty("salt").GetString()!), 120000, HashAlgorithmName.SHA256, 32);
        var iv = Convert.FromBase64String(envelope.GetProperty("iv").GetString()!);
        var data = Convert.FromBase64String(envelope.GetProperty("data").GetString()!);
        var additionalData = Encoding.UTF8.GetBytes($"{id}\0{version}\0{hash}");
        const int tagLength = 16;
        var tag = data[^tagLength..];
        var ciphertext = data[..^tagLength];
        using var aes = new AesGcm(key, tagLength);
        var plain = new byte[ciphertext.Length];
        aes.Decrypt(iv, ciphertext, tag, plain, additionalData);
        var plainHash = Convert.ToHexString(SHA256.HashData(plain)).ToLowerInvariant();
        if (!string.Equals(plainHash, hash, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("插件包整体哈希不匹配");
        }
        return (plain, envelope.Clone());
    }
}

public sealed class PluginPackageLoader
{
    private const int MaxPluginSize = 32 * 1024 * 1024;
    private const int MaxFileCount = 256;

    private readonly JintCoreHost _core;

    public PluginPackageLoader(JintCoreHost core)
    {
        _core = core;
    }

    public async Task<JsonElement> LoadAsync(byte[] packageBytes, string expectedPublisherKey = "")
    {
        if (packageBytes.Length > MaxPluginSize) throw new InvalidOperationException("插件包超过 32 MB 限制");
        var (zipBytes, envelope) = CnrpEnvelope.Decrypt(packageBytes);
        var publisher = VerifyPublisherSignature(envelope, expectedPublisherKey);

        using var stream = new MemoryStream(zipBytes);
        using var archive = new ZipArchive(stream, ZipArchiveMode.Read);
        var entries = archive.Entries.Where(item => !item.FullName.EndsWith("/")).ToList();
        if (entries.Count > MaxFileCount) throw new InvalidOperationException("插件包文件数量过多");
        foreach (var zipEntry in entries)
        {
            await _core.InvokeAsync("validatePath", zipEntry.FullName);
        }

        var manifestEntry = entries.FirstOrDefault(item => item.FullName == "manifest.json");
        if (manifestEntry is null) throw new InvalidOperationException("插件包缺少 manifest.json");
        var manifestJson = await ReadEntryTextAsync(manifestEntry);
        using var manifestDocument = JsonDocument.Parse(manifestJson);
        var manifest = await _core.InvokeAsync("normalizePluginManifest", manifestDocument.RootElement);
        if (manifest.GetProperty("id").GetString() != envelope.GetProperty("id").GetString()
            || manifest.GetProperty("version").GetString() != envelope.GetProperty("version").GetString())
        {
            throw new InvalidOperationException("插件清单与 CNRP 封装身份不一致");
        }

        var files = new JsonObject();
        long totalUncompressedSize = 0;
        foreach (var zipEntry in entries)
        {
            await using var entryStream = zipEntry.Open();
            using var entryMemory = new MemoryStream();
            await entryStream.CopyToAsync(entryMemory);
            totalUncompressedSize += entryMemory.Length;
            if (totalUncompressedSize > 64 * 1024 * 1024) throw new InvalidOperationException("插件解压内容超过 64 MB 限制");
            files[zipEntry.FullName] = Convert.ToBase64String(entryMemory.ToArray());
        }

        var requiredFiles = new List<string>
        {
            manifest.TryGetProperty("entry", out var entry) ? entry.GetString() ?? "" : ""
        };
        if (manifest.TryGetProperty("platformEntries", out var platformEntries))
        {
            requiredFiles.AddRange(platformEntries.EnumerateObject().Select(item => item.Value.GetString() ?? ""));
        }
        foreach (var key in new[] { "icon", "readme" })
        {
            if (manifest.TryGetProperty(key, out var value)) requiredFiles.Add(value.GetString() ?? "");
        }
        if (manifest.TryGetProperty("contributes", out var contributes))
        {
            foreach (var key in new[] { "pages", "visualSurfaces" })
            {
                if (contributes.TryGetProperty(key, out var list))
                {
                    foreach (var item in list.EnumerateArray())
                    {
                        if (item.TryGetProperty("entry", out var itemEntry)) requiredFiles.Add(itemEntry.GetString() ?? "");
                        if (item.TryGetProperty("platformEntries", out var itemPlatforms))
                        {
                            requiredFiles.AddRange(itemPlatforms.EnumerateObject().Select(p => p.Value.GetString() ?? ""));
                        }
                    }
                }
            }
            foreach (var key in new[] { "animationPacks", "fonts", "nativeViews" })
            {
                if (contributes.TryGetProperty(key, out var list))
                {
                    foreach (var item in list.EnumerateArray())
                    {
                        if (item.TryGetProperty("source", out var source)) requiredFiles.Add(source.GetString() ?? "");
                    }
                }
            }
        }
        if (manifest.TryGetProperty("ui", out var ui) && ui.TryGetProperty("pages", out var uiPages))
        {
            foreach (var page in uiPages.EnumerateArray())
            {
                if (page.TryGetProperty("source", out var source)) requiredFiles.Add(source.GetString() ?? "");
            }
        }
        foreach (var name in requiredFiles.Where(name => name.Length > 0))
        {
            if (!files.ContainsKey(name)) throw new InvalidOperationException($"插件清单引用的文件不存在：{name}");
        }

        var animationPacks = new JsonArray();
        if (manifest.TryGetProperty("contributes", out var contributesForAnimations)
            && contributesForAnimations.TryGetProperty("animationPacks", out var animationDeclarations))
        {
            foreach (var declaration in animationDeclarations.EnumerateArray())
            {
                var source = declaration.GetProperty("source").GetString()!;
                var raw = JsonDocument.Parse(await ReadEntryTextAsync(entries.First(item => item.FullName == source)));
                animationPacks.Add(await _core.InvokeAsync("normalizeAnimationPack", raw.RootElement, declaration));
            }
        }

        var uiPagesResult = new JsonArray();
        if (manifest.TryGetProperty("ui", out var uiSection) && uiSection.TryGetProperty("pages", out var uiPagesList))
        {
            foreach (var page in uiPagesList.EnumerateArray())
            {
                var source = page.GetProperty("source").GetString()!;
                var raw = JsonDocument.Parse(await ReadEntryTextAsync(entries.First(item => item.FullName == source)));
                var tree = await _core.InvokeAsync("normalizeUiTree", raw.RootElement,
                    JsonSerializer.SerializeToElement(new { pluginId = manifest.GetProperty("id").GetString() }));
                var pageObject = new JsonObject
                {
                    ["id"] = page.GetProperty("id").GetString(),
                    ["title"] = page.GetProperty("title").GetString(),
                    ["source"] = source,
                    ["tree"] = JsonNode.Parse(tree.GetRawText())
                };
                uiPagesResult.Add(pageObject);
            }
        }

        using var packageHashDocument = JsonDocument.Parse(files.ToJsonString());
        var packageHash = await _core.InvokeAsync("sha256Hex", packageBytes);

        var result = new JsonObject
        {
            ["manifest"] = JsonNode.Parse(manifest.GetRawText()),
            ["files"] = files,
            ["animationPacks"] = animationPacks,
            ["nativeViews"] = new JsonArray(),
            ["uiPages"] = uiPagesResult,
            ["packageHash"] = packageHash.GetString(),
            ["packageSignature"] = envelope.TryGetProperty("signature", out var signature) ? signature.GetString() ?? "" : "",
            ["publisherKey"] = publisher.PublisherKey,
            ["publisherVerified"] = publisher.Verified,
            ["signatureAlgorithm"] = envelope.TryGetProperty("signatureAlgorithm", out var algorithm) ? algorithm.GetString() ?? "" : ""
        };
        var readmeName = manifest.TryGetProperty("readme", out var readmePath) ? readmePath.GetString() : "README.md";
        var readmeEntry = entries.FirstOrDefault(item => item.FullName == readmeName);
        result["readme"] = readmeEntry is null ? "" : await ReadEntryTextAsync(readmeEntry);
        return JsonDocument.Parse(result.ToJsonString()).RootElement;
    }

    private static (bool Verified, string PublisherKey) VerifyPublisherSignature(JsonElement envelope, string expectedPublisherKey)
    {
        if (!envelope.TryGetProperty("signature", out var signatureElement) || signatureElement.ValueKind != JsonValueKind.String || signatureElement.GetString()!.Length == 0)
        {
            if (expectedPublisherKey.Length > 0) throw new InvalidOperationException("插件目录要求发布者签名，但插件包未签名");
            return (false, "");
        }
        var signature = signatureElement.GetString()!;
        if (envelope.GetProperty("signatureAlgorithm").GetString() != "Ed25519" || !envelope.TryGetProperty("publisherKey", out var publisherKeyElement))
        {
            throw new InvalidOperationException("插件发布者签名格式无效");
        }
        var publisherKey = publisherKeyElement.GetString()!;
        if (expectedPublisherKey.Length > 0 && publisherKey != expectedPublisherKey)
        {
            throw new InvalidOperationException("插件发布者公钥与目录登记不一致");
        }
        var publicKey = Convert.FromBase64String(publisherKey);
        var signatureBytes = Convert.FromBase64String(signature);
        var id = envelope.GetProperty("id").GetString()!;
        var version = envelope.GetProperty("version").GetString()!;
        var hash = envelope.GetProperty("hash").GetString()!;
        var signed = Encoding.UTF8.GetBytes($"{id}\0{version}\0{hash}");
        var signer = new Org.BouncyCastle.Crypto.Signers.Ed25519Signer();
        signer.Init(false, new Org.BouncyCastle.Crypto.Parameters.Ed25519PublicKeyParameters(publicKey, 0));
        signer.BlockUpdate(signed, 0, signed.Length);
        if (!signer.VerifySignature(signatureBytes))
        {
            throw new InvalidOperationException("插件发布者签名验证失败，文件可能已被替换");
        }
        return (true, publisherKey);
    }

    private static async Task<string> ReadEntryTextAsync(ZipArchiveEntry entry)
    {
        await using var stream = entry.Open();
        using var reader = new StreamReader(stream, Encoding.UTF8);
        return await reader.ReadToEndAsync();
    }
}



