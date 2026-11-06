using System.Security.Claims;
using IdleHold.Api.Players;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;

namespace IdleHold.Api.Accounts;

/// <summary>
/// Sign-up, sign-in and sign-out. Signing in issues an HttpOnly session cookie (configured in
/// Program.cs); the browser sends it automatically, so the client never handles a token.
/// </summary>
public static class AccountEndpoints
{
    public static IEndpointRouteBuilder MapAccountEndpoints(this IEndpointRouteBuilder app)
    {
        var account = app.MapGroup("/account").WithTags("Account");

        account.MapPost("/register", Register);
        account.MapPost("/login", Login);
        account.MapPost("/logout", Logout);
        account.MapGet("/me", Me).RequireAuthorization();

        return app;
    }

    private static async Task<Results<Ok<AccountResponse>, ValidationProblem>> Register(
        RegisterRequest request,
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

        // Check the guest before creating the account, so a bad id never leaves a half-made account.
        if (request.GuestPlayerId is { } guestId && !await players.IsClaimableAsync(guestId, cancellationToken))
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                ["guestPlayerId"] = ["This hold does not exist or already belongs to an account."],
            });
        }

        var account = new Account { UserName = request.Email, Email = request.Email };
        var created = await accounts.CreateAsync(account, request.Password);
        if (!created.Succeeded)
        {
            return TypedResults.ValidationProblem(ToValidationErrors(created.Errors));
        }

        if (request.GuestPlayerId is { } claimedId)
        {
            // If someone claimed it in the meantime, the account simply starts a new hold below.
            await players.ClaimAsync(claimedId, account.Id, cancellationToken);
        }

        await signIn.SignInAsync(account, isPersistent: true);
        var player = await players.GetOrCreateForAccountAsync(account.Id, cancellationToken);
        return TypedResults.Ok(new AccountResponse(account.Email!, player.Id));
    }

    private static async Task<Results<Ok<AccountResponse>, ProblemHttpResult>> Login(
        LoginRequest request,
        UserManager<Account> accounts,
        SignInManager<Account> signIn,
        PlayerService players,
        CancellationToken cancellationToken)
    {
        var result = await signIn.PasswordSignInAsync(
            request.Email ?? "", request.Password ?? "", isPersistent: true, lockoutOnFailure: true);

        if (result.IsLockedOut)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status429TooManyRequests,
                title: "Too many failed attempts. Try again in a few minutes.");
        }

        if (!result.Succeeded)
        {
            // One message for "no such account" and "wrong password", so the API does not reveal
            // which e-mail addresses have accounts.
            return TypedResults.Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Wrong e-mail or password.");
        }

        var account = await accounts.FindByNameAsync(request.Email!);
        var player = await players.GetOrCreateForAccountAsync(account!.Id, cancellationToken);
        return TypedResults.Ok(new AccountResponse(account.Email!, player.Id));
    }

    private static async Task<NoContent> Logout(SignInManager<Account> signIn)
    {
        await signIn.SignOutAsync();
        return TypedResults.NoContent();
    }

    private static async Task<Results<Ok<AccountResponse>, UnauthorizedHttpResult>> Me(
        ClaimsPrincipal user,
        UserManager<Account> accounts,
        PlayerService players,
        CancellationToken cancellationToken)
    {
        var account = await accounts.GetUserAsync(user);
        if (account is null)
        {
            return TypedResults.Unauthorized();
        }

        var player = await players.GetOrCreateForAccountAsync(account.Id, cancellationToken);
        return TypedResults.Ok(new AccountResponse(account.Email!, player.Id));
    }

    /// <summary>Maps Identity's error codes to the request field they belong to.</summary>
    private static Dictionary<string, string[]> ToValidationErrors(IEnumerable<IdentityError> errors) =>
        errors
            .GroupBy(error => error.Code.StartsWith("Password", StringComparison.Ordinal) ? "password" : "email")
            .ToDictionary(group => group.Key, group => group.Select(error => error.Description).ToArray());
}

/// <param name="GuestPlayerId">The guest hold to keep, if the player already has one.</param>
public sealed record RegisterRequest(string Email, string Password, Guid? GuestPlayerId);

public sealed record LoginRequest(string Email, string Password);

public sealed record AccountResponse(string Email, Guid PlayerId);
