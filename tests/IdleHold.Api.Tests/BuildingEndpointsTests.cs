using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using IdleHold.Api.Dev;
using IdleHold.Api.Players;

namespace IdleHold.Api.Tests;

// Uses the real content: the campfire costs 10 twigs, 5 reeds and 8 pebbles, and Cooking waits for it.
public sealed class BuildingEndpointsTests(PostgresFixture database) : IClassFixture<PostgresFixture>, IAsyncLifetime
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
    public async Task Content_ListsTheCampfireAndTheTradeThatWaitsForIt()
    {
        var content = (await _client.GetFromJsonAsync<ContentResponse>("/content"))!;

        var campfire = Assert.Single(content.Buildings);
        Assert.Equal("campfire", campfire.Id);
        Assert.Equal([new ItemAmountResponse("twig", 10), new ItemAmountResponse("reed", 5), new ItemAmountResponse("pebble", 8)], campfire.Cost);
        Assert.Equal("campfire", Assert.Single(content.Skills, skill => skill.Id == "cooking").RequiredBuildingId);
    }

    [Fact]
    public async Task CookingBeforeTheCampfireIsLit_Returns409MissingBuilding()
    {
        await SetItemCountAsync("wild-berry", 10);
        await SetItemCountAsync("hazel-log", 5);

        var response = await _client.PostAsJsonAsync("/me/player/action", new StartActionRequest("cook-grilled-berries", "hazel-log"));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("missing-building", await ReasonAsync(response));
    }

    [Fact]
    public async Task LightingTheCampfire_TakesItsCostAndOpensCooking()
    {
        await SetItemCountAsync("twig", 12);
        await SetItemCountAsync("reed", 5);
        await SetItemCountAsync("pebble", 8);

        var response = await BuildAsync("campfire");

        response.EnsureSuccessStatusCode();
        var player = (await response.Content.ReadFromJsonAsync<PlayerResponse>())!;
        Assert.Equal(["campfire"], player.Buildings);
        Assert.Equal(2, player.Inventory["twig"]);
        Assert.False(player.Inventory.ContainsKey("reed"));
        Assert.DoesNotContain(player.LockedTrades, trade => trade.SkillId == "cooking");

        // The building is saved.
        var reloaded = (await _client.GetFromJsonAsync<PlayerResponse>("/me/player"))!;
        Assert.Equal(["campfire"], reloaded.Buildings);
    }

    [Fact]
    public async Task LightingWithoutTheWholeCost_Returns409MissingInputs_AndTakesNothing()
    {
        await SetItemCountAsync("twig", 10);
        await SetItemCountAsync("reed", 4);
        await SetItemCountAsync("pebble", 8);

        var response = await BuildAsync("campfire");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("missing-inputs", await ReasonAsync(response));
        var player = (await _client.GetFromJsonAsync<PlayerResponse>("/me/player"))!;
        Assert.Equal(10, player.Inventory["twig"]);
        Assert.Empty(player.Buildings);
    }

    [Fact]
    public async Task LightingTwice_Returns409AlreadyBuilt()
    {
        await SetItemCountAsync("twig", 20);
        await SetItemCountAsync("reed", 10);
        await SetItemCountAsync("pebble", 16);
        (await BuildAsync("campfire")).EnsureSuccessStatusCode();

        var response = await BuildAsync("campfire");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("already-built", await ReasonAsync(response));
    }

    [Fact]
    public async Task BuildingSomethingUnknown_Returns400()
    {
        var response = await BuildAsync("tower");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task BuildingWithoutASession_Returns401()
    {
        using var anonymous = _factory.CreateClient();

        var response = await anonymous.PostAsync("/me/player/buildings/campfire", null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private Task<HttpResponseMessage> BuildAsync(string buildingId) =>
        _client.PostAsync($"/me/player/buildings/{buildingId}", null);

    private async Task SetItemCountAsync(string itemId, long count) =>
        (await _client.PutAsJsonAsync($"/dev/player/items/{itemId}", new SetItemCountRequest(count))).EnsureSuccessStatusCode();

    private static async Task<string?> ReasonAsync(HttpResponseMessage response)
    {
        using var problem = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return problem.RootElement.GetProperty("reason").GetString();
    }
}
