using IdleHold.Api.Players;
using IdleHold.Engine;
using IdleHold.Engine.Content;
using Microsoft.Extensions.Time.Testing;

namespace IdleHold.Api.Tests;

/// <summary>
/// The ownership rule for commands, tested at the service level, where a concurrency retry can be
/// staged step by step.
/// </summary>
public sealed class PlayerServiceTests
{
    private readonly FakeTimeProvider _clock = new(new DateTimeOffset(2100, 1, 1, 12, 0, 0, TimeSpan.Zero));

    private PlayerService Service(IPlayerStore store) => new(store, new GameEngine(DefaultContent.Create()), _clock);

    [Fact]
    public async Task GuestCommand_OnAHoldClaimedDuringARetry_IsRefusedAndChangesNothing()
    {
        var store = new InMemoryPlayerStore();
        var guest = await Service(store).CreateAsync(CancellationToken.None);
        var accountId = Guid.NewGuid();
        var racing = new ClaimBeforeRetryStore(store, accountId);

        var result = await Service(racing).StartActionAsync(guest.Id, owner: null, "cut-pine", CancellationToken.None);
        var saved = await store.GetAsync(guest.Id, CancellationToken.None);

        Assert.Equal(CommandStatus.Forbidden, result.Status);
        Assert.Equal(accountId, saved!.AccountId);
        Assert.Null(saved.State.ActiveAction);
    }

    [Fact]
    public async Task AccountCommand_OnAGuestHold_IsRefused()
    {
        var store = new InMemoryPlayerStore();
        var guest = await Service(store).CreateAsync(CancellationToken.None);

        var result = await Service(store).StartActionAsync(guest.Id, owner: Guid.NewGuid(), "cut-pine", CancellationToken.None);

        Assert.Equal(CommandStatus.Forbidden, result.Status);
    }

    [Fact]
    public async Task OwnerCommand_IsApplied()
    {
        var store = new InMemoryPlayerStore();
        var guest = await Service(store).CreateAsync(CancellationToken.None);

        var result = await Service(store).StartActionAsync(guest.Id, owner: null, "cut-pine", CancellationToken.None);

        Assert.Equal(CommandStatus.Done, result.Status);
        Assert.Equal("cut-pine", result.Player!.State.ActiveAction!.ActionId);
    }

    /// <summary>
    /// Plays out the race: the first attempt sees the hold as a guest's, then an account claims it
    /// before the write, so the store retries the update on the newer, owned save.
    /// </summary>
    private sealed class ClaimBeforeRetryStore(IPlayerStore inner, Guid accountId) : IPlayerStore
    {
        public Task AddAsync(PlayerSave player, CancellationToken cancellationToken) => inner.AddAsync(player, cancellationToken);

        public Task<PlayerSave?> GetAsync(Guid playerId, CancellationToken cancellationToken) => inner.GetAsync(playerId, cancellationToken);

        public Task<PlayerSave?> FindByAccountAsync(Guid accountId, CancellationToken cancellationToken) =>
            inner.FindByAccountAsync(accountId, cancellationToken);

        public async Task<PlayerSave?> UpdateAsync(Guid playerId, Func<PlayerSave, PlayerSave> update, CancellationToken cancellationToken)
        {
            var firstRead = await inner.GetAsync(playerId, cancellationToken);
            update(firstRead!); // First attempt; its write loses to the claim below.
            await inner.UpdateAsync(playerId, save => save with { AccountId = accountId }, cancellationToken);
            return await inner.UpdateAsync(playerId, update, cancellationToken); // The retry.
        }
    }
}
