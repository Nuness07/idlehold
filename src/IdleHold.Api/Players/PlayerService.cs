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

    /// <summary>Starts an action on the account's hold. The game checks the caught-up state, so materials gathered while away count.</summary>
    public Task<CommandResult> StartActionAsync(Guid accountId, string actionId, CancellationToken cancellationToken) =>
        ApplyAsync(
            accountId,
            state => state.ActiveAction?.ActionId == actionId ? null : engine.CheckStart(state, actionId),
            state => engine.StartAction(state, actionId),
            cancellationToken);

    public Task<CommandResult> StopActionAsync(Guid accountId, CancellationToken cancellationToken) =>
        ApplyAsync(accountId, check: _ => null, engine.StopAction, cancellationToken);

    /// <summary>
    /// Rewrites the account's caught-up state with no game rule in the way. Only the development tools
    /// (<c>Dev/</c>) call this; game commands go through the engine.
    /// </summary>
    public Task<CommandResult> EditAsync(Guid accountId, Func<GameState, GameState> edit, CancellationToken cancellationToken) =>
        ApplyAsync(accountId, check: _ => null, edit, cancellationToken);

    /// <summary>
    /// Applies a command to the account's hold as one atomic store update (repeated on a concurrency retry).
    /// <paramref name="check"/> runs on the caught-up state; when the game refuses the command, nothing is written.
    /// </summary>
    private async Task<CommandResult> ApplyAsync(
        Guid accountId,
        Func<GameState, ActionBlock?> check,
        Func<GameState, GameState> command,
        CancellationToken cancellationToken)
    {
        var mine = await GetOrCreateForAccountAsync(accountId, cancellationToken);
        ActionBlock? block = null;
        var updated = await store.UpdateAsync(mine.Id, save =>
        {
            var caughtUp = CatchUp(save, time.GetUtcNow());
            block = check(caughtUp.State);
            return block is null ? caughtUp with { State = command(caughtUp.State) } : save;
        }, cancellationToken);

        return updated is null ? CommandResult.NotFound
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

    /// <summary>The game refused the command (see <see cref="CommandResult.Block"/>); nothing was saved.</summary>
    Blocked,
}

public sealed record CommandResult(CommandStatus Status, PlayerSave? Player, ActionBlock? Block = null)
{
    public static CommandResult Blocked(ActionBlock block) => new(CommandStatus.Blocked, null, block);

    public static CommandResult NotFound { get; } = new(CommandStatus.NotFound, null);

    public static CommandResult Done(PlayerSave player) => new(CommandStatus.Done, player);
}
