using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using IdleHold.Api.Dev;
using IdleHold.Api.Players;

namespace IdleHold.Api.Tests;

// Uses the real content: grilled berries take 2 berries and 3 s, and a hazel log lasts 2 dishes. The GM routes set
// the stores and levels.
public sealed class CookingEndpointsTests(PostgresFixture database) : IClassFixture<PostgresFixture>, IAsyncLifetime
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
    public async Task Content_ListsTheFuelsAndEachActionsLevelAndFire()
    {
        var content = (await _client.GetFromJsonAsync<ContentResponse>("/content"))!;

        Assert.Equal([new FuelResponse("hazel-log", 2), new FuelResponse("pine-log", 4), new FuelResponse("birch-log", 6)], content.Fuels);
        var pine = Assert.Single(content.Actions, action => action.Id == "cut-pine");
        Assert.Equal(15, pine.RequiredLevel);
        Assert.True(Assert.Single(content.Actions, action => action.Id == "cook-grilled-berries").UsesFuel);
    }

    [Fact]
    public async Task StartBelowTheActionsLevel_Returns409LevelTooLow()
    {
        await SetItemCountAsync("chipped-stone-axe", 1);

        var response = await StartAsync(new StartActionRequest("cut-pine"));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("level-too-low", await ReasonAsync(response));
    }

    [Fact]
    public async Task CookWithoutAFuel_Returns400()
    {
        await SetItemCountAsync("wild-berry", 10);

        var response = await StartAsync(new StartActionRequest("cook-grilled-berries"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CookWithNoneOfTheChosenFuel_Returns409MissingFuel()
    {
        await SetItemCountAsync("wild-berry", 10);

        var response = await StartAsync(new StartActionRequest("cook-grilled-berries", "pine-log"));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("missing-fuel", await ReasonAsync(response));
    }

    [Fact]
    public async Task Cooking_BurnsTheChosenLogs_AndTheFireKeepsWhatIsLeft()
    {
        await SetItemCountAsync("wild-berry", 6);
        await SetItemCountAsync("hazel-log", 5);
        (await StartAsync(new StartActionRequest("cook-grilled-berries", "hazel-log"))).EnsureSuccessStatusCode();

        // 6 berries make 3 dishes; 2 logs burn, and the second has a dish left in it.
        _factory.Clock.Advance(TimeSpan.FromMinutes(1));
        var player = (await _client.GetFromJsonAsync<PlayerResponse>("/me/player"))!;

        Assert.Equal(3, player.Inventory["grilled-berries"]);
        Assert.Equal(3, player.Inventory["hazel-log"]);
        Assert.Equal(1, player.FireCyclesLeft);
        Assert.Null(player.ActiveAction);
    }

    [Fact]
    public async Task TheChosenFuel_IsSavedWithTheAction()
    {
        await SetItemCountAsync("wild-berry", 100);
        await SetItemCountAsync("pine-log", 5);

        var started = await StartAsync(new StartActionRequest("cook-grilled-berries", "pine-log"));
        started.EnsureSuccessStatusCode();
        var player = (await _client.GetFromJsonAsync<PlayerResponse>("/me/player"))!;

        Assert.Equal("pine-log", player.ActiveAction!.FuelItemId);
    }

    private Task<HttpResponseMessage> StartAsync(StartActionRequest request) =>
        _client.PostAsJsonAsync("/me/player/action", request);

    private async Task SetItemCountAsync(string itemId, long count) =>
        (await _client.PutAsJsonAsync($"/dev/player/items/{itemId}", new SetItemCountRequest(count))).EnsureSuccessStatusCode();

    private static async Task<string?> ReasonAsync(HttpResponseMessage response)
    {
        using var problem = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return problem.RootElement.GetProperty("reason").GetString();
    }
}
