namespace IdleHold.Engine.Content;

/// <summary>
/// The content the real game ships with. Hard-coded for now; it will move to data files later.
/// The player starts with bare hands: Woodcutting, Mining and Foraging each have an action that needs
/// no tool. Each tree, fishing spot and rock then pays more XP per second the slower it is.
/// </summary>
public static class DefaultContent
{
    public static GameContent Create() => new(
    [
        // Woodcutting
        new ActionDefinition("gather-twigs", "woodcutting", TimeSpan.FromSeconds(2), XpPerCompletion: 5, OutputItemId: "twig"),
        new ActionDefinition("cut-pine", "woodcutting", TimeSpan.FromSeconds(3), XpPerCompletion: 10, OutputItemId: "pine-log"),
        new ActionDefinition("cut-birch", "woodcutting", TimeSpan.FromSeconds(5), XpPerCompletion: 18, OutputItemId: "birch-log"),

        // Fishing
        new ActionDefinition("catch-perch", "fishing", TimeSpan.FromSeconds(4), XpPerCompletion: 12, OutputItemId: "perch"),
        new ActionDefinition("catch-pike", "fishing", TimeSpan.FromSeconds(7), XpPerCompletion: 28, OutputItemId: "pike"),

        // Mining
        new ActionDefinition("pick-pebbles", "mining", TimeSpan.FromSeconds(2), XpPerCompletion: 5, OutputItemId: "pebble"),
        new ActionDefinition("mine-stone", "mining", TimeSpan.FromSeconds(3), XpPerCompletion: 9, OutputItemId: "stone"),
        new ActionDefinition("mine-copper", "mining", TimeSpan.FromSeconds(6), XpPerCompletion: 22, OutputItemId: "copper-ore"),

        // Foraging
        new ActionDefinition("pick-wild-berries", "foraging", TimeSpan.FromSeconds(2), XpPerCompletion: 5, OutputItemId: "wild-berry"),
    ]);
}
