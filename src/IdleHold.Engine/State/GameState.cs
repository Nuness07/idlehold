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

    public long ItemCount(string itemId) => Inventory.GetValueOrDefault(itemId);

    public long XpOf(string skillId) => SkillXp.GetValueOrDefault(skillId);

    public int LevelOf(string skillId) => Experience.LevelFor(XpOf(skillId));
}

/// <summary>The action currently running and how far into the current cycle it is.</summary>
public sealed record ActiveAction(string ActionId, TimeSpan Progress);
