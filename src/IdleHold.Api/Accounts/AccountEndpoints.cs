using System.Security.Claims;
using IdleHold.Api.Players;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;

namespace IdleHold.Api.Accounts;

/// <summary>
/// Sessions for guests and accounts. Every player has a session cookie (configured in Program.cs);
/// the browser sends it automatically, so the client never handles a token or a player id.
/// A guest's session belongs to an anonymous account, and signing up turns that same account into
/// a full one, so the hold never moves.
/// </summary>
public static class AccountEndpoints
{
    public static IEndpointRouteBuilder MapAccountEndpoints(this IEndpointRouteBuilder app)
    {
        var account = app.MapGroup("/account").WithTags("Account");

        account.MapPost("/guest", StartAsGuest);
        account.MapPost("/register", Register);
        account.MapPost("/login", Login);
        account.MapPost("/logout", Logout);
        account.MapGet("/me", Me).RequireAuthorization();

        return app;
    }

    /// <summary>
    /// Starts a guest session with a new anonymous account and its hold. A request that already has a
    /// session gets that session back, so a repeated call never leaves an unreachable guest behind.
    /// </summary>
    private static async Task<Ok<AccountResponse>> StartAsGuest(
        ClaimsPrincipal user,
        UserManager<Account> accounts,
        SignInManager<Account> signIn,
        PlayerService players,
        CancellationToken cancellationToken)
    {
        if (await accounts.GetUserAsync(user) is { } current)
        {
            return TypedResults.Ok(AccountResponse.From(current));
        }

        var guest = Account.NewGuest();
        var created = await accounts.CreateAsync(guest);
        if (!created.Succeeded)
        {
            throw new InvalidOperationException(
                $"Creating a guest account failed: {string.Join(", ", created.Errors.Select(error => error.Code))}.");
        }

        await players.GetOrCreateForAccountAsync(guest.Id, cancellationToken);
        await signIn.SignInAsync(guest, isPersistent: true);
        return TypedResults.Ok(AccountResponse.From(guest));
    }

    /// <summary>
    /// A guest signing up keeps its account and hold: the account only gains an e-mail and a password.
    /// Without a guest session (cookies cleared, for example) a new account with a new hold is made.
    /// </summary>
    private static async Task<Results<Ok<AccountResponse>, ValidationProblem>> Register(
        RegisterRequest request,
        ClaimsPrincipal user,
        UserManager<Account> accounts,
        SignInManager<Account> signIn,
        PlayerService players,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                ["email"] = ["E-mail and password are required."],
            });
        }

        IdentityResult result;
        var account = await accounts.GetUserAsync(user) is { IsAnonymous: true } guest ? guest : null;
        if (account is not null)
        {
            account.IsAnonymous = false;
            account.UserName = request.Email;
            account.Email = request.Email;

            // Validates the password, then the account with the full rules (a unique e-mail), and only
            // then saves both: a refused sign-up leaves the guest exactly as it was.
            result = await accounts.AddPasswordAsync(account, request.Password);
        }
        else
        {
            account = new Account { UserName = request.Email, Email = request.Email };
            result = await accounts.CreateAsync(account, request.Password);
        }

        if (!result.Succeeded)
        {
            return TypedResults.ValidationProblem(ToValidationErrors(result.Errors));
        }

        // Adding a password changes the security stamp, which would end the guest's cookie: issue a new one.
        await signIn.SignInAsync(account, isPersistent: true);
        await players.GetOrCreateForAccountAsync(account.Id, cancellationToken);
        return TypedResults.Ok(AccountResponse.From(account));
    }

    /// <summary>
    /// Signing in from a guest session leaves that guest unreachable (its only key was the cookie this
    /// replaces), so the guest and its hold are deleted. The client warns before that happens.
    /// </summary>
    private static async Task<Results<Ok<AccountResponse>, ProblemHttpResult>> Login(
        LoginRequest request,
        ClaimsPrincipal user,
        UserManager<Account> accounts,
        SignInManager<Account> signIn)
    {
        var previous = await accounts.GetUserAsync(user);
        var result = await signIn.PasswordSignInAsync(
            request.Email ?? "", request.Password ?? "", isPersistent: true, lockoutOnFailure: true);

        if (!result.Succeeded)
        {
            // One answer for "no such account", "wrong password" and "locked out": only an existing
            // account can be locked out, so a different answer there would reveal that the e-mail
            // has an account. The lockout itself still applies.
            return TypedResults.Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Wrong e-mail or password, or too many attempts. Try again in a few minutes.");
        }

        var account = (await accounts.FindByNameAsync(request.Email!))!;
        if (previous is { IsAnonymous: true } && previous.Id != account.Id)
        {
            await accounts.DeleteAsync(previous); // The hold goes with it (cascade).
        }

        return TypedResults.Ok(AccountResponse.From(account));
    }

    /// <summary>A guest that signs out can never come back, so the guest and its hold are deleted.</summary>
    private static async Task<NoContent> Logout(
        ClaimsPrincipal user, UserManager<Account> accounts, SignInManager<Account> signIn)
    {
        var current = await accounts.GetUserAsync(user);
        await signIn.SignOutAsync();
        if (current is { IsAnonymous: true })
        {
            await accounts.DeleteAsync(current);
        }

        return TypedResults.NoContent();
    }

    private static async Task<Results<Ok<AccountResponse>, UnauthorizedHttpResult>> Me(
        ClaimsPrincipal user, UserManager<Account> accounts)
    {
        var account = await accounts.GetUserAsync(user);
        return account is null ? TypedResults.Unauthorized() : TypedResults.Ok(AccountResponse.From(account));
    }

    /// <summary>Maps Identity's error codes to the request field they belong to.</summary>
    private static Dictionary<string, string[]> ToValidationErrors(IEnumerable<IdentityError> errors) =>
        errors
            .GroupBy(error => error.Code.StartsWith("Password", StringComparison.Ordinal) ? "password" : "email")
            .ToDictionary(group => group.Key, group => group.Select(error => error.Description).ToArray());
}

public sealed record RegisterRequest(string Email, string Password);

public sealed record LoginRequest(string Email, string Password);

/// <param name="Email">The account's e-mail, or <c>null</c> for a guest.</param>
/// <param name="IsGuest">Whether this session is a guest's, which can still sign up and keep its hold.</param>
public sealed record AccountResponse(string? Email, bool IsGuest)
{
    public static AccountResponse From(Account account) =>
        new(account.IsAnonymous ? null : account.Email, account.IsAnonymous);
}
