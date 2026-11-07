using System.Net;
using System.Net.Http.Json;
using IdleHold.Api.Accounts;
using IdleHold.Api.Players;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;

namespace IdleHold.Api.Tests;

/// <summary>
/// Guest sessions, sign-up, sign-in and sign-out. The test client keeps cookies between requests,
/// like a browser, so a session carries over from one request to the next.
/// </summary>
public sealed class AccountEndpointsTests(PostgresFixture database) : IClassFixture<PostgresFixture>, IDisposable
{
    private const string Password = "a long enough password";

    private readonly ApiFactory _factory = new(database.ConnectionString);

    public void Dispose() => _factory.Dispose();

    private static string NewEmail() => $"{Guid.NewGuid():N}@example.test";

    private static async Task<string?> TitleOf(HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<ProblemDetails>())?.Title;

    private static RegisterRequest Register(string email) => new(email, Password);

    private static async Task<PlayerResponse> MyPlayer(HttpClient client) =>
        (await client.GetFromJsonAsync<PlayerResponse>("/me/player"))!;

    /// <summary>A full account made in its own browser, which then signs out.</summary>
    private async Task<string> ExistingAccountAsync()
    {
        var email = NewEmail();
        using var setup = _factory.CreateClient();
        (await setup.PostAsJsonAsync("/account/register", Register(email))).EnsureSuccessStatusCode();
        return email;
    }

    private Task<PlayerSave?> SavedPlayer(Guid playerId) =>
        _factory.Services.GetRequiredService<IPlayerStore>().GetAsync(playerId, CancellationToken.None);

    [Fact]
    public async Task Guest_StartsASessionWithItsOwnHold()
    {
        using var client = _factory.CreateClient();

        var started = await client.PostAsync("/account/guest", content: null);
        var me = await client.GetFromJsonAsync<AccountResponse>("/account/me");
        var player = await client.GetAsync("/me/player");

        Assert.Equal(HttpStatusCode.OK, started.StatusCode);
        Assert.Contains("idlehold.session", started.Headers.GetValues("Set-Cookie").Single());
        Assert.Equal(new AccountResponse(Email: null, IsGuest: true), me);
        Assert.Equal(HttpStatusCode.OK, player.StatusCode);
    }

    [Fact]
    public async Task Guest_WithASessionAlready_KeepsThatSession()
    {
        using var client = await _factory.CreateGuestClientAsync();
        var before = await MyPlayer(client);

        var again = await client.PostAsync("/account/guest", content: null);

        Assert.Equal(HttpStatusCode.OK, again.StatusCode);
        Assert.Equal(before.Id, (await MyPlayer(client)).Id);
    }

    [Fact]
    public async Task Register_AsAGuest_KeepsTheHoldAndItsProgress()
    {
        using var client = await _factory.CreateGuestClientAsync();
        var guestHold = await MyPlayer(client);
        await client.PostAsJsonAsync("/me/player/action", new StartActionRequest("cut-pine"));
        _factory.Clock.Advance(TimeSpan.FromSeconds(9));
        var email = NewEmail();

        var registered = await client.PostAsJsonAsync("/account/register", Register(email));
        var me = await client.GetFromJsonAsync<AccountResponse>("/account/me");
        var mine = await MyPlayer(client);

        Assert.Equal(HttpStatusCode.OK, registered.StatusCode);
        Assert.Equal(new AccountResponse(email, IsGuest: false), me);
        Assert.Equal(guestHold.Id, mine.Id);
        Assert.Equal(3, mine.Inventory["pine-log"]);
        Assert.Equal("cut-pine", mine.ActiveAction!.ActionId);
    }

    [Fact]
    public async Task Register_AsAGuest_ThenSignInAgain_OpensTheSameHold()
    {
        var email = NewEmail();
        using var client = await _factory.CreateGuestClientAsync();
        var guestHold = await MyPlayer(client);
        await client.PostAsJsonAsync("/account/register", Register(email));
        await client.PostAsync("/account/logout", content: null);

        using var elsewhere = _factory.CreateClient();
        var login = await elsewhere.PostAsJsonAsync("/account/login", new LoginRequest(email, Password));

        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        Assert.Equal(guestHold.Id, (await MyPlayer(elsewhere)).Id);
    }

    [Fact]
    public async Task Register_WithoutASession_MakesANewAccountWithAHold()
    {
        using var client = _factory.CreateClient();
        var email = NewEmail();

        var registered = await client.PostAsJsonAsync("/account/register", Register(email));

        Assert.Equal(HttpStatusCode.OK, registered.StatusCode);
        Assert.Equal(new AccountResponse(email, IsGuest: false), await registered.Content.ReadFromJsonAsync<AccountResponse>());
        Assert.Empty((await MyPlayer(client)).Inventory);
    }

