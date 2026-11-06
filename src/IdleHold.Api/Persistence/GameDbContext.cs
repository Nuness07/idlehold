using IdleHold.Api.Accounts;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace IdleHold.Api.Persistence;

/// <summary>
/// The game's database. It inherits Identity's tables (<c>AspNetUsers</c> and friends, keyed by
/// <see cref="Guid"/>) and adds the game's own. EF Core migrations under <c>Persistence/Migrations</c>
/// build the schema.
/// </summary>
public sealed class GameDbContext(DbContextOptions<GameDbContext> options)
    : IdentityDbContext<Account, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<PlayerRecord> Players => Set<PlayerRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Identity configures its own tables first.
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<PlayerRecord>(player =>
        {
            player.ToTable("players");
            player.HasKey(p => p.Id);
            player.Property(p => p.Id).HasColumnName("id");
            player.Property(p => p.State).HasColumnName("state").HasColumnType("jsonb").IsRequired();
            player.Property(p => p.LastUpdated).HasColumnName("last_updated");
            player.Property(p => p.Version).IsRowVersion();

            player.Property(p => p.AccountId).HasColumnName("account_id");
            player.HasIndex(p => p.AccountId).IsUnique();
            player.HasOne<Account>()
                .WithMany()
                .HasForeignKey(p => p.AccountId)
                .OnDelete(DeleteBehavior.Cascade); // Deleting an account deletes its hold.
        });
    }
}

/// <summary>
/// Lets the <c>dotnet ef</c> tool build the context without starting the web app. Only used at
/// design time (creating migrations); the running app configures the context in Program.cs.
/// </summary>
public sealed class GameDbContextDesignTimeFactory : IDesignTimeDbContextFactory<GameDbContext>
{
    public GameDbContext CreateDbContext(string[] args) => new(
        new DbContextOptionsBuilder<GameDbContext>()
            .UseNpgsql("Host=localhost;Port=5433;Database=idlehold;Username=idlehold;Password=idlehold")
            .Options);
}
