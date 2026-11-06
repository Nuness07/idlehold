using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Time.Testing;

namespace IdleHold.Api.Tests;

/// <summary>
/// Boots the real API in memory (no network port) and swaps the system clock for a fake one,
/// so tests can say "eight hours pass" instantly.
///
/// It runs in a "Testing" environment, so the local development database is never touched.
/// Saves stay in memory unless a test passes a connection string (see <see cref="PostgresFixture"/>).
/// </summary>
public sealed class ApiFactory(string? gameDatabase = null) : WebApplicationFactory<Program>
{
    public FakeTimeProvider Clock { get; } = new(new DateTimeOffset(2026, 1, 1, 12, 0, 0, TimeSpan.Zero));

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:Game", gameDatabase ?? "");
        builder.ConfigureTestServices(services => services.AddSingleton<TimeProvider>(Clock));
    }
}
