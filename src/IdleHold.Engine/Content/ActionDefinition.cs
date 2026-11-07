namespace IdleHold.Engine.Content;

/// <summary>
/// A repeatable action a player can run, such as chopping a tree or crafting an axe.
/// Each completion takes <see cref="Duration"/>, consumes <see cref="Inputs"/> and grants XP plus an item.
/// Gathering actions have no inputs; a recipe is an action that has some.
/// </summary>
public sealed record ActionDefinition(
    string Id,
    string SkillId,
    TimeSpan Duration,
    long XpPerCompletion,
    string OutputItemId,
    int OutputQuantity = 1)
{
    /// <summary>Items taken from the stores at the end of each completion.</summary>
    public IReadOnlyList<ItemAmount> Inputs { get; init; } = [];
}

/// <summary>A quantity of one item, such as "3 twigs".</summary>
public sealed record ItemAmount(string ItemId, int Quantity);
