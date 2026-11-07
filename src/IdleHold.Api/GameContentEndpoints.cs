using System.Text.Json;
using System.Text.Json.Serialization;
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
        content.Skills
            .Select(skill => new SkillDefinitionResponse(skill.Id, skill.Category))
            .ToList(),
        content.Actions
            .Select(action => new ActionResponse(
                action.Id,
                action.SkillId,
                (long)action.Duration.TotalMilliseconds,
                action.XpPerCompletion,
                action.OutputItemId,
                action.OutputQuantity,
                action.Inputs.Select(input => new ItemAmountResponse(input.ItemId, input.Quantity)).ToList()))
            .ToList(),
        content.Tools
            .Select(tool => new ToolResponse(tool.ItemId, tool.Family, tool.Tier, tool.SkillId))
            .ToList());
}

public sealed record ContentResponse(
    IReadOnlyList<SkillDefinitionResponse> Skills,
    IReadOnlyList<ActionResponse> Actions,
    IReadOnlyList<ToolResponse> Tools);

/// <summary>A trade, in the order the game lists them, with the group it belongs to.</summary>
public sealed record SkillDefinitionResponse(
    string Id,
    [property: JsonConverter(typeof(CamelCaseEnumConverter<SkillCategory>))] SkillCategory Category);

/// <summary>Writes an enum as its camelCase name ("gathering"), so the OpenAPI document lists the names.</summary>
public sealed class CamelCaseEnumConverter<TEnum>() : JsonStringEnumConverter<TEnum>(JsonNamingPolicy.CamelCase)
    where TEnum : struct, Enum;

public sealed record ActionResponse(
    string Id,
    string SkillId,
    long DurationMs,
    long XpPerCompletion,
    string OutputItemId,
    long OutputQuantity,
    IReadOnlyList<ItemAmountResponse> Inputs);

/// <summary>An action's input: taken from the stores at the end of each completion.</summary>
public sealed record ItemAmountResponse(string ItemId, long Quantity);

/// <summary>
/// Marks an item as a tool. The player owns one per family and upgrades its tier; a recipe that makes
/// a tool is refused (409) once that tier or a better one is owned.
/// </summary>
public sealed record ToolResponse(string ItemId, string Family, int Tier, string SkillId);
