using System.Net;
using System.Net.Http.Json;
using IdleHold.Api.Accounts;
using IdleHold.Api.Players;

namespace IdleHold.Api.Tests;

/// <summary>
/// Accounts need the database, so these run against a real Postgres in Docker. The test client
/// keeps cookies between requests, like a browser, so signing in carries over.
/// </summary>
public sealed class AccountEndpointsTests(PostgresFixture database) : IClassFixture<PostgresFixture>, IDisposable
{
    private const string Password = "a long enough password";

    private readonly ApiFactory _factory = new(database.ConnectionString);

    public void Dispose() => _factory.Dispose();

    private static string NewEmail() => $"{Guid.NewGuid():N}@example.test";

    private static RegisterRequest Register(string email, Guid? guest = null) => new(email, Password, guest);

    [Fact]
    public async Task Register_SignsInAndGivesTheAccountAHold()
    {
        using var client = _factory.CreateClient();
        var email = NewEmail();

        var registered = await client.PostAsJsonAsync("/account/register", Register(email));
        var me = await client.GetFromJsonAsync<AccountResponse>("/account/me");

        Assert.Equal(HttpStatusCode.OK, registered.StatusCode);
        Assert.Contains("idlehold.session", registered.Headers.GetValues("Set-Cookie").Single());
        Assert.Equal(email, me!.Email);
        Assert.NotEqual(Guid.Empty, me.PlayerId);
    }

    [Fact]
    public async Task Register_WithAGuest_KeepsTheGuestProgress()
    {
        using var client = _factory.CreateClient();
        var guest = await (await client.PostAsync("/players", content: null)).Content.ReadFromJsonAsync<PlayerResponse>();
        await client.PostAsJsonAsync($"/players/{guest!.Id}/action", new StartActionRequest("cut-pine"));
        _factory.Clock.Advance(TimeSpan.FromSeconds(9));

        var account = await (await client.PostAsJsonAsync("/account/register", Register(NewEmail(), guest.Id)))
            .Content.ReadFromJsonAsync<AccountResponse>();
        var mine = await client.GetFromJsonAsync<PlayerResponse>("/me/player");

        Assert.Equal(guest.Id, account!.PlayerId);
        Assert.Equal(guest.Id, mine!.Id);
        Assert.Equal(3, mine.Inventory["pine-log"]);
        Assert.Equal("cut-pine", mine.ActiveAction!.ActionId);
    }

    [Fact]
    public async Task GuestRoutes_RefuseAHoldThatBelongsToAnAccount()
    {
        using var client = _factory.CreateClient();
        var guest = await (await client.PostAsync("/players", content: null)).Content.ReadFromJsonAsync<PlayerResponse>();
        await client.PostAsJsonAsync("/account/register", Register(NewEmail(), guest!.Id));

        // Someone who only knows the id, without the session cookie.
        using var stranger = _factory.CreateClient();
        var read = await stranger.GetAsync($"/players/{guest.Id}");
        var write = await stranger.PostAsJsonAsync($"/players/{guest.Id}/action", new StartActionRequest("cut-pine"));

        Assert.Equal(HttpStatusCode.Forbidden, read.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, write.StatusCode);
    }

    [Fact]
    public async Task Register_WithAnAlreadyClaimedGuest_IsRejected()
    {
        using var client = _factory.CreateClient();
        var guest = await (await client.PostAsync("/players", content: null)).Content.ReadFromJsonAsync<PlayerResponse>();
        await client.PostAsJsonAsync("/account/register", Register(NewEmail(), guest!.Id));

        using var other = _factory.CreateClient();
        var second = await other.PostAsJsonAsync("/account/register", Register(NewEmail(), guest.Id));

        Assert.Equal(HttpStatusCode.BadRequest, second.StatusCode);
    }

    [Theory]
    [InlineData("short")]
    [InlineData("")]
    public async Task Register_WithAWeakPassword_IsRejected(string password)
    {
        using var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/account/register", new RegisterRequest(NewEmail(), password, null));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Register_TwiceWithTheSameEmail_IsRejected()
    {
        using var client = _factory.CreateClient();
        var email = NewEmail();
        await client.PostAsJsonAsync("/account/register", Register(email));

        using var other = _factory.CreateClient();
        var second = await other.PostAsJsonAsync("/account/register", Register(email));

        Assert.Equal(HttpStatusCode.BadRequest, second.StatusCode);
    }

    [Fact]
    public async Task Login_ThenLogout_EndsTheSession()
    {
        var email = NewEmail();
        using (var setup = _factory.CreateClient())
        {
            await setup.PostAsJsonAsync("/account/register", Register(email));
        }

        using var client = _factory.CreateClient();
        var login = await client.PostAsJsonAsync("/account/login", new LoginRequest(email, Password));
        var signedIn = await client.GetAsync("/account/me");
        await client.PostAsync("/account/logout", content: null);
        var signedOut = await client.GetAsync("/account/me");

        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        Assert.Equal(HttpStatusCode.OK, signedIn.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, signedOut.StatusCode);
    }

    [Fact]
    public async Task Login_WithAWrongPassword_Returns401()
    {
        var email = NewEmail();
        using var client = _factory.CreateClient();
        await client.PostAsJsonAsync("/account/register", Register(email));
        await client.PostAsync("/account/logout", content: null);

        var response = await client.PostAsJsonAsync("/account/login", new LoginRequest(email, "not the password"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task MyPlayer_WithoutASession_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/me/player");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task MyPlayer_ActionsWorkThroughTheSession()
    {
        using var client = _factory.CreateClient();
        await client.PostAsJsonAsync("/account/register", Register(NewEmail()));

        var started = await client.PostAsJsonAsync("/me/player/action", new StartActionRequest("mine-stone"));
        _factory.Clock.Advance(TimeSpan.FromSeconds(6));
        var mine = await client.GetFromJsonAsync<PlayerResponse>("/me/player");
        var stopped = await client.DeleteAsync("/me/player/action");

        Assert.Equal(HttpStatusCode.OK, started.StatusCode);
        Assert.Equal(2, mine!.Inventory["stone"]);
        Assert.Equal(HttpStatusCode.OK, stopped.StatusCode);
    }
}
