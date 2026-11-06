using IdleHold.Api.Persistence;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;

namespace IdleHold.Api.Tests;

/// <summary>
/// Starts one throwaway Postgres container (through Docker) for a test class and applies the
/// real migrations to it, so the tests run against the same schema as the game.
/// </summary>
public sealed class PostgresFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder("postgres:17-alpine").Build();

    public string ConnectionString => _container.GetConnectionString();

    public async Task InitializeAsync()
    {
        await _container.StartAsync();
        await using var db = CreateContext();
        await db.Database.MigrateAsync();
    }

    public Task DisposeAsync() => _container.DisposeAsync().AsTask();

    public GameDbContext CreateContext() => new(Options());

    public IDbContextFactory<GameDbContext> CreateFactory() => new Factory(Options());

    private DbContextOptions<GameDbContext> Options() =>
        new DbContextOptionsBuilder<GameDbContext>().UseNpgsql(ConnectionString).Options;

    private sealed class Factory(DbContextOptions<GameDbContext> options) : IDbContextFactory<GameDbContext>
    {
        public GameDbContext CreateDbContext() => new(options);
    }
}
