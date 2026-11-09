using System.Collections.Immutable;
using IdleHold.Engine.Content;
using IdleHold.Engine.State;

namespace IdleHold.Engine.Tests;

public class TradeLockTests
{
    // The axe serves Woodcutting, so Woodcutting is locked until one is owned. Mining has no tool and stays open.
    private static readonly GameContent Content = new(
    TestSkills.All,
    [
        new ActionDefinition("chop", "woodcutting", TimeSpan.FromSeconds(3), XpPerCompletion: 10, OutputItemId: "log"),
        new ActionDefinition("mine", "mining", TimeSpan.FromSeconds(4), XpPerCompletion: 7, OutputItemId: "ore"),
        new ActionDefinition("craft-axe", "crafting", TimeSpan.FromSeconds(5), XpPerCompletion: 20, OutputItemId: "axe")
        {
            Inputs = [new ItemAmount("ore", 2)],
        },
        new ActionDefinition("craft-good-axe", "crafting", TimeSpan.FromSeconds(10), XpPerCompletion: 40, OutputItemId: "good-axe")
        {
            Inputs = [new ItemAmount("axe", 1), new ItemAmount("log", 2)],
        },
    ],
    [
        new ToolDefinition("axe", Family: "axe", Tier: 1, SkillId: "woodcutting"),
        new ToolDefinition("good-axe", Family: "axe", Tier: 2, SkillId: "woodcutting"),
    ]);

    private readonly GameEngine _engine = new(Content);

    private static GameState With(params (string ItemId, long Count)[] items) => GameState.New with
    {
        Inventory = items.ToImmutableDictionary(item => item.ItemId, item => item.Count),
    };

    [Fact]
    public void MissingToolFor_TradeWithoutItsTool_IsTheFirstTier()
    {
        Assert.Equal("axe", _engine.MissingToolFor(GameState.New, "woodcutting"));
    }

    [Theory]
    [InlineData("axe")]
    [InlineData("good-axe")]
    public void MissingToolFor_AnyTierOwned_OpensTheTrade(string toolItemId)
    {
        Assert.Null(_engine.MissingToolFor(With((toolItemId, 1)), "woodcutting"));
    }

    [Theory]
    [InlineData("mining")]
    [InlineData("crafting")]
    public void MissingToolFor_TradeNoToolServes_IsOpen(string skillId)
    {
        Assert.Null(_engine.MissingToolFor(GameState.New, skillId));
    }

    [Fact]
    public void LockedTradesOf_ListsLockedTradesWithTheirTool()
    {
        Assert.Equal([new TradeLock("woodcutting", "axe", null)], _engine.LockedTradesOf(GameState.New));
        Assert.Empty(_engine.LockedTradesOf(With(("axe", 1))));
    }

    [Fact]
    public void CheckStart_LockedTrade_IsMissingTool()
    {
        Assert.Equal(ActionBlock.MissingTool, _engine.CheckStart(GameState.New, "chop"));
        Assert.Throws<InvalidOperationException>(() => _engine.StartAction(GameState.New, "chop"));
    }

    [Fact]
    public void CheckStart_WithTheTool_Starts()
    {
        Assert.Null(_engine.CheckStart(With(("axe", 1)), "chop"));
    }

    [Fact]
    public void CheckStart_ToolRecipe_StaysOpenInItsOwnTrade()
    {
        // Crafting has no tool, so the recipe that opens Woodcutting can always start.
        Assert.Null(_engine.CheckStart(With(("ore", 2)), "craft-axe"));
    }

    [Fact]
    public void Tick_ActionOfALockedTrade_DoesNothingAndStops()
    {
        // A save from before the lock can still be working the trade; it gets nothing and the action ends.
        var state = GameState.New with { ActiveAction = new ActiveAction("chop", TimeSpan.FromSeconds(2)) };

        var result = _engine.Tick(state, TimeSpan.FromHours(1));

        Assert.Null(result.ActiveAction);
        Assert.Equal(0, result.ItemCount("log"));
        Assert.Equal(0, result.XpOf("woodcutting"));
    }

    [Fact]
    public void Tick_UpgradingTheTool_KeepsTheTradeOpen()
    {
        // The upgrade consumes the old axe and makes the new one in the same completion.
        var state = _engine.StartAction(With(("axe", 1), ("log", 2)), "craft-good-axe");

        var result = _engine.Tick(state, TimeSpan.FromSeconds(10));

        Assert.Equal(1, result.ItemCount("good-axe"));
        Assert.Null(_engine.MissingToolFor(result, "woodcutting"));
    }
}
