using IdleHold.Engine;

namespace IdleHold.Api.Players;

/// <summary>
/// The stable codes the API answers a refused command with (409, <c>reason</c>), so the client can translate them,
/// and a title for people reading the raw response.
/// </summary>
public static class Reasons
{
    public static string? Of(ActionBlock? block) => block switch
    {
        null => null,
        ActionBlock.MissingBuilding => "missing-building",
        ActionBlock.MissingTool => "missing-tool",
        ActionBlock.LevelTooLow => "level-too-low",
        ActionBlock.MissingFuel => "missing-fuel",
        ActionBlock.MissingInputs => "missing-inputs",
        ActionBlock.ToolAlreadyOwned => "tool-already-owned",
        ActionBlock.StorageFull => "storage-full",
        _ => "blocked",
    };

    public static string? Of(BuildBlock? block) => block switch
    {
        null => null,
        BuildBlock.AlreadyBuilt => "already-built",
        BuildBlock.MissingInputs => "missing-inputs",
        _ => "blocked",
    };

    public static string TitleOf(string reason) => reason switch
    {
        "missing-building" => "This trade is locked until the village building it needs is built.",
        "missing-tool" => "This trade is locked until you own its tool.",
        "level-too-low" => "Your level in this trade is too low for this action.",
        "missing-fuel" => "There is no fuel of the chosen kind for the fire.",
        "missing-inputs" => "Not enough materials for this.",
        "tool-already-owned" => "You already own this tool or a better one.",
        "storage-full" => "The storehouse has no room for what this action makes.",
        "already-built" => "This is already part of the village.",
        _ => "This cannot be done now.",
    };
}
