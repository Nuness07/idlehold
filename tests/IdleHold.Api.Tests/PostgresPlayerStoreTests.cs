using System.Collections.Immutable;
using System.Net.Http.Json;
using IdleHold.Api.Persistence;
using IdleHold.Api.Players;
using IdleHold.Engine.State;

namespace IdleHold.Api.Tests;

/// <summary>Runs against a real Postgres in Docker. Docker must be running.</summary>
public sealed class PostgresPlayerStoreTests(PostgresFixture database) : IClassFixture<PostgresFixture>
{
    private static readonly DateTimeOffset Noon = new(2026, 1, 1, 12, 0, 0, TimeSpan.Zero);

    private static PlayerSave NewPlayer() => new(Guid.NewGuid(), GameState.New, Noon);

    [Fact]
    public async Task Add_ThenUpdate_RoundTripsTheWholeState()
    {
        var store = new PostgresPlayerStore(database.CreateFactory());
        var player = NewPlayer();
        await store.AddAsync(player, CancellationToken.None);

        var state = GameState.New with
        {
            Inventory = ImmutableDictionary<string, long>.Empty.Add("pine-log", 9_600),
            SkillXp = ImmutableDictionary<string, long>.Empty.Add("woodcutting", 96_000),
            ActiveAction = new ActiveAction("cut-pine", TimeSpan.FromTicks(12_345_678)),
        };
        await store.UpdateAsync(player.Id, save => save with { State = state, LastUpdated = Noon.AddHours(8) }, CancellationToken.None);

        // A brand-new store reads it back from the database, as after a server restart.
        var reloaded = await new PostgresPlayerStore(database.CreateFactory())
            .UpdateAsync(player.Id, save => save, CancellationToken.None);

        Assert.NotNull(reloaded);
        Assert.Equal(9_600, reloaded.State.ItemCount("pine-log"));
        Assert.Equal(96_000, reloaded.State.XpOf("woodcutting"));
        Assert.Equal(new ActiveAction("cut-pine", TimeSpan.FromTicks(12_345_678)), reloaded.State.ActiveAction);
        Assert.Equal(Noon.AddHours(8), reloaded.LastUpdated);
    }

    [Fact]
    public async Task Get_ReadsWithoutChangingTheRow()
    {
        var store = new PostgresPlayerStore(database.CreateFactory());
        var player = NewPlayer();
        await store.AddAsync(player, CancellationToken.None);
        uint VersionOf() { using var db = database.CreateContext(); return db.Players.Single(p => p.Id == player.Id).Version; }
        var versionBefore = VersionOf();

        var read = await store.GetAsync(player.Id, CancellationToken.None);
        await store.GetAsync(player.Id, CancellationToken.None);

        Assert.Equal(player.Id, read!.Id);
        Assert.Equal(Noon, read.LastUpdated);
        Assert.Equal(versionBefore, VersionOf());
        Assert.Null(await store.GetAsync(Guid.NewGuid(), CancellationToken.None));
    }

    [Fact]
    public async Task Update_UnknownPlayer_ReturnsNull()
    {
        var store = new PostgresPlayerStore(database.CreateFactory());

        var result = await store.UpdateAsync(Guid.NewGuid(), save => save, CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task ConcurrentUpdates_AreAllApplied()
    {
        var store = new PostgresPlayerStore(database.CreateFactory());
        var player = NewPlayer();
        await store.AddAsync(player, CancellationToken.None);

        // Several requests change the same player at once; optimistic concurrency retries the losers.
        await Task.WhenAll(Enumerable.Range(0, 6).Select(_ => store.UpdateAsync(
            player.Id,
            save => save with
            {
                State = save.State with { Inventory = save.State.Inventory.SetItem("stone", save.State.ItemCount("stone") + 1) },
            },
            CancellationToken.None)));

        var result = await store.UpdateAsync(player.Id, save => save, CancellationToken.None);
        Assert.Equal(6, result!.State.ItemCount("stone"));
    }

    [Fact]
    public async Task Progress_SurvivesAnApiRestart()
    {
        Guid playerId;
        await using (var firstRun = new ApiFactory(database.ConnectionString))
        {
            using var client = firstRun.CreateClient();
            var created = await (await client.PostAsync("/players", content: null)).Content.ReadFromJsonAsync<PlayerResponse>();
            playerId = created!.Id;
            await client.PostAsJsonAsync($"/players/{playerId}/action", new StartActionRequest("cut-pine"));
            firstRun.Clock.Advance(TimeSpan.FromSeconds(9));
            var beforeRestart = await client.GetFromJsonAsync<PlayerResponse>($"/players/{playerId}");
            Assert.Equal(3, beforeRestart!.Inventory["pine-log"]);
        }

        // The second server starts its own clock at the same noon. Move it 9 s past the moment the
        // first server last saved (12:00:09), so the test proves time kept counting across the restart.
        await using var secondRun = new ApiFactory(database.ConnectionString);
        using var secondClient = secondRun.CreateClient();
        secondRun.Clock.Advance(TimeSpan.FromSeconds(18));
        var response = await secondClient.GetAsync($"/players/{playerId}");

        response.EnsureSuccessStatusCode();
        var player = await response.Content.ReadFromJsonAsync<PlayerResponse>();
        Assert.Equal(6, player!.Inventory["pine-log"]);
    }
}
