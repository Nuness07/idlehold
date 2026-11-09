using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using IdleHold.Api.Players;
using Microsoft.Extensions.DependencyInjection;

namespace IdleHold.Api.Tests;

// Uses the real content: 3 twigs + 2 pebbles make the chipped stone axe in 30 s.
public sealed class CraftingEndpointsTests(PostgresFixture database) : IClassFixture<PostgresFixture>, IAsyncLifetime
{
    private readonly ApiFactory _factory = new(database.ConnectionString);
    private HttpClient _client = null!;

    public async Task InitializeAsync() => _client = await _factory.CreateGuestClientAsync();

    public async Task DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
    }

    [Fact]
    public async Task CraftWithoutMaterials_Returns409AndSavesNothing()
    {
        var player = await GetPlayerAsync();
        var store = _factory.Services.GetRequiredService<IPlayerStore>();
        var before = await store.GetAsync(player.Id, CancellationToken.None);

        _factory.Clock.Advance(TimeSpan.FromMinutes(1));
        var response = await StartAsync("craft-chipped-stone-axe");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("missing-inputs", await ReasonAsync(response));
        var after = await store.GetAsync(player.Id, CancellationToken.None);
        Assert.Equal(before!.LastUpdated, after!.LastUpdated);
    }

    [Fact]
    public async Task CraftAxe_ConsumesMaterialsMakesOneAxeAndStops()
    {
        var player = await GatherAxeMaterialsAsync();

        (await StartAsync("craft-chipped-stone-axe")).EnsureSuccessStatusCode();
        _factory.Clock.Advance(TimeSpan.FromMinutes(5));
        var state = await GetPlayerAsync();

        Assert.Equal(1, state.Inventory["chipped-stone-axe"]);
        Assert.False(state.Inventory.ContainsKey("twig"));
        Assert.False(state.Inventory.ContainsKey("pebble"));
        Assert.Equal(40, state.Skills["crafting"].Xp);
        Assert.Null(state.ActiveAction);
    }

    [Fact]
    public async Task CraftAxeTwice_Returns409ToolAlreadyOwned()
    {
        var player = await GatherAxeMaterialsAsync();
        (await StartAsync("craft-chipped-stone-axe")).EnsureSuccessStatusCode();
        _factory.Clock.Advance(TimeSpan.FromSeconds(30));

        var response = await StartAsync("craft-chipped-stone-axe");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("tool-already-owned", await ReasonAsync(response));
    }

    [Fact]
    public async Task MaterialsGatheredWhileAway_CountWhenStartingARecipe()
    {
        var player = await GetPlayerAsync();
        (await StartAsync("gather-twigs")).EnsureSuccessStatusCode();
        _factory.Clock.Advance(TimeSpan.FromSeconds(6));
        (await StartAsync("pick-pebbles")).EnsureSuccessStatusCode();

        // No read in between: the 2 pebbles exist only once the start request catches the player up.
        _factory.Clock.Advance(TimeSpan.FromSeconds(4));
        var response = await StartAsync("craft-chipped-stone-axe");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task NewPlayer_IsOfferedTheFirstTierOfEveryTool()
    {
        var player = await GetPlayerAsync();

        Assert.Contains(new ToolProgressResponse("axe", OwnedItemId: null, NextActionId: "craft-chipped-stone-axe"), player.Tools);
        Assert.Contains(new ToolProgressResponse("fishing-rod", OwnedItemId: null, NextActionId: "craft-reed-fishing-rod"), player.Tools);
    }

    [Fact]
    public async Task CraftedTool_IsOwnedAndItsRecipeIsNoLongerOffered()
    {
        await GatherAxeMaterialsAsync();
        (await StartAsync("craft-chipped-stone-axe")).EnsureSuccessStatusCode();
        _factory.Clock.Advance(TimeSpan.FromSeconds(30));

        var player = await GetPlayerAsync();

        // The stone axe is the only axe so far, so there is nothing better to make yet.
        Assert.Contains(new ToolProgressResponse("axe", "chipped-stone-axe", NextActionId: null), player.Tools);
    }

    [Fact]
    public async Task NewPlayer_SeesTheTradesLockedUntilTheirTool()
    {
        var player = await GetPlayerAsync();

        Assert.Equal(
            [
                new TradeLockResponse("woodcutting", "chipped-stone-axe"),
                new TradeLockResponse("fishing", "reed-fishing-rod"),
                new TradeLockResponse("mining", "chipped-stone-pickaxe"),
                new TradeLockResponse("carpentry", "chipped-stone-knife"),
            ],
            player.LockedTrades);
    }

    [Fact]
    public async Task StartInALockedTrade_Returns409MissingToolAndSavesNothing()
    {
        var player = await GetPlayerAsync();
        var store = _factory.Services.GetRequiredService<IPlayerStore>();
        var before = await store.GetAsync(player.Id, CancellationToken.None);

        _factory.Clock.Advance(TimeSpan.FromMinutes(1));
        var response = await StartAsync("cut-pine");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("missing-tool", await ReasonAsync(response));
        var after = await store.GetAsync(player.Id, CancellationToken.None);
        Assert.Equal(before!.LastUpdated, after!.LastUpdated);
    }

    [Fact]
    public async Task CraftedAxe_OpensWoodcutting()
    {
        await GatherAxeMaterialsAsync();
        (await StartAsync("craft-chipped-stone-axe")).EnsureSuccessStatusCode();
        _factory.Clock.Advance(TimeSpan.FromSeconds(30));

        var response = await StartAsync("cut-young-hazel");
        var player = await GetPlayerAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.DoesNotContain(player.LockedTrades, locked => locked.SkillId == "woodcutting");
    }

    /// <summary>3 twigs (2 s each) and 2 pebbles (2 s each), read back so the save holds them.</summary>
    private async Task<PlayerResponse> GatherAxeMaterialsAsync()
    {
        var player = await GetPlayerAsync();
        (await StartAsync("gather-twigs")).EnsureSuccessStatusCode();
        _factory.Clock.Advance(TimeSpan.FromSeconds(6));
        (await StartAsync("pick-pebbles")).EnsureSuccessStatusCode();
        _factory.Clock.Advance(TimeSpan.FromSeconds(4));

        var state = await GetPlayerAsync();
        Assert.Equal(3, state.Inventory["twig"]);
        Assert.Equal(2, state.Inventory["pebble"]);
        return state;
    }

    private Task<HttpResponseMessage> StartAsync(string actionId) =>
        _client.PostAsJsonAsync("/me/player/action", new StartActionRequest(actionId));

    private async Task<PlayerResponse> GetPlayerAsync() =>
        (await _client.GetFromJsonAsync<PlayerResponse>("/me/player"))!;

    private static async Task<string?> ReasonAsync(HttpResponseMessage response)
    {
        using var problem = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return problem.RootElement.GetProperty("reason").GetString();
    }
}
