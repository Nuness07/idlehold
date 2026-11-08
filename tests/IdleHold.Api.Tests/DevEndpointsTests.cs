using System.Net;
using System.Net.Http.Json;
using IdleHold.Api.Dev;
using IdleHold.Api.Players;
using IdleHold.Engine;

namespace IdleHold.Api.Tests;

/// <summary>The development tools (GM mode), played as a guest with the tools switched on.</summary>
public sealed class DevEndpointsTests(PostgresFixture database) : IClassFixture<PostgresFixture>, IAsyncLifetime
{
    private readonly ApiFactory _factory = new(database.ConnectionString, devTools: true);
    private HttpClient _client = null!;

    public async Task InitializeAsync() => _client = await _factory.CreateGuestClientAsync();

    public async Task DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
    }

    [Fact]
    public async Task DevRoutes_DoNotExist_WhenTheToolsAreOff()
    {
        await using var factory = new ApiFactory(database.ConnectionString);
        using var client = await factory.CreateGuestClientAsync();

        var response = await client.PostAsync("/dev/player/reset", content: null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task TheApi_RefusesToStart_WithTheToolsOnInProduction()
    {
        await using var factory = new ApiFactory(database.ConnectionString, devTools: true, environment: "Production");

        var error = Assert.Throws<InvalidOperationException>(() => factory.CreateClient());

        Assert.Contains("DevTools:Enabled", error.Message);
    }

    [Fact]
    public async Task DevRoutes_WithoutASession_Return401()
    {
        using var stranger = _factory.CreateClient();

        var response = await stranger.PostAsync("/dev/player/reset", content: null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task SetLevel_GivesTheTradeTheXpThatStartsThatLevel()
    {
        var player = await SetLevelAsync("woodcutting", 10);

        Assert.Equal(10, player.Skills["woodcutting"].Level);
        Assert.Equal(Experience.XpForLevel(10), player.Skills["woodcutting"].Xp);
        Assert.Equal(10, (await GetPlayerAsync()).Skills["woodcutting"].Level); // Saved, not only answered.
    }

    [Fact]
    public async Task SetLevel_BackToOne_ClearsTheTradesXp()
    {
        await SetLevelAsync("woodcutting", 10);

        var player = await SetLevelAsync("woodcutting", 1);

        Assert.DoesNotContain("woodcutting", player.Skills.Keys);
    }

    [Theory]
    [InlineData("woodcutting", 0)]
    [InlineData("woodcutting", Experience.MaxLevel + 1)]
    [InlineData("juggling", 5)]
    public async Task SetLevel_WithAnUnknownTradeOrLevel_Returns400(string skillId, int level)
    {
        var response = await _client.PutAsJsonAsync($"/dev/player/skills/{skillId}", new SetLevelRequest(level));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task SetItemCount_FillsAndEmptiesTheStores()
    {
        var filled = await SetItemCountAsync("pine-log", 500);
        Assert.Equal(500, filled.Inventory["pine-log"]);

        var emptied = await SetItemCountAsync("pine-log", 0);
        Assert.DoesNotContain("pine-log", emptied.Inventory.Keys);
    }

    [Fact]
    public async Task SetItemCount_GivesAndTakesATool()
    {
        var given = await SetItemCountAsync("chipped-stone-axe", 1);
        Assert.Equal("chipped-stone-axe", given.Tools.Single(tool => tool.Family == "axe").OwnedItemId);

        var taken = await SetItemCountAsync("chipped-stone-axe", 0);
        Assert.Null(taken.Tools.Single(tool => tool.Family == "axe").OwnedItemId);
    }

    [Theory]
    [InlineData("pine-log", -1)]
    [InlineData("pine-log", DevEndpoints.MaxItemCount + 1)]
    [InlineData("chipped-stone-axe", 2)] // A tool is unique.
    [InlineData("gold-bar", 1)]
    public async Task SetItemCount_WithAnUnknownItemOrCount_Returns400(string itemId, long count)
    {
        var response = await _client.PutAsJsonAsync($"/dev/player/items/{itemId}", new SetItemCountRequest(count));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Advance_RunsTheWorkedActionAsIfThePlayerWereAway()
    {
        (await _client.PostAsJsonAsync("/me/player/action", new StartActionRequest("cut-pine"))).EnsureSuccessStatusCode();

        var player = await AdvanceAsync(minutes: 1);

        // cut-pine takes 3 s: one minute makes 20 logs.
        Assert.Equal(20, player.Inventory["pine-log"]);
        Assert.Equal(200, player.Skills["woodcutting"].Xp);
        Assert.Equal(20, (await GetPlayerAsync()).Inventory["pine-log"]); // Saved, not only answered.
    }

    [Theory]
    [InlineData(0)]
    [InlineData(30 * 24 * 60 + 1)]
    public async Task Advance_OutsideTheAllowedRange_Returns400(int minutes)
    {
        var response = await _client.PostAsJsonAsync("/dev/player/advance", new AdvanceRequest(minutes));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Reset_EmptiesTheHoldButKeepsIt()
    {
        var before = await SetItemCountAsync("pebble", 5);
        await SetLevelAsync("mining", 20);
        (await _client.PostAsJsonAsync("/me/player/action", new StartActionRequest("mine-stone"))).EnsureSuccessStatusCode();

        var response = await _client.PostAsync("/dev/player/reset", content: null);
        response.EnsureSuccessStatusCode();
        var player = (await response.Content.ReadFromJsonAsync<PlayerResponse>())!;

        Assert.Equal(before.Id, player.Id);
        Assert.Empty(player.Inventory);
        Assert.Empty(player.Skills);
        Assert.Null(player.ActiveAction);
    }

    private async Task<PlayerResponse> GetPlayerAsync() =>
        (await _client.GetFromJsonAsync<PlayerResponse>("/me/player"))!;

    private Task<PlayerResponse> SetLevelAsync(string skillId, int level) =>
        SendAsync(_client.PutAsJsonAsync($"/dev/player/skills/{skillId}", new SetLevelRequest(level)));

    private Task<PlayerResponse> SetItemCountAsync(string itemId, long count) =>
        SendAsync(_client.PutAsJsonAsync($"/dev/player/items/{itemId}", new SetItemCountRequest(count)));

    private Task<PlayerResponse> AdvanceAsync(int minutes) =>
        SendAsync(_client.PostAsJsonAsync("/dev/player/advance", new AdvanceRequest(minutes)));

    private static async Task<PlayerResponse> SendAsync(Task<HttpResponseMessage> request)
    {
        var response = await request;
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<PlayerResponse>())!;
    }
}
