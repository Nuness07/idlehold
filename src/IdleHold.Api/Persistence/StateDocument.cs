using System.Collections.Immutable;
using System.Text.Json;
using IdleHold.Engine.State;

namespace IdleHold.Api.Persistence;

/// <summary>
/// The saved shape of a <see cref="GameState"/>. It is kept separate from the engine type so the
/// engine can change internally without breaking saves already in the database; when the shape
/// itself has to change, <see cref="SchemaVersion"/> tells old saves apart.
/// </summary>
public sealed record StateDocument(
    int SchemaVersion,
    Dictionary<string, long> Inventory,
    Dictionary<string, long> SkillXp,
    ActiveActionDocument? ActiveAction)
{
    public const int CurrentSchemaVersion = 1;

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public static StateDocument From(GameState state) => new(
        CurrentSchemaVersion,
        new Dictionary<string, long>(state.Inventory),
        new Dictionary<string, long>(state.SkillXp),
        state.ActiveAction is { } active
            ? new ActiveActionDocument(active.ActionId, active.Progress.Ticks)
            : null);

    public GameState ToState() => new()
    {
        Inventory = Inventory.ToImmutableDictionary(),
        SkillXp = SkillXp.ToImmutableDictionary(),
        ActiveAction = ActiveAction is { } active
            ? new ActiveAction(active.ActionId, TimeSpan.FromTicks(active.ProgressTicks))
            : null,
    };

    public string Serialize() => JsonSerializer.Serialize(this, Json);

    public static StateDocument Deserialize(string json)
    {
        var document = JsonSerializer.Deserialize<StateDocument>(json, Json)
            ?? throw new InvalidOperationException("A saved game state was empty.");

        if (document.SchemaVersion != CurrentSchemaVersion)
        {
            throw new InvalidOperationException(
                $"Saved state schema {document.SchemaVersion} is not supported (expected {CurrentSchemaVersion}).");
        }

        return document;
    }
}

/// <summary>Progress is stored in ticks so no fraction of a cycle is lost between saves.</summary>
public sealed record ActiveActionDocument(string ActionId, long ProgressTicks);
