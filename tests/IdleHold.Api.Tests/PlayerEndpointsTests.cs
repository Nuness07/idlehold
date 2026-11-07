using System.Net;
using System.Net.Http.Json;
using IdleHold.Api.Persistence;
using IdleHold.Api.Players;
using Microsoft.Extensions.DependencyInjection;

namespace IdleHold.Api.Tests;

/// <summary>
/// The player routes, played as a guest. xUnit creates a new instance of this class for every test, so
/// each test gets a fresh API, clock and guest session; the database is shared by the class.
/// </summary>
public sealed class PlayerEndpointsTests(PostgresFixture database) : IClassFixture<PostgresFixture>, IAsyncLifetime
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
    public async Task GuestSession_StartsWithAnEmptyHold()
    {
        var player = await GetPlayerAsync();

        Assert.Empty(player.Inventory);
        Assert.Null(player.ActiveAction);
    }

    [Fact]
    public async Task EachGuestSession_HasItsOwnHold()
    {
        using var other = await _factory.CreateGuestClientAsync();
        await StartActionAsync("cut-pine");

        var theirs = await other.GetFromJsonAsync<PlayerResponse>("/me/player");

        Assert.NotEqual((await GetPlayerAsync()).Id, theirs!.Id);
        Assert.Null(theirs.ActiveAction);
    }

    [Fact]
    public async Task PlayerRoutes_WithoutASession_Return401()
    {
        using var stranger = _factory.CreateClient();

        var read = await stranger.GetAsync("/me/player");
        var start = await stranger.PostAsJsonAsync("/me/player/action", new StartActionRequest("cut-pine"));
        var stop = await stranger.DeleteAsync("/me/player/action");

        Assert.Equal(HttpStatusCode.Unauthorized, read.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, start.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, stop.StatusCode);
    }

    [Fact]
    public async Task StartAction_ThenTimePasses_GrantsRewards()
    {
        var player = await GetPlayerAsync();
        await StartActionAsync("cut-pine");

        _factory.Clock.Advance(TimeSpan.FromSeconds(10));
        var state = await GetPlayerAsync();

        // cut-pine takes 3s: 10s = 3 completions with 1s left on the bar.
        Assert.Equal(3, state.Inventory["pine-log"]);
        Assert.Equal(new SkillResponse(Xp: 30, Level: 1, LevelStartXp: 0, NextLevelXp: 100), state.Skills["woodcutting"]);
        Assert.Equal(new ActiveActionResponse("cut-pine", ProgressMs: 1000, DurationMs: 3000), state.ActiveAction);
    }

    [Fact]
    public async Task OfflineProgress_IsCalculatedWhenThePlayerComesBack()
    {
        var player = await GetPlayerAsync();
        await StartActionAsync("cut-pine");

        _factory.Clock.Advance(TimeSpan.FromHours(8));
        var state = await GetPlayerAsync();

        Assert.Equal(9600, state.Inventory["pine-log"]);
        var woodcutting = state.Skills["woodcutting"];
        Assert.True(woodcutting.Level > 1);
        Assert.InRange(woodcutting.Xp, woodcutting.LevelStartXp, woodcutting.NextLevelXp!.Value - 1);
    }

    [Fact]
    public async Task Reading_ComputesNowWithoutWritingTheSave()
    {
        var player = await GetPlayerAsync();
        await StartActionAsync("cut-pine");
        var store = _factory.Services.GetRequiredService<IPlayerStore>();
        var savedAfterStart = await store.GetAsync(player.Id, CancellationToken.None);

        _factory.Clock.Advance(TimeSpan.FromSeconds(9));
        var first = await GetPlayerAsync();
        _factory.Clock.Advance(TimeSpan.FromSeconds(3));
        var second = await GetPlayerAsync();

        // Each read is caught up to its own "now"...
        Assert.Equal(3, first.Inventory["pine-log"]);
        Assert.Equal(4, second.Inventory["pine-log"]);
        // ...while the stored save is still the one written by the command.
        var savedNow = await store.GetAsync(player.Id, CancellationToken.None);
        Assert.Equal(savedAfterStart!.LastUpdated, savedNow!.LastUpdated);
        Assert.Equal(StateDocument.From(savedAfterStart.State).Serialize(), StateDocument.From(savedNow.State).Serialize());
    }

    [Fact]
    public async Task Command_SavesTheCaughtUpState()
    {
        var player = await GetPlayerAsync();
        await StartActionAsync("cut-pine");
        _factory.Clock.Advance(TimeSpan.FromSeconds(10));

        await _client.DeleteAsync("/me/player/action");

        var saved = await _factory.Services.GetRequiredService<IPlayerStore>().GetAsync(player.Id, CancellationToken.None);
        Assert.Equal(3, saved!.State.ItemCount("pine-log"));
        Assert.Null(saved.State.ActiveAction);
        Assert.Equal(_factory.Clock.GetUtcNow(), saved.LastUpdated);
    }

    [Fact]
    public async Task StopAction_FreezesProgress()
    {
        var player = await GetPlayerAsync();
        await StartActionAsync("cut-pine");
        _factory.Clock.Advance(TimeSpan.FromSeconds(6));

        var stop = await _client.DeleteAsync("/me/player/action");
        _factory.Clock.Advance(TimeSpan.FromHours(1));
        var state = await GetPlayerAsync();

        Assert.Equal(HttpStatusCode.OK, stop.StatusCode);
        Assert.Null(state.ActiveAction);
        Assert.Equal(2, state.Inventory["pine-log"]);
    }

    [Theory]
    [InlineData("fly")]
    [InlineData("")]
    public async Task StartAction_InvalidAction_Returns400(string actionId)
    {
        var response = await _client.PostAsJsonAsync("/me/player/action", new StartActionRequest(actionId));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private async Task StartActionAsync(string actionId)
    {
        var response = await _client.PostAsJsonAsync("/me/player/action", new StartActionRequest(actionId));
        response.EnsureSuccessStatusCode();
    }

    private async Task<PlayerResponse> GetPlayerAsync() =>
        (await _client.GetFromJsonAsync<PlayerResponse>("/me/player"))!;
}
