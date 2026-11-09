using System.Collections.Immutable;
using IdleHold.Engine.Content;
using IdleHold.Engine.State;

namespace IdleHold.Engine.Tests;

public class FuelAndLevelTests
{
    // Grilling takes 1 berry and burns fire; a log lasts 3 grills, a plank 1. The big tree needs level 10.
    private static readonly GameContent Content = new(
    TestSkills.All,
    [
        new ActionDefinition("chop", "woodcutting", TimeSpan.FromSeconds(3), XpPerCompletion: 10, OutputItemId: "log"),
        new ActionDefinition("chop-big", "woodcutting", TimeSpan.FromSeconds(5), XpPerCompletion: 20, OutputItemId: "big-log") { RequiredLevel = 10 },
        new ActionDefinition("saw-plank", "crafting", TimeSpan.FromSeconds(5), XpPerCompletion: 4, OutputItemId: "plank"),
        new ActionDefinition("grill", "crafting", TimeSpan.FromSeconds(2), XpPerCompletion: 5, OutputItemId: "grilled")
        {
            Inputs = [new ItemAmount("berry", 1)],
            UsesFuel = true,
        },
    ],
    fuels: [new FuelDefinition("log", Cycles: 3), new FuelDefinition("plank", Cycles: 1)]);

    private readonly GameEngine _engine = new(Content);

    private static GameState With(params (string ItemId, long Count)[] items) => GameState.New with
    {
        Inventory = items.ToImmutableDictionary(item => item.ItemId, item => item.Count),
    };

    [Fact]
    public void CheckStart_BelowTheActionsLevel_IsRefused()
    {
        Assert.Equal(ActionBlock.LevelTooLow, _engine.CheckStart(GameState.New, "chop-big"));
    }

    [Fact]
    public void CheckStart_AtTheActionsLevel_IsAllowed()
    {
        var state = GameState.New with { SkillXp = ImmutableDictionary<string, long>.Empty.Add("woodcutting", Experience.XpForLevel(10)) };

        Assert.Null(_engine.CheckStart(state, "chop-big"));
    }

    [Fact]
    public void Tick_AnActionAboveThePlayersLevel_DoesNothingAndStops()
    {
        // A save from before the level gate.
        var state = GameState.New with { ActiveAction = new ActiveAction("chop-big", TimeSpan.Zero) };

        var result = _engine.Tick(state, TimeSpan.FromMinutes(1));

        Assert.Equal(0, result.ItemCount("big-log"));
        Assert.Null(result.ActiveAction);
    }

    [Fact]
    public void CheckStart_WithoutAnyOfTheChosenFuel_IsRefused()
    {
        Assert.Equal(ActionBlock.MissingFuel, _engine.CheckStart(With(("berry", 5)), "grill", "log"));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("berry")]
    public void CheckStart_AFireActionWithoutARealFuel_Throws(string? fuelItemId)
    {
        Assert.Throws<ArgumentException>(() => _engine.CheckStart(With(("berry", 5), ("log", 1)), "grill", fuelItemId));
    }

    [Fact]
    public void Tick_BurnsOneLogPerThreeGrills_AndKeepsWhatIsLeftInTheFire()
    {
        var state = _engine.StartAction(With(("berry", 10), ("log", 5)), "grill", "log");

        // 4 grills: the first log burns out after 3, the second has 2 left.
        var result = _engine.Tick(state, TimeSpan.FromSeconds(8));

        Assert.Equal(4, result.ItemCount("grilled"));
        Assert.Equal(3, result.ItemCount("log"));
        Assert.Equal(2, result.FireCyclesLeft);
        Assert.NotNull(result.ActiveAction);
    }

    [Fact]
    public void Tick_StopsWhenTheFuelRunsOut()
    {
        var state = _engine.StartAction(With(("berry", 10), ("log", 1)), "grill", "log");

        var result = _engine.Tick(state, TimeSpan.FromHours(1));

        Assert.Equal(3, result.ItemCount("grilled"));
        Assert.Equal(0, result.ItemCount("log"));
        Assert.Equal(0, result.FireCyclesLeft);
        Assert.Null(result.ActiveAction);
    }

    [Fact]
    public void Tick_StopsWhenTheIngredientsRunOut_AndTheFireWaits()
    {
        var state = _engine.StartAction(With(("berry", 2), ("log", 4)), "grill", "log");

        var result = _engine.Tick(state, TimeSpan.FromHours(1));

        Assert.Equal(2, result.ItemCount("grilled"));
        Assert.Equal(3, result.ItemCount("log"));
        Assert.Equal(1, result.FireCyclesLeft);
        Assert.Null(result.ActiveAction);
    }

    [Fact]
    public void Tick_BurnsWhatIsInTheFireBeforeTakingAnotherFuel()
    {
        // 2 cycles of a log are left in the fire; the player now feeds it planks.
        var state = _engine.StartAction(With(("berry", 10), ("plank", 3)) with { FireCyclesLeft = 2 }, "grill", "plank");

        var result = _engine.Tick(state, TimeSpan.FromHours(1));

        Assert.Equal(5, result.ItemCount("grilled"));
        Assert.Equal(0, result.ItemCount("plank"));
        Assert.Equal(0, result.FireCyclesLeft);
    }

    [Fact]
    public void CheckStart_TheFireAloneIsEnoughFuel()
    {
        var state = With(("berry", 1)) with { FireCyclesLeft = 1 };

        Assert.Null(_engine.CheckStart(state, "grill", "log"));
    }

    [Fact]
    public void StartAction_ChangingOnlyTheFuel_KeepsTheCycleGoing()
    {
        var state = _engine.Tick(_engine.StartAction(With(("berry", 10), ("log", 5), ("plank", 5)), "grill", "log"), TimeSpan.FromSeconds(1));

        var result = _engine.StartAction(state, "grill", "plank");

        Assert.Equal(new ActiveAction("grill", TimeSpan.FromSeconds(1), "plank"), result.ActiveAction);
    }

    [Fact]
    public void Tick_AnActionWithoutFuel_LeavesTheFireAlone()
    {
        var state = _engine.StartAction(With() with { FireCyclesLeft = 2 }, "chop");

        var result = _engine.Tick(state, TimeSpan.FromSeconds(30));

        Assert.Equal(2, result.FireCyclesLeft);
        Assert.Null(result.ActiveAction!.FuelItemId);
    }

    [Fact]
    public void Constructor_FuelThatIsNoItem_Throws()
    {
        Assert.Throws<ArgumentException>(() => new GameContent(TestSkills.All, Content.Actions, fuels: [new FuelDefinition("coal", 3)]));
    }

    [Fact]
    public void Constructor_LevelAboveTheMaximum_Throws()
    {
        var action = new ActionDefinition("chop", "woodcutting", TimeSpan.FromSeconds(3), 10, "log") { RequiredLevel = 100 };

        Assert.Throws<ArgumentException>(() => new GameContent(TestSkills.All, [action]));
    }
}
