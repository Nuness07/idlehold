using IdleHold.Engine;
using IdleHold.Engine.State;

namespace IdleHold.Api.Dev;

/// <summary>
/// The edits behind the development tools, as plain functions over a caught-up state. They skip the
/// game rules on purpose (a level without the XP work, items without gathering them), so the game itself
/// never calls them.
/// </summary>
public static class DevEdits
{
    /// <summary>Gives the trade exactly the XP that starts <paramref name="level"/>.</summary>
    public static GameState SetLevel(GameState state, string skillId, int level)
    {
        var xp = Experience.XpForLevel(level);
        return state with
        {
            SkillXp = xp == 0 ? state.SkillXp.Remove(skillId) : state.SkillXp.SetItem(skillId, xp),
        };
    }

    /// <summary>Sets how many of an item the stores hold; zero removes it, which is how a tool is taken away.</summary>
    public static GameState SetItemCount(GameState state, string itemId, long count) => state with
    {
        Inventory = count == 0 ? state.Inventory.Remove(itemId) : state.Inventory.SetItem(itemId, count),
    };

    /// <summary>Runs the game forward as if the player had been away for <paramref name="elapsed"/>.</summary>
    public static GameState Advance(GameEngine engine, GameState state, TimeSpan elapsed) =>
        engine.Tick(state, elapsed);

    /// <summary>Back to a new hold: empty stores, every trade at level 1, nothing working.</summary>
    public static GameState Reset(GameState _) => GameState.New;
}