    [Fact]
    public async Task Register_AsAGuest_WithAnEmailInUse_LeavesTheGuestAsItWas()
    {
        var taken = await ExistingAccountAsync();
        using var client = await _factory.CreateGuestClientAsync();
        var guestHold = await MyPlayer(client);

        var response = await client.PostAsJsonAsync("/account/register", Register(taken));
        var me = await client.GetFromJsonAsync<AccountResponse>("/account/me");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(new AccountResponse(Email: null, IsGuest: true), me);
        Assert.Equal(guestHold.Id, (await MyPlayer(client)).Id);
    }

    [Theory]
    [InlineData("short")]
    [InlineData("")]
    public async Task Register_AsAGuest_WithAWeakPassword_LeavesTheGuestAsItWas(string password)
    {
        using var client = await _factory.CreateGuestClientAsync();

        var response = await client.PostAsJsonAsync("/account/register", new RegisterRequest(NewEmail(), password));
        var me = await client.GetFromJsonAsync<AccountResponse>("/account/me");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.True(me!.IsGuest);
    }

    [Fact]
    public async Task Register_TwiceWithTheSameEmail_IsRejected()
    {
        var email = await ExistingAccountAsync();
        using var other = _factory.CreateClient();

        var second = await other.PostAsJsonAsync("/account/register", Register(email));

        Assert.Equal(HttpStatusCode.BadRequest, second.StatusCode);
    }

    [Fact]
    public async Task Login_FromAGuest_OpensTheAccountAndDeletesTheGuestHold()
    {
        var email = await ExistingAccountAsync();
        using var client = await _factory.CreateGuestClientAsync();
        var guestHold = await MyPlayer(client);

        var login = await client.PostAsJsonAsync("/account/login", new LoginRequest(email, Password));
        var me = await client.GetFromJsonAsync<AccountResponse>("/account/me");

        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        Assert.Equal(new AccountResponse(email, IsGuest: false), me);
        Assert.NotEqual(guestHold.Id, (await MyPlayer(client)).Id);
        Assert.Null(await SavedPlayer(guestHold.Id));
    }

    [Fact]
    public async Task Login_FromAGuest_WithAWrongPassword_KeepsTheGuest()
    {
        var email = await ExistingAccountAsync();
        using var client = await _factory.CreateGuestClientAsync();
        var guestHold = await MyPlayer(client);

        var login = await client.PostAsJsonAsync("/account/login", new LoginRequest(email, "not the password"));

        Assert.Equal(HttpStatusCode.Unauthorized, login.StatusCode);
        Assert.Equal(guestHold.Id, (await MyPlayer(client)).Id);
    }

    [Fact]
    public async Task Logout_AsAGuest_EndsTheSessionAndDeletesTheGuestHold()
    {
        using var client = await _factory.CreateGuestClientAsync();
        var guestHold = await MyPlayer(client);

        var logout = await client.PostAsync("/account/logout", content: null);
        var me = await client.GetAsync("/account/me");

        Assert.Equal(HttpStatusCode.NoContent, logout.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, me.StatusCode);
        Assert.Null(await SavedPlayer(guestHold.Id));
    }

    [Fact]
    public async Task Login_ThenLogout_EndsTheSessionAndKeepsTheHold()
    {
        var email = await ExistingAccountAsync();
        using var client = _factory.CreateClient();

        var login = await client.PostAsJsonAsync("/account/login", new LoginRequest(email, Password));
        var hold = await MyPlayer(client);
        await client.PostAsync("/account/logout", content: null);
        var signedOut = await client.GetAsync("/account/me");

        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, signedOut.StatusCode);
        Assert.NotNull(await SavedPlayer(hold.Id));
    }

    [Fact]
    public async Task Login_WithAWrongPassword_Returns401()
    {
        var email = await ExistingAccountAsync();
        using var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/account/login", new LoginRequest(email, "not the password"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_WhenLockedOut_LooksLikeAnUnknownEmail()
    {
        var email = await ExistingAccountAsync();
        using var client = _factory.CreateClient();
        for (var attempt = 0; attempt < 5; attempt++)
        {
            await client.PostAsJsonAsync("/account/login", new LoginRequest(email, "not the password"));
        }

        // Even the right password is refused while locked out, with the same answer as a stranger's e-mail.
        var lockedOut = await client.PostAsJsonAsync("/account/login", new LoginRequest(email, Password));
        var unknown = await client.PostAsJsonAsync("/account/login", new LoginRequest(NewEmail(), Password));

        Assert.Equal(HttpStatusCode.Unauthorized, lockedOut.StatusCode);
        Assert.Equal(unknown.StatusCode, lockedOut.StatusCode);
        Assert.Equal(await TitleOf(unknown), await TitleOf(lockedOut));
    }

    [Fact]
    public async Task Me_WithoutASession_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/account/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
