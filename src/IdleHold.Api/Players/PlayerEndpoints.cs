using System.Security.Claims;
using IdleHold.Engine.Content;
using Microsoft.AspNetCore.Http.HttpResults;

namespace IdleHold.Api.Players;

public static class PlayerEndpoints
{
    /// <summary>
    /// Guest routes: the player id is the only key, so they only serve players without an account.
    /// Once a hold belongs to an account it answers 403 here and is reachable only through /me/player.
    /// </summary>
    public static IEndpointRouteBuilder MapPlayerEndpoints(this IEndpointRouteBuilder app)
    {
        var players = app.MapGroup("/players").WithTags("Players");

        players.MapPost("/", CreatePlayer);
        players.MapGet("/{playerId:guid}", GetPlayer);
        players.MapPost("/{playerId:guid}/action", StartAction);
        players.MapDelete("/{playerId:guid}/action", StopAction);

        return app;
    }

    /// <summary>The signed-in player's routes. The account comes from the session cookie.</summary>
    public static IEndpointRouteBuilder MapMyPlayerEndpoints(this IEndpointRouteBuilder app)
    {
        var mine = app.MapGroup("/me/player").WithTags("My player").RequireAuthorization();

        mine.MapGet("/", GetMyPlayer);
        mine.MapPost("/action", StartMyAction);
        mine.MapDelete("/action", StopMyAction);

        return app;
    }

    // Parameters are filled by ASP.NET Core: route values by name, services from dependency injection,
    // the request body (StartActionRequest) from JSON, and ClaimsPrincipal from the session cookie.

    private static async Task<Created<PlayerResponse>> CreatePlayer(
        PlayerService players, GameContent content, CancellationToken cancellationToken)
    {
        var player = await players.CreateAsync(cancellationToken);
        return TypedResults.Created($"/players/{player.Id}", PlayerResponse.From(player, content));
    }

    private static async Task<Results<Ok<PlayerResponse>, NotFound, ProblemHttpResult>> GetPlayer(
        Guid playerId, PlayerService players, GameContent content, CancellationToken cancellationToken)
    {
        var player = await players.GetAsync(playerId, cancellationToken);
        return player switch
        {
            null => TypedResults.NotFound(),
            { IsGuest: false } => OwnedByAccount(),
            _ => TypedResults.Ok(PlayerResponse.From(player, content)),
        };
    }

    private static async Task<Results<Ok<PlayerResponse>, NotFound, ValidationProblem, ProblemHttpResult>> StartAction(
        Guid playerId, StartActionRequest request, PlayerService players, GameContent content, CancellationToken cancellationToken)
    {
        if (InvalidAction(request, content) is { } invalid)
        {
            return invalid;
        }

        // owner: null means "a guest is asking", so a hold that belongs to an account is refused.
        return ToResponse(await players.StartActionAsync(playerId, owner: null, request.ActionId, cancellationToken), content);
    }

    private static async Task<Results<Ok<PlayerResponse>, NotFound, ValidationProblem, ProblemHttpResult>> StopAction(
        Guid playerId, PlayerService players, GameContent content, CancellationToken cancellationToken) =>
        ToResponse(await players.StopActionAsync(playerId, owner: null, cancellationToken), content);

    private static async Task<Ok<PlayerResponse>> GetMyPlayer(
        ClaimsPrincipal user, PlayerService players, GameContent content, CancellationToken cancellationToken)
    {
        var player = await players.GetOrCreateForAccountAsync(AccountId(user), cancellationToken);
        return TypedResults.Ok(PlayerResponse.From(player, content));
    }

    private static async Task<Results<Ok<PlayerResponse>, NotFound, ValidationProblem, ProblemHttpResult>> StartMyAction(
        ClaimsPrincipal user, StartActionRequest request, PlayerService players, GameContent content, CancellationToken cancellationToken)
    {
        if (InvalidAction(request, content) is { } invalid)
        {
            return invalid;
        }

        var accountId = AccountId(user);
        var mine = await players.GetOrCreateForAccountAsync(accountId, cancellationToken);
        return ToResponse(await players.StartActionAsync(mine.Id, accountId, request.ActionId, cancellationToken), content);
    }

    private static async Task<Results<Ok<PlayerResponse>, NotFound, ValidationProblem, ProblemHttpResult>> StopMyAction(
        ClaimsPrincipal user, PlayerService players, GameContent content, CancellationToken cancellationToken)
    {
        var accountId = AccountId(user);
        var mine = await players.GetOrCreateForAccountAsync(accountId, cancellationToken);
        return ToResponse(await players.StopActionAsync(mine.Id, accountId, cancellationToken), content);
    }

    private static Results<Ok<PlayerResponse>, NotFound, ValidationProblem, ProblemHttpResult> ToResponse(
        CommandResult result, GameContent content) => result.Status switch
        {
            CommandStatus.Done => TypedResults.Ok(PlayerResponse.From(result.Player!, content)),
            CommandStatus.Forbidden => OwnedByAccount(),
            _ => TypedResults.NotFound(),
        };

    /// <summary>The body comes from the browser, so never trust it: validate before touching the engine.</summary>
    private static ValidationProblem? InvalidAction(StartActionRequest request, GameContent content) =>
        string.IsNullOrWhiteSpace(request.ActionId) || content.FindAction(request.ActionId) is null
            ? TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                ["actionId"] = [$"Unknown action '{request.ActionId}'."],
            })
            : null;

    private static ProblemHttpResult OwnedByAccount() => TypedResults.Problem(
        statusCode: StatusCodes.Status403Forbidden,
        title: "This hold belongs to an account. Sign in to play it.");

    /// <summary>Identity stores the account id in the NameIdentifier claim of the session cookie.</summary>
    private static Guid AccountId(ClaimsPrincipal user) =>
        Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("An authenticated request has no account id."));
}
