using System.Collections.Immutable;
using IdleHold.Engine.Content;
using IdleHold.Engine.State;

namespace IdleHold.Engine.Tests;

public class RecipeTests
{
    // "plank" is a repeatable recipe; the two axes are tools of one family, so each is made once.
    private static readonly GameContent Content = new(
    [
        new ActionDefinition("chop", "woodcutting", TimeSpan.FromSeconds(3), XpPerCompletion: 10, OutputItemId: "log"),
        new ActionDefinition("saw-plank", "crafting", TimeSpan.FromSeconds(5), XpPerCompletion: 4, OutputItemId: "plank", OutputQuantity: 2)
        {
            Inputs = [new ItemAmount("log", 3)],
        },
        new ActionDefinition("craft-axe", "crafting", TimeSpan.FromSeconds(30), XpPerCompletion: 40, OutputItemId: "axe")
        {
            Inputs = [new ItemAmount("twig", 3), new ItemAmount("pebble", 2)],
        },
        new ActionDefinition("craft-good-axe", "crafting", TimeSpan.FromSeconds(60), XpPerCompletion: 90, OutputItemId: "good-axe")
        {
            Inputs = [new ItemAmount("axe", 1), new ItemAmount("log", 4)],
        },
    ],
    [
        new ToolDefinition("axe", Family: "axe", Tier: 1),
        new ToolDefinition("good-axe", Family: "axe", Tier: 2),
    ]);

    private readonly GameEngine _engine = new(Content);

    private static GameState With(params (string ItemId, long Count)[] items) => GameState.New with
    {
        Inventory = items.ToImmutableDictionary(item => item.ItemId, item => item.Count),
    };

    [Fact]
    public void Tick_ConsumesInputsForEveryCompletion()
    {
        var state = _engine.StartAction(With(("log", 30)), "saw-plank");

        var result = _engine.Tick(state, TimeSpan.FromSeconds(12));

        Assert.Equal(24, result.ItemCount("log"));
        Assert.Equal(4, result.ItemCount("plank"));
        Assert.Equal(8, result.XpOf("crafting"));
        Assert.Equal(TimeSpan.FromSeconds(2), result.ActiveAction!.Progress);
    }

    [Fact]
    public void Tick_InputsRunOutWhileAway_CompletesWhatTheyPayForAndStops()
    {
        // 10 logs pay for 3 planks; 8 hours would allow thousands.
        var state = _engine.StartAction(With(("log", 10)), "saw-plank");

        var result = _engine.Tick(state, TimeSpan.FromHours(8));

        Assert.Equal(1, result.ItemCount("log"));
        Assert.Equal(6, result.ItemCount("plank"));
        Assert.Equal(12, result.XpOf("crafting"));
        Assert.Null(result.ActiveAction);
    }

    [Fact]
    public void Tick_UsingTheLastInputs_StopsAtThatCompletion()
    {
        var state = _engine.StartAction(With(("log", 6)), "saw-plank");

        var result = _engine.Tick(state, TimeSpan.FromSeconds(10));

        Assert.Equal(4, result.ItemCount("plank"));
        Assert.False(result.Inventory.ContainsKey("log"));
        Assert.Null(result.ActiveAction);
    }

    [Fact]
    public void Tick_ManySmallTicks_MatchOneBigTickWhenInputsRunOut()
    {
        var start = _engine.StartAction(With(("log", 10)), "saw-plank");

        var stepped = start;
        for (var second = 0; second < 30; second++)
        {
            stepped = _engine.Tick(stepped, TimeSpan.FromSeconds(1));
        }

        var single = _engine.Tick(start, TimeSpan.FromSeconds(30));

        Assert.Equal(single.Inventory, stepped.Inventory);
        Assert.Equal(single.XpOf("crafting"), stepped.XpOf("crafting"));
        Assert.Equal(single.ActiveAction, stepped.ActiveAction);
    }

    [Fact]
    public void CheckStart_WithoutEnoughInputs_ReportsMissingInputs()
    {
        var state = With(("twig", 3), ("pebble", 1));

        Assert.Equal(ActionBlock.MissingInputs, _engine.CheckStart(state, "craft-axe"));
        Assert.Throws<InvalidOperationException>(() => _engine.StartAction(state, "craft-axe"));
    }

    [Fact]
    public void CheckStart_GatheringAction_IsAlwaysAllowed()
    {
        Assert.Null(_engine.CheckStart(GameState.New, "chop"));
    }

    [Fact]
    public void CheckStart_UnknownAction_Throws()
    {
        Assert.Throws<ArgumentException>(() => _engine.CheckStart(GameState.New, "fly"));
    }

    [Fact]
    public void Tool_IsMadeOnceThenTheActionStops()
    {
        // Enough materials for three axes, but a tool is unique.
        var state = _engine.StartAction(With(("twig", 9), ("pebble", 6)), "craft-axe");

        var result = _engine.Tick(state, TimeSpan.FromMinutes(10));

        Assert.Equal(1, result.ItemCount("axe"));
        Assert.Equal(6, result.ItemCount("twig"));
        Assert.Equal(4, result.ItemCount("pebble"));
        Assert.Equal(40, result.XpOf("crafting"));
        Assert.Null(result.ActiveAction);
    }

    [Fact]
    public void Tool_AlreadyOwned_CannotBeMadeAgain()
    {
        var state = With(("axe", 1), ("twig", 3), ("pebble", 2));

        Assert.Equal(ActionBlock.ToolAlreadyOwned, _engine.CheckStart(state, "craft-axe"));
    }

    [Fact]
    public void Tool_Upgrade_ConsumesTheOldTierAndRaisesTheFamily()
    {
        var state = _engine.StartAction(With(("axe", 1), ("log", 4)), "craft-good-axe");

        var result = _engine.Tick(state, TimeSpan.FromSeconds(60));

        Assert.False(result.Inventory.ContainsKey("axe"));
        Assert.Equal(1, result.ItemCount("good-axe"));
        Assert.Equal(2, _engine.ToolTierOf(result, "axe"));
        Assert.Null(result.ActiveAction);
    }

    [Fact]
    public void Tool_LowerTierThanOwned_CannotBeMade()
    {
        // After the upgrade the old axe is gone, but making it again would be a step back.
        var state = With(("good-axe", 1), ("twig", 3), ("pebble", 2));

        Assert.Equal(ActionBlock.ToolAlreadyOwned, _engine.CheckStart(state, "craft-axe"));
    }

    [Fact]
    public void ToolTierOf_WithBareHands_IsZero()
    {
        Assert.Equal(0, _engine.ToolTierOf(GameState.New, "axe"));
    }
}
