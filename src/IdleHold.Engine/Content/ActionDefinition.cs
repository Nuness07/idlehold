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
    long OutputQuantity = 1)
{
    /// <summary>Items taken from the stores at the end of each completion.</summary>
    public IReadOnlyList<ItemAmount> Inputs { get; init; } = [];

    /// <summary>The level the player needs in the action's trade to start it.</summary>
    public int RequiredLevel { get; init; } = 1;

    /// <summary>
    /// Whether each completion burns a cycle of fire. The player picks the fuel when starting; see
    /// <see cref="FuelDefinition"/>.
    /// </summary>
    public bool UsesFuel { get; init; }

    /// <summary>The recipe group the action is listed under, or <c>null</c> for a trade without groups; see <see cref="RecipeGroupDefinition"/>.</summary>
    public string? GroupId { get; init; }
}

/// <summary>A quantity of one item, such as "3 twigs".</summary>
public sealed record ItemAmount(string ItemId, long Quantity);
