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
            ActiveAction = new ActiveAction("cook-grilled-berries", TimeSpan.FromTicks(1), "pine-log"),
            FireCyclesLeft = 3,
        };

        var restored = StateDocument.Deserialize(StateDocument.From(state).Serialize()).ToState();

        Assert.Equal(7, restored.ItemCount("perch"));
        Assert.Equal(84, restored.XpOf("fishing"));
        Assert.Equal(state.ActiveAction, restored.ActiveAction);
        Assert.Equal(3, restored.FireCyclesLeft);
    }

    [Fact]
    public void Serialize_WritesAVersionedCamelCaseDocument()
    {
        var json = StateDocument.From(GameState.New).Serialize();

        Assert.Equal("""{"schemaVersion":1,"inventory":{},"skillXp":{},"activeAction":null,"fireCyclesLeft":0}""", json);
    }

    [Fact]
    public void Deserialize_UnknownSchemaVersion_Throws()
    {
        Assert.Throws<InvalidOperationException>(
            () => StateDocument.Deserialize("""{"schemaVersion":99,"inventory":{},"skillXp":{},"activeAction":null}"""));
    }

    [Fact]
    public void Deserialize_ASaveFromBeforeTheFire_ReadsAnEmptyFireAndNoFuel()
    {
        const string json = """
            {"schemaVersion":1,"inventory":{"reed":3},"skillXp":{"foraging":24},"activeAction":{"actionId":"pull-reeds","progressTicks":10000000}}
            """;

        var state = StateDocument.Deserialize(json).ToState();

        Assert.Equal(0, state.FireCyclesLeft);
        Assert.Null(state.ActiveAction!.FuelItemId);
        Assert.Equal(3, state.ItemCount("reed"));
    }
}
