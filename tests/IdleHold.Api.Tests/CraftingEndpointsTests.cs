using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using IdleHold.Api.Players;
using Microsoft.Extensions.DependencyInjection;

namespace IdleHold.Api.Tests;

// Uses the real content: 3 twigs + 2 pebbles make the chipped stone axe in 30 s.
public sealed class CraftingEndpointsTests : IDisposable
{
    private readonly ApiFactory _factory = new();
    private readonly HttpClient _client;

    public CraftingEndpointsTests() => _client = _factory.CreateClient();

    public void Dispose()
    {
        _client.Dispose();
        _factory.Dispose();
    }

    [Fact]
    public async Task CraftWithoutMaterials_Returns409AndSavesNothing()
    {
        var player = await CreatePlayerAsync();
        var store = _factory.Services.GetRequiredService<IPlayerStore>();
        var before = await store.GetAsync(player.Id, CancellationToken.None);

        _factory.Clock.Advance(TimeSpan.FromMinutes(1));
        var response = await StartAsync(player.Id, "craft-chipped-stone-axe");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("missing-inputs", await ReasonAsync(response));
        var after = await store.GetAsync(player.Id, CancellationToken.None);
        Assert.Equal(before!.LastUpdated, after!.LastUpdated);
    }

    [Fact]
    public async Task CraftAxe_ConsumesMaterialsMakesOneAxeAndStops()
    {
        var player = await GatherAxeMaterialsAsync();

        (await StartAsync(player.Id, "craft-chipped-stone-axe")).EnsureSuccessStatusCode();
        _factory.Clock.Advance(TimeSpan.FromMinutes(5));
        var state = await GetPlayerAsync(player.Id);

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
        (await StartAsync(player.Id, "craft-chipped-stone-axe")).EnsureSuccessStatusCode();
        _factory.Clock.Advance(TimeSpan.FromSeconds(30));

        var response = await StartAsync(player.Id, "craft-chipped-stone-axe");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("tool-already-owned", await ReasonAsync(response));
    }

    [Fact]
    public async Task MaterialsGatheredWhileAway_CountWhenStartingARecipe()
    {
        var player = await CreatePlayerAsync();
        (await StartAsync(player.Id, "gather-twigs")).EnsureSuccessStatusCode();
        _factory.Clock.Advance(TimeSpan.FromSeconds(6));
        (await StartAsync(player.Id, "pick-pebbles")).EnsureSuccessStatusCode();

        // No read in between: the 2 pebbles exist only once the start request catches the player up.
        _factory.Clock.Advance(TimeSpan.FromSeconds(4));
        var response = await StartAsync(player.Id, "craft-chipped-stone-axe");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    /// <summary>3 twigs (2 s each) and 2 pebbles (2 s each), read back so the save holds them.</summary>
    private async Task<PlayerResponse> GatherAxeMaterialsAsync()
    {
        var player = await CreatePlayerAsync();
        (await StartAsync(player.Id, "gather-twigs")).EnsureSuccessStatusCode();
        _factory.Clock.Advance(TimeSpan.FromSeconds(6));
        (await StartAsync(player.Id, "pick-pebbles")).EnsureSuccessStatusCode();
        _factory.Clock.Advance(TimeSpan.FromSeconds(4));

        var state = await GetPlayerAsync(player.Id);
        Assert.Equal(3, state.Inventory["twig"]);
        Assert.Equal(2, state.Inventory["pebble"]);
        return state;
    }

    private async Task<PlayerResponse> CreatePlayerAsync()
    {
        var response = await _client.PostAsync("/players", content: null);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<PlayerResponse>())!;
    }

    private Task<HttpResponseMessage> StartAsync(Guid playerId, string actionId) =>
        _client.PostAsJsonAsync($"/players/{playerId}/action", new StartActionRequest(actionId));

    private async Task<PlayerResponse> GetPlayerAsync(Guid playerId) =>
        (await _client.GetFromJsonAsync<PlayerResponse>($"/players/{playerId}"))!;

    private static async Task<string?> ReasonAsync(HttpResponseMessage response)
    {
        using var problem = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return problem.RootElement.GetProperty("reason").GetString();
    }
}
