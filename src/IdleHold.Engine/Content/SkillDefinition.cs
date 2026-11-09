namespace IdleHold.Engine.Content;

/// <summary>
/// A trade (skill) the player can level. <see cref="Category"/> groups trades by what they do:
/// gathering takes from the world, production turns what was gathered into goods.
/// </summary>
public sealed record SkillDefinition(string Id, SkillCategory Category)
{
    /// <summary>
    /// The village building the trade waits for, or <c>null</c> when none: the trade stays locked until it is built
    /// (Cooking waits for the campfire).
    /// </summary>
    public string? RequiredBuildingId { get; init; }
}

public enum SkillCategory
{
    Gathering,
    Production,
}
