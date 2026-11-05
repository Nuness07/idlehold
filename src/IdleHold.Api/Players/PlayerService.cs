using IdleHold.Engine;
using IdleHold.Engine.State;

namespace IdleHold.Api.Players;

/// <summary>
/// The glue between HTTP and the engine. Every operation first catches the player up to "now"
/// (lazy evaluation: nothing runs while nobody asks), then applies the command, then saves.
/// </summary>
public sealed class PlayerService(IPlayerStore store, GameEngine engine, TimeProvider time)
{
    public async Task<PlayerSave> CreateAsync(CancellationToken cancellationToken)
    {
        var player = new PlayerSave(Guid.NewGuid(), GameState.New, time.GetUtcNow());
        await store.AddAsync(player, cancellationToken);
        return player;
    }

    public Task<PlayerSave?> GetAsync(Guid playerId, CancellationToken cancellationToken) =>
        ApplyAsync(playerId, state => state, cancellationToken);

    public Task<PlayerSave?> StartActionAsync(Guid playerId, string actionId, CancellationToken cancellationToken) =>
        ApplyAsync(playerId, state => engine.StartAction(state, actionId), cancellationToken);

    public Task<PlayerSave?> StopActionAsync(Guid playerId, CancellationToken cancellationToken) =>
        ApplyAsync(playerId, engine.StopAction, cancellationToken);

    private Task<PlayerSave?> ApplyAsync(Guid playerId, Func<GameState, GameState> command, CancellationToken cancellationToken) =>
        store.UpdateAsync(playerId, save =>
        {
            var now = time.GetUtcNow();

            // If the clock ever moves backwards (server clock adjustments), simulate nothing instead of crashing.
            var elapsed = now > save.LastUpdated ? now - save.LastUpdated : TimeSpan.Zero;

            var caughtUp = engine.Tick(save.State, elapsed);
            return save with { State = command(caughtUp), LastUpdated = now };
        }, cancellationToken);
}
