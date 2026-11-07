using IdleHold.Api.Players;
using Microsoft.EntityFrameworkCore;

namespace IdleHold.Api.Persistence;

/// <summary>
/// Player saves in Postgres. A short-lived DbContext is created per operation from the factory,
/// so this store can be a singleton like the rest of the game services.
///
/// Concurrency is optimistic: two requests may read the same row, but only the first write wins;
/// the second sees that the row's version changed, reloads the newer state and applies its own
/// change again. Nothing is lost and no database lock is held while game rules run.
/// </summary>
public sealed class PostgresPlayerStore(IDbContextFactory<GameDbContext> contexts) : IPlayerStore
{
    // One player rarely has more than a couple of requests in flight (one browser, maybe a phone),
    // so a handful of retries covers real contention with room to spare.
    private const int MaxAttempts = 8;

    public async Task AddAsync(PlayerSave player, CancellationToken cancellationToken)
    {
        await using var db = await contexts.CreateDbContextAsync(cancellationToken);
        db.Players.Add(new PlayerRecord
        {
            Id = player.Id,
            State = StateDocument.From(player.State).Serialize(),
            LastUpdated = player.LastUpdated,
            AccountId = player.AccountId,
        });
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<PlayerSave?> FindByAccountAsync(Guid accountId, CancellationToken cancellationToken)
    {
        await using var db = await contexts.CreateDbContextAsync(cancellationToken);
        var record = await db.Players.AsNoTracking().SingleOrDefaultAsync(p => p.AccountId == accountId, cancellationToken);
        return record is null ? null : ToSave(record);
    }

    public async Task<PlayerSave?> GetAsync(Guid playerId, CancellationToken cancellationToken)
    {
        await using var db = await contexts.CreateDbContextAsync(cancellationToken);

        // AsNoTracking: we only read, so EF Core does not keep a copy to detect changes.
        var record = await db.Players.AsNoTracking().SingleOrDefaultAsync(p => p.Id == playerId, cancellationToken);
        return record is null ? null : ToSave(record);
    }

    public async Task<PlayerSave?> UpdateAsync(
        Guid playerId,
        Func<PlayerSave, PlayerSave> update,
        CancellationToken cancellationToken)
    {
        for (var attempt = 1; ; attempt++)
        {
            await using var db = await contexts.CreateDbContextAsync(cancellationToken);
            var record = await db.Players.SingleOrDefaultAsync(p => p.Id == playerId, cancellationToken);
            if (record is null)
            {
                return null;
            }

            var current = ToSave(record);
            var updated = update(current);
            if (ReferenceEquals(updated, current))
            {
                return current; // Nothing to save.
            }

            record.State = StateDocument.From(updated.State).Serialize();
            record.LastUpdated = updated.LastUpdated;

            try
            {
                await db.SaveChangesAsync(cancellationToken);
                return updated;
            }
            catch (DbUpdateConcurrencyException) when (attempt < MaxAttempts)
            {
                // Someone saved this player after we read it. Read the newer state and try again.
            }
        }
    }

    private static PlayerSave ToSave(PlayerRecord record) =>
        new(record.Id, StateDocument.Deserialize(record.State).ToState(), record.LastUpdated, record.AccountId);
}
