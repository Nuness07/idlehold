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
            .Select(skill => new SkillDefinitionResponse(skill.Id, skill.Category, skill.RequiredBuildingId))
            .ToList(),
        content.Actions
            .Select(action => new ActionResponse(
                action.Id,
                action.SkillId,
                (long)action.Duration.TotalMilliseconds,
                action.XpPerCompletion,
                action.OutputItemId,
                action.OutputQuantity,
                action.Inputs.Select(input => new ItemAmountResponse(input.ItemId, input.Quantity)).ToList(),
                action.RequiredLevel,
                action.UsesFuel,
                action.GroupId))
            .ToList(),
        content.Tools
            .Select(tool => new ToolResponse(tool.ItemId, tool.Family, tool.Tier, tool.SkillId))
            .ToList(),
        content.Fuels
            .Select(fuel => new FuelResponse(fuel.ItemId, fuel.Cycles))
            .ToList(),
        content.RecipeGroups
            .Select(group => new RecipeGroupResponse(group.Id, group.SkillId))
            .ToList(),
        content.Buildings
            .Select(building => new BuildingResponse(
                building.Id,
                building.Cost.Select(item => new ItemAmountResponse(item.ItemId, item.Quantity)).ToList()))
            .ToList());
}

public sealed record ContentResponse(
    IReadOnlyList<SkillDefinitionResponse> Skills,
    IReadOnlyList<ActionResponse> Actions,
    IReadOnlyList<ToolResponse> Tools,
    IReadOnlyList<FuelResponse> Fuels,
    IReadOnlyList<RecipeGroupResponse> RecipeGroups,
    IReadOnlyList<BuildingResponse> Buildings);

/// <summary>
/// A trade, in the order the game lists them, with the group it belongs to and the village building it waits for
/// (<c>null</c> when none).
/// </summary>
public sealed record SkillDefinitionResponse(
    string Id,
    [property: JsonConverter(typeof(CamelCaseEnumConverter<SkillCategory>))] SkillCategory Category,
    string? RequiredBuildingId = null);

/// <summary>A village building, built once with <c>POST /me/player/buildings/{id}</c>, and what it costs from the stores.</summary>
public sealed record BuildingResponse(string Id, IReadOnlyList<ItemAmountResponse> Cost);

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
    IReadOnlyList<ItemAmountResponse> Inputs,
    int RequiredLevel,
    bool UsesFuel,
    string? GroupId);

/// <summary>
/// A heading a trade lists its recipes under (a station, a material), in the game's order. A group can have no
/// recipes yet: it shows what is coming. When a trade has groups, each of its actions names one in <c>groupId</c>.
/// </summary>
public sealed record RecipeGroupResponse(string Id, string SkillId);

/// <summary>An item that can feed the fire of an action that burns fuel, and how many completions one of it lasts.</summary>
public sealed record FuelResponse(string ItemId, int Cycles);

/// <summary>An action's input: taken from the stores at the end of each completion.</summary>
public sealed record ItemAmountResponse(string ItemId, long Quantity);

/// <summary>
/// Marks an item as a tool. The player owns one per family and upgrades its tier; a recipe that makes
/// a tool is refused (409) once that tier or a better one is owned.
/// </summary>
public sealed record ToolResponse(string ItemId, string Family, int Tier, string SkillId);
