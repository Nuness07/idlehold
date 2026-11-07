using System.Collections.Immutable;
using System.Net;
using System.Net.Http.Json;
using IdleHold.Api.Accounts;
using IdleHold.Api.Persistence;
using IdleHold.Api.Players;
using IdleHold.Engine.State;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;

namespace IdleHold.Api.Tests;

/// <summary>Runs against a real Postgres in Docker, since the cleanup reads the jsonb save directly.</summary>
public sealed class GuestCleanupTests(PostgresFixture database) : IClassFixture<PostgresFixture>
{
    private static readonly DateTimeOffset Now = new(2100, 1, 1, 12, 0, 0, TimeSpan.Zero);
    private static readonly DateTimeOffset Old = Now - TimeSpan.FromDays(11);
    private static readonly DateTimeOffset Recent = Now - TimeSpan.FromDays(9);

    private readonly PostgresPlayerStore _store = new(database.CreateFactory());

    private GuestCleanup Cleanup() =>
        new(database.CreateFactory(), new FakeTimeProvider(Now), Options.Create(new GuestCleanupOptions()));

    private async Task<Guid> HoldAsync(GameState state, DateTimeOffset lastUpdated, bool guest = true)
    {
        var player = new PlayerSave(Guid.NewGuid(), state, lastUpdated, await database.CreateAccountAsync(guest));
        await _store.AddAsync(player, CancellationToken.None);
        return player.Id;
    }

    private async Task<bool> ExistsAsync(Guid playerId) => await _store.GetAsync(playerId, CancellationToken.None) is not null;

    [Fact]
    public async Task DeletesOldGuestsThatNeverMadeProgress()
    {
        var abandoned = await HoldAsync(GameState.New, Old);
        var owner = (await _store.GetAsync(abandoned, CancellationToken.None))!.AccountId;

        await Cleanup().DeleteAbandonedAsync(CancellationToken.None);

        Assert.False(await ExistsAsync(abandoned));
        using var db = database.CreateContext();
        Assert.False(db.Users.Any(account => account.Id == owner));
    }

    [Fact]
    public async Task KeepsEveryoneElse()
    {
        var recent = await HoldAsync(GameState.New, Recent);
        var withItems = await HoldAsync(
            GameState.New with { Inventory = ImmutableDictionary<string, long>.Empty.Add("pine-log", 1) }, Old);
        var withXp = await HoldAsync(
            GameState.New with { SkillXp = ImmutableDictionary<string, long>.Empty.Add("woodcutting", 10) }, Old);
        // Started an action and left: it has been gathering ever since, even though the save is empty.
        var working = await HoldAsync(GameState.New with { ActiveAction = new ActiveAction("cut-pine", TimeSpan.Zero) }, Old);
        var account = await HoldAsync(GameState.New, Old, guest: false);

        await Cleanup().DeleteAbandonedAsync(CancellationToken.None);

        Assert.True(await ExistsAsync(recent));
        Assert.True(await ExistsAsync(withItems));
        Assert.True(await ExistsAsync(withXp));
        Assert.True(await ExistsAsync(working));
        Assert.True(await ExistsAsync(account));
    }

    [Fact]
    public async Task ADeletedGuestComingBack_StartsANewGuestSession()
    {
        await using var factory = new ApiFactory(database.ConnectionString);
        using var client = await factory.CreateGuestClientAsync();
        var before = await client.GetFromJsonAsync<PlayerResponse>("/me/player");

        factory.Clock.Advance(TimeSpan.FromDays(11));
        await factory.Services.GetRequiredService<GuestCleanup>().DeleteAbandonedAsync(CancellationToken.None);
        var me = await client.GetAsync("/account/me");
        var restarted = await client.PostAsync("/account/guest", content: null);
        var after = await client.GetFromJsonAsync<PlayerResponse>("/me/player");

        Assert.Equal(HttpStatusCode.Unauthorized, me.StatusCode);
        Assert.Equal(HttpStatusCode.OK, restarted.StatusCode);
        Assert.NotEqual(before!.Id, after!.Id);
    }
}
