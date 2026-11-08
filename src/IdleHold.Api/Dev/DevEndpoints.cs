using System.Security.Claims;
using IdleHold.Api.Players;
using IdleHold.Engine;
using IdleHold.Engine.Content;
using IdleHold.Engine.State;
using Microsoft.AspNetCore.Http.HttpResults;

namespace IdleHold.Api.Dev;

/// <summary>
/// Development tools ("GM mode"): set a trade's level, add or remove items and tools, skip time and reset
/// the hold, to try features without playing up to them. They act on the session's own hold, like the
/// player routes, and answer with the same player shape.
///
/// They are mapped only when <c>DevTools:Enabled</c> is true, which only <c>appsettings.Development.json</c>
/// sets, and the API refuses to start with them in Production. Anywhere else the routes do not exist (404).
/// </summary>
public static class DevEndpoints
{
    /// <summary>The longest single time skip: a month, far more than any test needs.</summary>
    public static readonly TimeSpan MaxAdvance = TimeSpan.FromDays(30);

    /// <summary>Upper bound for a stack set by hand, so a typo cannot overflow later sums.</summary>
    public const long MaxItemCount = 1_000_000_000;

    public static IEndpointRouteBuilder MapDevEndpoints(this IEndpointRouteBuilder app)
    {
        var dev = app.MapGroup("/dev/player").WithTags("Development tools").RequireAuthorization();

        dev.MapPut("/skills/{skillId}", SetLevel);
        dev.MapPut("/items/{itemId}", SetItemCount);
        dev.MapPost("/advance", Advance);
        dev.MapPost("/reset", Reset);

        return app;
    }

    private static Task<Results<Ok<PlayerResponse>, NotFound, ValidationProblem>> SetLevel(
        string skillId, SetLevelRequest request, ClaimsPrincipal user, PlayerService players, GameEngine engine, GameContent content, CancellationToken cancellationToken)
    {
        var errors = new Dictionary<string, string[]>();
        if (content.Skills.All(skill => skill.Id != skillId))
        {
            errors["skillId"] = [$"Unknown trade '{skillId}'."];
        }

        if (request.Level is < 1 or > Experience.MaxLevel)
        {
            errors["level"] = [$"The level must be between 1 and {Experience.MaxLevel}."];
        }

        return EditAsync(errors, user, players, engine, content, state => DevEdits.SetLevel(state, skillId, request.Level), cancellationToken);
    }

    private static Task<Results<Ok<PlayerResponse>, NotFound, ValidationProblem>> SetItemCount(
        string itemId, SetItemCountRequest request, ClaimsPrincipal user, PlayerService players, GameEngine engine, GameContent content, CancellationToken cancellationToken)
    {
        var errors = new Dictionary<string, string[]>();
        if (!IsKnownItem(content, itemId))
        {
            errors["itemId"] = [$"Unknown item '{itemId}'."];
        }

        // A tool is unique: the stores hold one or none.
        var max = content.FindTool(itemId) is null ? MaxItemCount : 1;
        if (request.Count < 0 || request.Count > max)
        {
            errors["count"] = [$"The count must be between 0 and {max}."];
        }

        return EditAsync(errors, user, players, engine, content, state => DevEdits.SetItemCount(state, itemId, request.Count), cancellationToken);
    }

    private static Task<Results<Ok<PlayerResponse>, NotFound, ValidationProblem>> Advance(
        AdvanceRequest request, ClaimsPrincipal user, PlayerService players, GameEngine engine, GameContent content, CancellationToken cancellationToken)
    {
        var errors = new Dictionary<string, string[]>();
        if (request.Minutes < 1 || request.Minutes > MaxAdvance.TotalMinutes)
        {
            errors["minutes"] = [$"Skip between 1 and {MaxAdvance.TotalMinutes} minutes."];
        }

        var elapsed = TimeSpan.FromMinutes(request.Minutes);
        return EditAsync(errors, user, players, engine, content, state => DevEdits.Advance(engine, state, elapsed), cancellationToken);
    }

    private static Task<Results<Ok<PlayerResponse>, NotFound, ValidationProblem>> Reset(
        ClaimsPrincipal user, PlayerService players, GameEngine engine, GameContent content, CancellationToken cancellationToken) =>
        EditAsync([], user, players, engine, content, DevEdits.Reset, cancellationToken);

    /// <summary>Applies the edit unless the request was invalid, and answers with the edited hold.</summary>
    private static async Task<Results<Ok<PlayerResponse>, NotFound, ValidationProblem>> EditAsync(
        Dictionary<string, string[]> errors,
        ClaimsPrincipal user,
        PlayerService players,
        GameEngine engine,
        GameContent content,
        Func<GameState, GameState> edit,
        CancellationToken cancellationToken)
    {
        if (errors.Count > 0)
        {
            return TypedResults.ValidationProblem(errors);
        }

        var result = await players.EditAsync(AccountId(user), edit, cancellationToken);
        return result.Status == CommandStatus.Done
            ? TypedResults.Ok(PlayerResponse.From(result.Player!, engine, content))
            : TypedResults.NotFound();
    }

    /// <summary>The content has no item list of its own: an item is anything an action makes or uses.</summary>
    private static bool IsKnownItem(GameContent content, string itemId) =>
        content.Actions.Any(action => action.OutputItemId == itemId || action.Inputs.Any(input => input.ItemId == itemId));

    private static Guid AccountId(ClaimsPrincipal user) =>
        Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("An authenticated request has no account id."));
}

public sealed record SetLevelRequest(int Level);

public sealed record SetItemCountRequest(long Count);

public sealed record AdvanceRequest(int Minutes);
