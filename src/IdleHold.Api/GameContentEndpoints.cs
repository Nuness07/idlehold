using IdleHold.Engine.Content;

namespace IdleHold.Api;

public static class GameContentEndpoints
{
    public static IEndpointRouteBuilder MapGameContentEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/content", GetContent).WithTags("Content");
        return app;
    }

    private static ContentResponse GetContent(GameContent content) => new(
        content.Actions
            .Select(action => new ActionResponse(
                action.Id,
                action.SkillId,
                (long)action.Duration.TotalMilliseconds,
                action.XpPerCompletion,
                action.OutputItemId,
                action.OutputQuantity))
            .ToList());
}

public sealed record ContentResponse(IReadOnlyList<ActionResponse> Actions);

public sealed record ActionResponse(
    string Id,
    string SkillId,
    long DurationMs,
    long XpPerCompletion,
    string OutputItemId,
    int OutputQuantity);
