namespace IdleHold.Api.Players;

/// <summary>
/// Temporary store that keeps everything in memory. Data is lost when the server restarts.
/// A single lock keeps it simple and correct; a database will replace it later.
/// </summary>
public sealed class InMemoryPlayerStore : IPlayerStore
{
    private readonly Dictionary<Guid, PlayerSave> _players = [];
    private readonly Lock _lock = new();

    public Task AddAsync(PlayerSave player, CancellationToken cancellationToken)
    {
        lock (_lock)
        {
            if (!_players.TryAdd(player.Id, player))
            {
                throw new InvalidOperationException($"Player '{player.Id}' already exists.");
            }
        }

        return Task.CompletedTask;
    }

    public Task<PlayerSave?> GetAsync(Guid playerId, CancellationToken cancellationToken)
    {
        lock (_lock)
        {
            return Task.FromResult(_players.GetValueOrDefault(playerId));
        }
    }

    public Task<PlayerSave?> UpdateAsync(Guid playerId, Func<PlayerSave, PlayerSave> update, CancellationToken cancellationToken)
    {
        lock (_lock)
        {
            if (!_players.TryGetValue(playerId, out var current))
            {
                return Task.FromResult<PlayerSave?>(null);
            }

            var updated = update(current);
            _players[playerId] = updated;
            return Task.FromResult<PlayerSave?>(updated);
        }
    }
}
