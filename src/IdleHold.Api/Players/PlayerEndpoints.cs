using Microsoft.AspNetCore.Http.HttpResults;
using IdleHold.Engine.Content;

namespace IdleHold.Api.Players;

public static class PlayerEndpoints
{
    public static IEndpointRouteBuilder MapPlayerEndpoints(this IEndpointRouteBuilder app)
    {
        var players = app.MapGroup("/players").WithTags("Players");

        players.MapPost("/", CreatePlayer);
        players.MapGet("/{playerId:guid}", GetPlayer);
        players.MapPost("/{playerId:guid}/action", StartAction);
        players.MapDelete("/{playerId:guid}/action", StopAction);

        return app;
    }

    // Parameters are filled by ASP.NET Core: route values by name, services from dependency injection,
    // and the request body (StartActionRequest) from JSON.

    private static async Task<Created<PlayerResponse>> CreatePlayer(
        PlayerService players, GameContent content, CancellationToken cancellationToken)
    {
        var player = await players.CreateAsync(cancellationToken);
        return TypedResults.Created($"/players/{player.Id}", PlayerResponse.From(player, content));
    }

    private static async Task<Results<Ok<PlayerResponse>, NotFound>> GetPlayer(
        Guid playerId, PlayerService players, GameContent content, CancellationToken cancellationToken)
    {
        var player = await players.GetAsync(playerId, cancellationToken);
        return ToResult(player, content);
    }

    private static async Task<Results<Ok<PlayerResponse>, NotFound, ValidationProblem>> StartAction(
        Guid playerId, StartActionRequest request, PlayerService players, GameContent content, CancellationToken cancellationToken)
    {
        // The body comes from the browser, so never trust it: validate before touching the engine.
        if (string.IsNullOrWhiteSpace(request.ActionId) || content.FindAction(request.ActionId) is null)
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                ["actionId"] = [$"Unknown action '{request.ActionId}'."],
            });
        }

        var player = await players.StartActionAsync(playerId, request.ActionId, cancellationToken);
        return player is null ? TypedResults.NotFound() : TypedResults.Ok(PlayerResponse.From(player, content));
    }

    private static async Task<Results<Ok<PlayerResponse>, NotFound>> StopAction(
        Guid playerId, PlayerService players, GameContent content, CancellationToken cancellationToken)
    {
        var player = await players.StopActionAsync(playerId, cancellationToken);
        return ToResult(player, content);
    }

    private static Results<Ok<PlayerResponse>, NotFound> ToResult(PlayerSave? player, GameContent content) =>
        player is null ? TypedResults.NotFound() : TypedResults.Ok(PlayerResponse.From(player, content));
}
