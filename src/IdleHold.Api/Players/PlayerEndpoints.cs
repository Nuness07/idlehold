using System.Security.Claims;
using IdleHold.Engine;
using IdleHold.Engine.Content;
using Microsoft.AspNetCore.Http.HttpResults;

namespace IdleHold.Api.Players;

public static class PlayerEndpoints
{
    /// <summary>
    /// The player's routes. Who is playing comes from the session cookie, a guest's or an account's,
    /// so no route takes a player id.
    /// </summary>
    public static IEndpointRouteBuilder MapPlayerEndpoints(this IEndpointRouteBuilder app)
    {
        var mine = app.MapGroup("/me/player").WithTags("My player").RequireAuthorization();

        mine.MapGet("/", GetMyPlayer);
        mine.MapPost("/action", StartMyAction);
        mine.MapDelete("/action", StopMyAction);

        return app;
    }

    // Parameters are filled by ASP.NET Core: services from dependency injection, the request body
    // (StartActionRequest) from JSON, and ClaimsPrincipal from the session cookie.

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

        return ToResponse(await players.StartActionAsync(AccountId(user), request.ActionId, cancellationToken), content);
    }

    private static async Task<Results<Ok<PlayerResponse>, NotFound, ValidationProblem, ProblemHttpResult>> StopMyAction(
        ClaimsPrincipal user, PlayerService players, GameContent content, CancellationToken cancellationToken) =>
        ToResponse(await players.StopActionAsync(AccountId(user), cancellationToken), content);

    private static Results<Ok<PlayerResponse>, NotFound, ValidationProblem, ProblemHttpResult> ToResponse(
        CommandResult result, GameContent content) => result.Status switch
        {
            CommandStatus.Done => TypedResults.Ok(PlayerResponse.From(result.Player!, content)),
            CommandStatus.Blocked => Blocked(result.Block!.Value),
            _ => TypedResults.NotFound(),
        };

    /// <summary>
    /// 409: the request was fine, but the game state does not allow it now. <c>reason</c> is a stable code
    /// the client can translate; the title is for people reading the raw response.
    /// </summary>
    private static ProblemHttpResult Blocked(ActionBlock block) => TypedResults.Problem(
        statusCode: StatusCodes.Status409Conflict,
        title: block switch
        {
            ActionBlock.MissingInputs => "Not enough materials to start this action.",
            ActionBlock.ToolAlreadyOwned => "You already own this tool or a better one.",
            _ => "This action cannot start now.",
        },
        extensions: new Dictionary<string, object?> { ["reason"] = ReasonCode(block) });

    private static string ReasonCode(ActionBlock block) => block switch
    {
        ActionBlock.MissingInputs => "missing-inputs",
        ActionBlock.ToolAlreadyOwned => "tool-already-owned",
        _ => "blocked",
    };

    /// <summary>The body comes from the browser, so never trust it: validate before touching the engine.</summary>
    private static ValidationProblem? InvalidAction(StartActionRequest request, GameContent content) =>
        string.IsNullOrWhiteSpace(request.ActionId) || content.FindAction(request.ActionId) is null
            ? TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                ["actionId"] = [$"Unknown action '{request.ActionId}'."],
            })
            : null;

    /// <summary>Identity stores the account id in the NameIdentifier claim of the session cookie.</summary>
    private static Guid AccountId(ClaimsPrincipal user) =>
        Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("An authenticated request has no account id."));
}
