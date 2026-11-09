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
            Buildings = ["campfire"],
        };

        var restored = StateDocument.Deserialize(StateDocument.From(state).Serialize()).ToState();

        Assert.Equal(7, restored.ItemCount("perch"));
        Assert.Equal(84, restored.XpOf("fishing"));
        Assert.Equal(state.ActiveAction, restored.ActiveAction);
        Assert.Equal(3, restored.FireCyclesLeft);
        Assert.Equal(["campfire"], restored.Buildings);
    }

    [Fact]
    public void Serialize_WritesAVersionedCamelCaseDocument()
    {
        var json = StateDocument.From(GameState.New).Serialize();

        Assert.Equal("""{"schemaVersion":3,"inventory":{},"skillXp":{},"activeAction":null,"fireCyclesLeft":0,"buildings":[]}""", json);
    }

    [Fact]
    public void Deserialize_UnknownSchemaVersion_Throws()
    {
        Assert.Throws<InvalidOperationException>(
            () => StateDocument.Deserialize("""{"schemaVersion":99,"inventory":{},"skillXp":{},"activeAction":null}"""));
    }

    [Fact]
    public void Deserialize_Version1Save_UpgradesToAnEmptyFireAndNoFuel()
    {
        const string json = """
            {"schemaVersion":1,"inventory":{"reed":3},"skillXp":{"foraging":24},"activeAction":{"actionId":"pull-reeds","progressTicks":10000000}}
            """;

        var document = StateDocument.Deserialize(json);
        var state = document.ToState();

        Assert.Equal(StateDocument.CurrentSchemaVersion, document.SchemaVersion);
        Assert.Equal(0, state.FireCyclesLeft);
        Assert.Null(state.ActiveAction!.FuelItemId);
        Assert.Equal(3, state.ItemCount("reed"));
    }

    [Fact]
    public void Deserialize_Version2Save_UpgradesToNothingBuilt()
    {
        const string json = """
            {"schemaVersion":2,"inventory":{"twig":4},"skillXp":{},"activeAction":null,"fireCyclesLeft":1}
            """;

        var document = StateDocument.Deserialize(json);
        var state = document.ToState();

        Assert.Equal(StateDocument.CurrentSchemaVersion, document.SchemaVersion);
        Assert.Empty(state.Buildings);
        Assert.Equal(1, state.FireCyclesLeft);
        Assert.Equal(4, state.ItemCount("twig"));
    }
}
