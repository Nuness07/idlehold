namespace IdleHold.Api.Players;

/// <summary>
/// Where player saves live. The rest of the API only knows this contract,
/// so swapping memory for a real database later does not touch the endpoints.
/// </summary>
public interface IPlayerStore
{
    Task AddAsync(PlayerSave player, CancellationToken cancellationToken);

    /// <summary>Reads a player's save without changing it. Returns <c>null</c> when the player does not exist.</summary>
    Task<PlayerSave?> GetAsync(Guid playerId, CancellationToken cancellationToken);

    /// <summary>The player owned by an account, or <c>null</c> if the account has none yet.</summary>
    Task<PlayerSave?> FindByAccountAsync(Guid accountId, CancellationToken cancellationToken);

    /// <summary>
    /// Loads a player, applies <paramref name="update"/> and saves the result as one atomic step,
    /// so two requests for the same player can never overwrite each other. <paramref name="update"/>
    /// may run more than once (on a concurrency retry) and may return its input unchanged to save
    /// nothing. Returns <c>null</c> when the player does not exist.
    /// </summary>
    Task<PlayerSave?> UpdateAsync(Guid playerId, Func<PlayerSave, PlayerSave> update, CancellationToken cancellationToken);
}
