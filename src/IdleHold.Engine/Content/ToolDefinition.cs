namespace IdleHold.Engine.Content;

/// <summary>
/// Marks an item as a tool. Tools are unique: the player owns one per <see cref="Family"/> (axe, fishing
/// rod) and upgrades it to a higher <see cref="Tier"/> instead of collecting copies. A recipe whose output
/// is a tool can only be made while the player's tool of that family is below the recipe's tier.
/// <see cref="SkillId"/> is the trade the tool is used in (the axe in Woodcutting); every tier of a
/// family serves the same trade.
/// </summary>
public sealed record ToolDefinition(string ItemId, string Family, int Tier, string SkillId);
