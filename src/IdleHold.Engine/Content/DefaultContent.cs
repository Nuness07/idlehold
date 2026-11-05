namespace IdleHold.Engine.Content;

/// <summary>
/// The content the real game ships with. Hard-coded for now; it will move to data files later.
/// </summary>
public static class DefaultContent
{
    public static GameContent Create() => new(
    [
        new ActionDefinition("cut-pine", "woodcutting", TimeSpan.FromSeconds(3), XpPerCompletion: 10, OutputItemId: "pine-log"),
        new ActionDefinition("cut-birch", "woodcutting", TimeSpan.FromSeconds(5), XpPerCompletion: 18, OutputItemId: "birch-log"),
    ]);
}
