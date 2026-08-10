using System.Text.Json;
using Cyrene.App.Services;
using Cyrene.App.ViewModels;
using Cyrene.Host;

namespace Cyrene.App.Tests;

public class RecordsTests : IDisposable
{
    private readonly string _storageRoot = Path.Combine(Path.GetTempPath(), $"cyrene-records-test-{Guid.NewGuid():N}");
    private readonly JintCoreHost _core;
    private readonly DefaultHostBridge _bridge;
    private readonly RecordsService _service;

    public RecordsTests()
    {
        _core = new JintCoreHost(Path.Combine(AppContext.BaseDirectory, "Assets", "cyrene-core-bundle.js"));
        _bridge = new DefaultHostBridge(new FileSystemHostStorage(_storageRoot));
        _service = new RecordsService(_core, _bridge);
    }

    public void Dispose()
    {
        _core.Dispose();
        try { Directory.Delete(_storageRoot, recursive: true); } catch { }
    }

    [Fact]
    public async Task SaveLoad_RoundTrips()
    {
        await _service.SaveAsync([new DrawRecord("张三", "Zhang San", 1700000000000)]);
        var loaded = await _service.LoadAsync();
        var record = Assert.Single(loaded);
        Assert.Equal("张三", record.Name);
        Assert.Equal("Zhang San", record.EnglishName);
        Assert.Equal(1700000000000, record.Time);
    }

    [Fact]
    public void Csv_BuildsHeaderAndEscapes()
    {
        var csv = CsvExporter.BuildCsv([
            new DrawRecord("张三", "Zhang, San", 1700000000000),
            new DrawRecord("李四", "Li \"Four\"", 1700000001000)
        ]);
        var lines = csv.Replace("\r\n", "\n").TrimEnd().Split('\n');
        Assert.Equal("姓名,英文名,时间", lines[0]);
        Assert.Contains("\"Zhang, San\"", lines[1]);
        Assert.Contains("\"Li \"\"Four\"\"\"", lines[2]);
    }

    [Fact]
    public void Csv_EmptyRecords_OnlyHeader()
    {
        var csv = CsvExporter.BuildCsv([]);
        Assert.Equal("姓名,英文名,时间\r\n", csv);
    }

    [Fact]
    public async Task Roller_OnStop_RecordsResult()
    {
        var lists = new ListsViewModel();
        lists.SeedSampleData();
        var recordsVm = new RecordsViewModel(_service);
        var roller = new RollerViewModel(_core, lists, recordsVm);

        var selected = await roller.SelectViaBalanceAsync(lists.People.ToList());
        await recordsVm.AddAsync(new DrawRecord(selected, "", DateTimeOffset.Now.ToUnixTimeMilliseconds()));

        var persisted = await _service.LoadAsync();
        Assert.Contains(persisted, record => record.Name == selected);
    }
}
