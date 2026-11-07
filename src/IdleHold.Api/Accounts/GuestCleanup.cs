using IdleHold.Api.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace IdleHold.Api.Accounts;

public sealed class GuestCleanupOptions
{
    /// <summary>Turns the background job off (the tests do, so it never races their data).</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>How often the job runs. It also runs once when the server starts.</summary>
    public TimeSpan Interval { get; set; } = TimeSpan.FromDays(1);

    /// <summary>How long a guest's hold must have sat untouched before it counts as abandoned.</summary>
    public TimeSpan MinimumAge { get; set; } = TimeSpan.FromDays(10);
}

/// <summary>
/// Deletes guests that never made any progress: an anonymous account whose hold is still the empty
/// starting state (no items, no XP, nothing working) and was last saved before the cutoff. These are
/// visits that never played, plus crawlers and bots that started a session.
///
/// A guest with any progress is kept, even if old: reads never write, so an old save may belong to
/// someone who left an action running and still checks in. Old guests that never became accounts
/// will need a separate rule once there is a record of their last visit.
/// </summary>
public sealed class GuestCleanup(IDbContextFactory<GameDbContext> contexts, TimeProvider time, IOptions<GuestCleanupOptions> options)
{
    /// <returns>How many guests were deleted (their holds go with them, by cascade).</returns>
    public async Task<int> DeleteAbandonedAsync(CancellationToken cancellationToken)
    {
        var cutoff = time.GetUtcNow() - options.Value.MinimumAge;
        await using var db = await contexts.CreateDbContextAsync(cancellationToken);

        // The empty state is checked in the jsonb document itself, so the database does all the work
        // in one statement and no save is loaded into memory.
        return await db.Database.ExecuteSqlInterpolatedAsync($$"""
            DELETE FROM "AspNetUsers" AS account
            USING players AS player
            WHERE player.account_id = account."Id"
              AND account."IsAnonymous"
              AND player.last_updated < {{cutoff}}
              AND player.state -> 'inventory' = '{}'::jsonb
              AND player.state -> 'skillXp' = '{}'::jsonb
              AND jsonb_typeof(player.state -> 'activeAction') IS DISTINCT FROM 'object'
            """, cancellationToken);
    }
}

/// <summary>Runs <see cref="GuestCleanup"/> on start and then on every interval, on the injected clock.</summary>
public sealed class GuestCleanupService(
    GuestCleanup cleanup, TimeProvider time, IOptions<GuestCleanupOptions> options, ILogger<GuestCleanupService> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(options.Value.Interval, time);
        do
        {
            try
            {
                var deleted = await cleanup.DeleteAbandonedAsync(stoppingToken);
                logger.LogInformation("Guest cleanup deleted {Count} guests without progress.", deleted);
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                // A failed run (database briefly down) must not stop the job; the next tick tries again.
                logger.LogError(exception, "Guest cleanup failed.");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
