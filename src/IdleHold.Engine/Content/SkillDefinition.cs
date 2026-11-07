namespace IdleHold.Engine.Content;

/// <summary>
/// A trade (skill) the player can level. <see cref="Category"/> groups trades by what they do:
/// gathering takes from the world, production turns what was gathered into goods.
/// </summary>
public sealed record SkillDefinition(string Id, SkillCategory Category);

public enum SkillCategory
{
    Gathering,
    Production,
}
