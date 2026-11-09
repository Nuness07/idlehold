using System.Collections.Immutable;

namespace IdleHold.Engine.State;

/// <summary>
/// Everything that describes one player's progress at a point in time.
/// Immutable: the engine never changes a state, it returns a new one.
/// </summary>
public sealed record GameState
{
    public static GameState New { get; } = new();

    public ImmutableDictionary<string, long> Inventory { get; init; } = ImmutableDictionary<string, long>.Empty;

    public ImmutableDictionary<string, long> SkillXp { get; init; } = ImmutableDictionary<string, long>.Empty;

    public ActiveAction? ActiveAction { get; init; }

    /// <summary>
    /// Completions the fire can still burn for from the fuel already in it, before it takes more from the stores.
    /// The fire only burns while a fire-using action works, so this waits between sessions.
    /// </summary>
    public long FireCyclesLeft { get; init; }

    /// <summary>The village buildings the player has built, such as the lit campfire. Built once, kept for good.</summary>
    public ImmutableHashSet<string> Buildings { get; init; } = ImmutableHashSet<string>.Empty;

    public long ItemCount(string itemId) => Inventory.GetValueOrDefault(itemId);

    public long XpOf(string skillId) => SkillXp.GetValueOrDefault(skillId);

    public int LevelOf(string skillId) => Experience.LevelFor(XpOf(skillId));
}

/// <summary>
/// The action currently running, how far into the current cycle it is, and, for an action that burns fuel, the
/// fuel the player chose.
/// </summary>
public sealed record ActiveAction(string ActionId, TimeSpan Progress, string? FuelItemId = null);
