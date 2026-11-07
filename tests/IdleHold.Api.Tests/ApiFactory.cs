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
/// It runs in a "Testing" environment, so the local development database is never touched: every
/// test class gets a throwaway Postgres from <see cref="PostgresFixture"/>.
/// </summary>
public sealed class ApiFactory(string gameDatabase) : WebApplicationFactory<Program>
{
    /// <summary>
    /// Every factory's clock starts at the same fixed instant, so runs never depend on the wall clock.
    /// It sits far in the future because ASP.NET also uses this clock for cookie expiry, and the test
    /// client drops a cookie whose expiry is in the real past.
    /// </summary>
    private static readonly DateTimeOffset Start = new(2100, 1, 1, 12, 0, 0, TimeSpan.Zero);

    public FakeTimeProvider Clock { get; } = new(Start);

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:Game", gameDatabase);
        builder.ConfigureTestServices(services => services.AddSingleton<TimeProvider>(Clock));
    }

    /// <summary>A client that starts a guest session first, like a browser on its first visit.</summary>
    public async Task<HttpClient> CreateGuestClientAsync()
    {
        var client = CreateClient();
        (await client.PostAsync("/account/guest", content: null)).EnsureSuccessStatusCode();
        return client;
    }
}
