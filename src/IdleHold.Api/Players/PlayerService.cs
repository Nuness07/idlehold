using IdleHold.Engine;
using IdleHold.Engine.State;

namespace IdleHold.Api.Players;

/// <summary>
/// The glue between HTTP and the engine. Every operation first catches the player up to "now"
/// (lazy evaluation: nothing runs while nobody asks).
///
/// Reads never write. The state at any moment follows from the saved state, its timestamp and
/// the clock, and <see cref="GameEngine.Tick"/> is deterministic and constant-time, so catching up
/// from an old save gives the same result as catching up step by step. Only commands (start or
/// stop an action) save, and they save the caught-up state with the command applied.
/// </summary>
public sealed class PlayerService(IPlayerStore store, GameEngine engine, TimeProvider time)
{
    public async Task<PlayerSave> CreateAsync(CancellationToken cancellationToken)
    {
        var player = new PlayerSave(Guid.NewGuid(), GameState.New, time.GetUtcNow());
        await store.AddAsync(player, cancellationToken);
        return player;
    }

    public async Task<PlayerSave?> GetAsync(Guid playerId, CancellationToken cancellationToken)
    {
        var save = await store.GetAsync(playerId, cancellationToken);
        return save is null ? null : CatchUp(save, time.GetUtcNow());
    }

    /// <summary>The account's player caught up to now, created on first use for an account that has none.</summary>
    public async Task<PlayerSave> GetOrCreateForAccountAsync(Guid accountId, CancellationToken cancellationToken)
    {
        var now = time.GetUtcNow();
        var save = await store.FindByAccountAsync(accountId, cancellationToken);
        if (save is not null)
        {
            return CatchUp(save, now);
        }

        var created = new PlayerSave(Guid.NewGuid(), GameState.New, now, accountId);
        try
        {
            await store.AddAsync(created, cancellationToken);
            return created;
        }
        catch (Exception)
        {
            // Two first requests for the same account raced; the unique account_id kept one player.
            // If there is no such player, the failure was something else: let it surface.
            var raced = await store.FindByAccountAsync(accountId, cancellationToken);
            if (raced is null)
            {
                throw;
            }

            return CatchUp(raced, now);
        }
    }

    /// <summary>Whether a guest player exists and nobody owns it yet.</summary>
    public async Task<bool> IsClaimableAsync(Guid playerId, CancellationToken cancellationToken) =>
        await store.GetAsync(playerId, cancellationToken) is { IsGuest: true };

    /// <summary>
    /// Moves a guest player to an account, keeping all of its progress. Only the owner changes:
    /// the state and its timestamp stay as saved, so no time is simulated here.
    /// </summary>
    public async Task<ClaimResult> ClaimAsync(Guid playerId, Guid accountId, CancellationToken cancellationToken)
    {
        if (await store.FindByAccountAsync(accountId, cancellationToken) is not null)
        {
            return ClaimResult.AccountAlreadyHasPlayer;
        }

        var alreadyOwned = false;
        var updated = await store.UpdateAsync(playerId, save =>
        {
            alreadyOwned = !save.IsGuest;
            return alreadyOwned ? save : save with { AccountId = accountId };
        }, cancellationToken);

        return updated is null ? ClaimResult.NotFound
            : alreadyOwned ? ClaimResult.AlreadyOwned
            : ClaimResult.Claimed;
    }

    public Task<PlayerSave?> StartActionAsync(Guid playerId, string actionId, CancellationToken cancellationToken) =>
        ApplyAsync(playerId, state => engine.StartAction(state, actionId), cancellationToken);

    public Task<PlayerSave?> StopActionAsync(Guid playerId, CancellationToken cancellationToken) =>
        ApplyAsync(playerId, engine.StopAction, cancellationToken);

    private Task<PlayerSave?> ApplyAsync(Guid playerId, Func<GameState, GameState> command, CancellationToken cancellationToken) =>
        store.UpdateAsync(playerId, save =>
        {
            var caughtUp = CatchUp(save, time.GetUtcNow());
            return caughtUp with { State = command(caughtUp.State) };
        }, cancellationToken);

    /// <summary>The save as it stands at <paramref name="now"/>, with the elapsed time simulated.</summary>
    private PlayerSave CatchUp(PlayerSave save, DateTimeOffset now)
    {
        // If the clock ever moves backwards (server clock adjustments), simulate nothing instead of crashing.
        var elapsed = now > save.LastUpdated ? now - save.LastUpdated : TimeSpan.Zero;
        return save with { State = engine.Tick(save.State, elapsed), LastUpdated = now };
    }
}

public enum ClaimResult
{
    Claimed,
    NotFound,
    AlreadyOwned,
    AccountAlreadyHasPlayer,
}
