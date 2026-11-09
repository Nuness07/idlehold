using System.Collections.Immutable;
using System.Text.Json;
using IdleHold.Engine.State;

namespace IdleHold.Api.Persistence;

/// <summary>
/// The saved shape of a <see cref="GameState"/>. It is kept separate from the engine type so the
/// engine can change internally without breaking saves already in the database; when the shape
/// itself has to change, <see cref="SchemaVersion"/> tells old saves apart and <see cref="Deserialize"/> upgrades
/// each older version it still reads.
/// <list type="bullet">
/// <item>Version 1: stores, XP and the active action.</item>
/// <item>Version 2: adds the fire (<see cref="FireCyclesLeft"/>) and the active action's chosen fuel.</item>
/// <item>Version 3: adds the village's buildings (<see cref="Buildings"/>).</item>
/// </list>
/// </summary>
public sealed record StateDocument(
    int SchemaVersion,
    Dictionary<string, long> Inventory,
    Dictionary<string, long> SkillXp,
    ActiveActionDocument? ActiveAction,
    long FireCyclesLeft = 0,
    List<string>? Buildings = null)
{
    public const int CurrentSchemaVersion = 3;

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public static StateDocument From(GameState state) => new(
        CurrentSchemaVersion,
        new Dictionary<string, long>(state.Inventory),
        new Dictionary<string, long>(state.SkillXp),
        state.ActiveAction is { } active
            ? new ActiveActionDocument(active.ActionId, active.Progress.Ticks, active.FuelItemId)
            : null,
        state.FireCyclesLeft,
        state.Buildings.Order(StringComparer.Ordinal).ToList());

    public GameState ToState() => new()
    {
        Inventory = Inventory.ToImmutableDictionary(),
        SkillXp = SkillXp.ToImmutableDictionary(),
        ActiveAction = ActiveAction is { } active
            ? new ActiveAction(active.ActionId, TimeSpan.FromTicks(active.ProgressTicks), active.FuelItemId)
            : null,
        FireCyclesLeft = FireCyclesLeft,
        Buildings = (Buildings ?? []).ToImmutableHashSet(),
    };

    public string Serialize() => JsonSerializer.Serialize(this, Json);

    public static StateDocument Deserialize(string json)
    {
        var document = JsonSerializer.Deserialize<StateDocument>(json, Json)
            ?? throw new InvalidOperationException("A saved game state was empty.");

        return document.SchemaVersion switch
        {
            CurrentSchemaVersion => document,
            2 => FromVersion2(document),
            1 => FromVersion2(FromVersion1(document)),
            _ => throw new InvalidOperationException(
                $"Saved state schema {document.SchemaVersion} is not supported (expected {CurrentSchemaVersion})."),
        };
    }

    /// <summary>A version 1 save predates the fire: it has no fuel in the fire and no fuel chosen.</summary>
    private static StateDocument FromVersion1(StateDocument document) => document with
    {
        SchemaVersion = 2,
        ActiveAction = document.ActiveAction is { } active ? active with { FuelItemId = null } : null,
        FireCyclesLeft = 0,
    };

    /// <summary>A version 2 save predates the village's buildings: nothing is built, so the campfire starts out.</summary>
    private static StateDocument FromVersion2(StateDocument document) => document with
    {
        SchemaVersion = CurrentSchemaVersion,
        Buildings = [],
    };
}

/// <summary>Progress is stored in ticks so no fraction of a cycle is lost between saves.</summary>
public sealed record ActiveActionDocument(string ActionId, long ProgressTicks, string? FuelItemId = null);
