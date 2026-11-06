using System.Net;
using System.Net.Http.Json;
using IdleHold.Api.Players;
using Microsoft.Extensions.DependencyInjection;

namespace IdleHold.Api.Tests;

// xUnit creates a new instance of this class for every test, so each test gets a fresh API and clock.
public sealed class PlayerEndpointsTests : IDisposable
{
    private readonly ApiFactory _factory = new();
    private readonly HttpClient _client;

    public PlayerEndpointsTests() => _client = _factory.CreateClient();

    public void Dispose()
    {
        _client.Dispose();
        _factory.Dispose();
    }

    [Fact]
    public async Task CreatePlayer_Returns201WithEmptyState()
    {
        var response = await _client.PostAsync("/players", content: null);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var player = await response.Content.ReadFromJsonAsync<PlayerResponse>();
        Assert.NotNull(player);
        Assert.Equal($"/players/{player.Id}", response.Headers.Location?.ToString());
        Assert.Empty(player.Inventory);
        Assert.Null(player.ActiveAction);
    }

    [Fact]
    public async Task GetPlayer_UnknownId_Returns404()
    {
        var response = await _client.GetAsync($"/players/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task StartAction_ThenTimePasses_GrantsRewards()
    {
        var player = await CreatePlayerAsync();
        await StartActionAsync(player.Id, "cut-pine");

        _factory.Clock.Advance(TimeSpan.FromSeconds(10));
        var state = await GetPlayerAsync(player.Id);

        // cut-pine takes 3s: 10s = 3 completions with 1s left on the bar.
        Assert.Equal(3, state.Inventory["pine-log"]);
        Assert.Equal(new SkillResponse(Xp: 30, Level: 1, LevelStartXp: 0, NextLevelXp: 100), state.Skills["woodcutting"]);
        Assert.Equal(new ActiveActionResponse("cut-pine", ProgressMs: 1000, DurationMs: 3000), state.ActiveAction);
    }

    [Fact]
    public async Task OfflineProgress_IsCalculatedWhenThePlayerComesBack()
    {
        var player = await CreatePlayerAsync();
        await StartActionAsync(player.Id, "cut-pine");

        _factory.Clock.Advance(TimeSpan.FromHours(8));
        var state = await GetPlayerAsync(player.Id);

        Assert.Equal(9600, state.Inventory["pine-log"]);
        var woodcutting = state.Skills["woodcutting"];
        Assert.True(woodcutting.Level > 1);
        Assert.InRange(woodcutting.Xp, woodcutting.LevelStartXp, woodcutting.NextLevelXp!.Value - 1);
    }

    [Fact]
    public async Task Reading_ComputesNowWithoutWritingTheSave()
    {
        var player = await CreatePlayerAsync();
        await StartActionAsync(player.Id, "cut-pine");
        var store = _factory.Services.GetRequiredService<IPlayerStore>();
        var savedAfterStart = await store.GetAsync(player.Id, CancellationToken.None);

        _factory.Clock.Advance(TimeSpan.FromSeconds(9));
        var first = await GetPlayerAsync(player.Id);
        _factory.Clock.Advance(TimeSpan.FromSeconds(3));
        var second = await GetPlayerAsync(player.Id);

        // Each read is caught up to its own "now"...
        Assert.Equal(3, first.Inventory["pine-log"]);
        Assert.Equal(4, second.Inventory["pine-log"]);
        // ...while the stored save is still the one written by the command.
        Assert.Equal(savedAfterStart, await store.GetAsync(player.Id, CancellationToken.None));
    }

    [Fact]
    public async Task Command_SavesTheCaughtUpState()
    {
        var player = await CreatePlayerAsync();
        await StartActionAsync(player.Id, "cut-pine");
        _factory.Clock.Advance(TimeSpan.FromSeconds(10));

        await _client.DeleteAsync($"/players/{player.Id}/action");

        var saved = await _factory.Services.GetRequiredService<IPlayerStore>().GetAsync(player.Id, CancellationToken.None);
        Assert.Equal(3, saved!.State.ItemCount("pine-log"));
        Assert.Null(saved.State.ActiveAction);
        Assert.Equal(_factory.Clock.GetUtcNow(), saved.LastUpdated);
    }

    [Fact]
    public async Task StopAction_FreezesProgress()
    {
        var player = await CreatePlayerAsync();
        await StartActionAsync(player.Id, "cut-pine");
        _factory.Clock.Advance(TimeSpan.FromSeconds(6));

        var stop = await _client.DeleteAsync($"/players/{player.Id}/action");
        _factory.Clock.Advance(TimeSpan.FromHours(1));
        var state = await GetPlayerAsync(player.Id);

        Assert.Equal(HttpStatusCode.OK, stop.StatusCode);
        Assert.Null(state.ActiveAction);
        Assert.Equal(2, state.Inventory["pine-log"]);
    }

    [Theory]
    [InlineData("fly")]
    [InlineData("")]
    public async Task StartAction_InvalidAction_Returns400(string actionId)
    {
        var player = await CreatePlayerAsync();

        var response = await _client.PostAsJsonAsync($"/players/{player.Id}/action", new StartActionRequest(actionId));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task StartAction_UnknownPlayer_Returns404()
    {
        var response = await _client.PostAsJsonAsync($"/players/{Guid.NewGuid()}/action", new StartActionRequest("cut-pine"));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private async Task<PlayerResponse> CreatePlayerAsync()
    {
        var response = await _client.PostAsync("/players", content: null);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<PlayerResponse>())!;
    }

    private async Task StartActionAsync(Guid playerId, string actionId)
    {
        var response = await _client.PostAsJsonAsync($"/players/{playerId}/action", new StartActionRequest(actionId));
        response.EnsureSuccessStatusCode();
    }

    private async Task<PlayerResponse> GetPlayerAsync(Guid playerId) =>
        (await _client.GetFromJsonAsync<PlayerResponse>($"/players/{playerId}"))!;
}
