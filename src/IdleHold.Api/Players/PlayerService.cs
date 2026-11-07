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

    /// <param name="owner">Who is asking: <c>null</c> for a guest, or the signed-in account.</param>
    /// The game checks the caught-up state, so materials gathered while away count.
    public Task<CommandResult> StartActionAsync(Guid playerId, Guid? owner, string actionId, CancellationToken cancellationToken) =>
        ApplyAsync(
            playerId,
            owner,
            state => state.ActiveAction?.ActionId == actionId ? null : engine.CheckStart(state, actionId),
            state => engine.StartAction(state, actionId),
            cancellationToken);

    /// <param name="owner">Who is asking: <c>null</c> for a guest, or the signed-in account.</param>
    public Task<CommandResult> StopActionAsync(Guid playerId, Guid? owner, CancellationToken cancellationToken) =>
        ApplyAsync(playerId, owner, check: _ => null, engine.StopAction, cancellationToken);

    /// <summary>
    /// Applies a command only if <paramref name="owner"/> owns the player. The check runs inside the
    /// store's atomic update, so it is repeated on every concurrency retry: a hold claimed by an
    /// account between two attempts is refused, never changed by the guest request.
    /// <paramref name="check"/> runs on the caught-up state; when the game refuses the command, nothing is written.
    /// </summary>
    private async Task<CommandResult> ApplyAsync(
        Guid playerId,
        Guid? owner,
        Func<GameState, ActionBlock?> check,
        Func<GameState, GameState> command,
        CancellationToken cancellationToken)
    {
        var denied = false;
        ActionBlock? block = null;
        var updated = await store.UpdateAsync(playerId, save =>
        {
            denied = save.AccountId != owner;
            if (denied)
            {
                return save; // Unchanged: the store skips the write.
            }

            var caughtUp = CatchUp(save, time.GetUtcNow());
            block = check(caughtUp.State);
            return block is null ? caughtUp with { State = command(caughtUp.State) } : save;
        }, cancellationToken);

        return updated is null ? CommandResult.NotFound
            : denied ? CommandResult.Forbidden
            : block is { } blocked ? CommandResult.Blocked(blocked)
            : CommandResult.Done(updated);
    }

    /// <summary>The save as it stands at <paramref name="now"/>, with the elapsed time simulated.</summary>
    private PlayerSave CatchUp(PlayerSave save, DateTimeOffset now)
    {
        // If the clock ever moves backwards (server clock adjustments), simulate nothing instead of crashing.
        var elapsed = now > save.LastUpdated ? now - save.LastUpdated : TimeSpan.Zero;
        return save with { State = engine.Tick(save.State, elapsed), LastUpdated = now };
    }
}

public enum CommandStatus
{
    Done,
    NotFound,
    Forbidden,

    /// <summary>The game refused the command (see <see cref="CommandResult.Block"/>); nothing was saved.</summary>
    Blocked,
}

public sealed record CommandResult(CommandStatus Status, PlayerSave? Player, ActionBlock? Block = null)
{
    public static CommandResult Blocked(ActionBlock block) => new(CommandStatus.Blocked, null, block);

    public static CommandResult NotFound { get; } = new(CommandStatus.NotFound, null);

    public static CommandResult Forbidden { get; } = new(CommandStatus.Forbidden, null);

    public static CommandResult Done(PlayerSave player) => new(CommandStatus.Done, player);
}

public enum ClaimResult
{
    Claimed,
    NotFound,
    AlreadyOwned,
    AccountAlreadyHasPlayer,
}
