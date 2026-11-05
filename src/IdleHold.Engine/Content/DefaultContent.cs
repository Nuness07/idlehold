namespace IdleHold.Engine.Content;

/// <summary>
/// The content the real game ships with. Hard-coded for now; it will move to data files later.
/// Each gathering skill has a quick starter action and a slower, more rewarding one.
/// </summary>
public static class DefaultContent
{
    public static GameContent Create() => new(
    [
        // Woodcutting
        new ActionDefinition("cut-pine", "woodcutting", TimeSpan.FromSeconds(3), XpPerCompletion: 10, OutputItemId: "pine-log"),
        new ActionDefinition("cut-birch", "woodcutting", TimeSpan.FromSeconds(5), XpPerCompletion: 18, OutputItemId: "birch-log"),

        // Fishing
        new ActionDefinition("catch-perch", "fishing", TimeSpan.FromSeconds(4), XpPerCompletion: 12, OutputItemId: "perch"),
        new ActionDefinition("catch-pike", "fishing", TimeSpan.FromSeconds(7), XpPerCompletion: 28, OutputItemId: "pike"),

        // Mining
        new ActionDefinition("mine-stone", "mining", TimeSpan.FromSeconds(3), XpPerCompletion: 9, OutputItemId: "stone"),
        new ActionDefinition("mine-copper", "mining", TimeSpan.FromSeconds(6), XpPerCompletion: 22, OutputItemId: "copper-ore"),
    ]);
}
