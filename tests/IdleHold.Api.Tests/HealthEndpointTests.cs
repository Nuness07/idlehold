using System.Net;

namespace IdleHold.Api.Tests;

public sealed class HealthEndpointTests(PostgresFixture database) : IClassFixture<PostgresFixture>, IDisposable
{
    private readonly ApiFactory _factory = new(database.ConnectionString);

    public void Dispose() => _factory.Dispose();

    [Fact]
    public async Task Health_ReturnsHealthy()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Healthy", await response.Content.ReadAsStringAsync());
    }
}
