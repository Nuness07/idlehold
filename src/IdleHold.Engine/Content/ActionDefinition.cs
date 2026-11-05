namespace IdleHold.Engine.Content;

/// <summary>
/// A repeatable action a player can run, such as chopping a tree.
/// Each completion takes <see cref="Duration"/> and grants XP plus an item.
/// </summary>
public sealed record ActionDefinition(
    string Id,
    string SkillId,
    TimeSpan Duration,
    long XpPerCompletion,
    string OutputItemId,
    int OutputQuantity = 1);
