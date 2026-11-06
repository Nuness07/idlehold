using System.Collections.Immutable;
using IdleHold.Api.Persistence;
using IdleHold.Engine.State;

namespace IdleHold.Api.Tests;

public class StateDocumentTests
{
    [Fact]
    public void SerializeThenDeserialize_KeepsEveryField()
    {
        var state = GameState.New with
        {
            Inventory = ImmutableDictionary<string, long>.Empty.Add("perch", 7),
            SkillXp = ImmutableDictionary<string, long>.Empty.Add("fishing", 84),
            ActiveAction = new ActiveAction("catch-perch", TimeSpan.FromTicks(1)),
        };

        var restored = StateDocument.Deserialize(StateDocument.From(state).Serialize()).ToState();

        Assert.Equal(7, restored.ItemCount("perch"));
        Assert.Equal(84, restored.XpOf("fishing"));
        Assert.Equal(state.ActiveAction, restored.ActiveAction);
    }

    [Fact]
    public void Serialize_WritesAVersionedCamelCaseDocument()
    {
        var json = StateDocument.From(GameState.New).Serialize();

        Assert.Equal("""{"schemaVersion":1,"inventory":{},"skillXp":{},"activeAction":null}""", json);
    }

    [Fact]
    public void Deserialize_UnknownSchemaVersion_Throws()
    {
        Assert.Throws<InvalidOperationException>(
            () => StateDocument.Deserialize("""{"schemaVersion":99,"inventory":{},"skillXp":{},"activeAction":null}"""));
    }
}
