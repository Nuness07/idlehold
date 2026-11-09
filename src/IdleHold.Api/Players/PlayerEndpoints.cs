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
        mine.MapPost("/buildings/{buildingId}", BuildMine);

        return app;
    }

    // Parameters are filled by ASP.NET Core: services from dependency injection, the request body
    // (StartActionRequest) from JSON, and ClaimsPrincipal from the session cookie.

    private static async Task<Ok<PlayerResponse>> GetMyPlayer(
        ClaimsPrincipal user, PlayerService players, GameEngine engine, GameContent content, CancellationToken cancellationToken)
    {
        var player = await players.GetOrCreateForAccountAsync(AccountId(user), cancellationToken);
        return TypedResults.Ok(PlayerResponse.From(player, engine, content));
    }

    private static async Task<Results<Ok<PlayerResponse>, NotFound, ValidationProblem, ProblemHttpResult>> StartMyAction(
        ClaimsPrincipal user, StartActionRequest request, PlayerService players, GameEngine engine, GameContent content, CancellationToken cancellationToken)
    {
        if (InvalidAction(request, content) is { } invalid)
        {
            return invalid;
        }

        return ToResponse(await players.StartActionAsync(AccountId(user), request.ActionId, request.FuelItemId, cancellationToken), engine, content);
    }

    private static async Task<Results<Ok<PlayerResponse>, NotFound, ValidationProblem, ProblemHttpResult>> StopMyAction(
        ClaimsPrincipal user, PlayerService players, GameEngine engine, GameContent content, CancellationToken cancellationToken) =>
        ToResponse(await players.StopActionAsync(AccountId(user), cancellationToken), engine, content);

    /// <summary>Builds a village building at once, paid from the stores; 409 <c>already-built</c> or <c>missing-inputs</c>.</summary>
    private static async Task<Results<Ok<PlayerResponse>, NotFound, ValidationProblem, ProblemHttpResult>> BuildMine(
        ClaimsPrincipal user, string buildingId, PlayerService players, GameEngine engine, GameContent content, CancellationToken cancellationToken)
    {
        if (content.FindBuilding(buildingId) is null)
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                ["buildingId"] = [$"Unknown building '{buildingId}'."],
            });
        }

        return ToResponse(await players.BuildAsync(AccountId(user), buildingId, cancellationToken), engine, content);
    }

    private static Results<Ok<PlayerResponse>, NotFound, ValidationProblem, ProblemHttpResult> ToResponse(
        CommandResult result, GameEngine engine, GameContent content) => result.Status switch
        {
            CommandStatus.Done => TypedResults.Ok(PlayerResponse.From(result.Player!, engine, content)),
            CommandStatus.Blocked => Blocked(result.Reason!),
            _ => TypedResults.NotFound(),
        };

    /// <summary>
    /// 409: the request was fine, but the game state does not allow it now. <c>reason</c> is a stable code
    /// the client can translate; the title is for people reading the raw response.
    /// </summary>
    private static ProblemHttpResult Blocked(string reason) => TypedResults.Problem(
        statusCode: StatusCodes.Status409Conflict,
        title: Reasons.TitleOf(reason),
        extensions: new Dictionary<string, object?> { ["reason"] = reason });

    /// <summary>The body comes from the browser, so never trust it: validate before touching the engine.</summary>
    private static ValidationProblem? InvalidAction(StartActionRequest request, GameContent content)
    {
        if (string.IsNullOrWhiteSpace(request.ActionId) || content.FindAction(request.ActionId) is not { } action)
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                ["actionId"] = [$"Unknown action '{request.ActionId}'."],
            });
        }

        // An action that burns fuel needs one; the fuel is ignored for any other action.
        if (action.UsesFuel && (request.FuelItemId is null || content.FindFuel(request.FuelItemId) is null))
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                ["fuelItemId"] = [$"'{request.ActionId}' needs a fuel, and '{request.FuelItemId}' is not one."],
            });
        }

        return null;
    }

    /// <summary>Identity stores the account id in the NameIdentifier claim of the session cookie.</summary>
    private static Guid AccountId(ClaimsPrincipal user) =>
        Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("An authenticated request has no account id."));
}
