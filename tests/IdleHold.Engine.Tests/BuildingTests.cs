using System.Collections.Immutable;
using IdleHold.Engine.Content;
using IdleHold.Engine.State;

namespace IdleHold.Engine.Tests;

public class BuildingTests
{
    // The fire costs 3 sticks and 2 stones; cooking waits for it.
    private static readonly SkillDefinition[] Skills =
    [
        new("gathering", SkillCategory.Gathering),
        new("cooking", SkillCategory.Production) { RequiredBuildingId = "fire" },
    ];

    private static readonly GameContent Content = new(
        Skills,
        [
            new ActionDefinition("pick-stick", "gathering", TimeSpan.FromSeconds(1), 1, "stick"),
            new ActionDefinition("pick-stone", "gathering", TimeSpan.FromSeconds(1), 1, "stone"),
            new ActionDefinition("roast", "cooking", TimeSpan.FromSeconds(2), 5, "roast") { Inputs = [new ItemAmount("stick", 1)] },
        ],
        buildings: [new BuildingDefinition("fire", [new ItemAmount("stick", 3), new ItemAmount("stone", 2)])]);

    private readonly GameEngine _engine = new(Content);

    private static GameState With(params (string ItemId, long Count)[] items) => GameState.New with
    {
        Inventory = items.ToImmutableDictionary(item => item.ItemId, item => item.Count),
    };

    [Fact]
    public void Build_TakesTheCostAndAddsTheBuilding()
    {
        var built = _engine.Build(With(("stick", 5), ("stone", 2)), "fire");

        Assert.Contains("fire", built.Buildings);
        Assert.Equal(2, built.ItemCount("stick"));
        Assert.False(built.Inventory.ContainsKey("stone"));
    }

    [Fact]
    public void CheckBuild_WithoutTheWholeCost_IsRefused()
    {
        Assert.Equal(BuildBlock.MissingInputs, _engine.CheckBuild(With(("stick", 3), ("stone", 1)), "fire"));
    }

    [Fact]
    public void CheckBuild_TwiceIsRefused()
    {
        var built = _engine.Build(With(("stick", 6), ("stone", 4)), "fire");

        Assert.Equal(BuildBlock.AlreadyBuilt, _engine.CheckBuild(built, "fire"));
        Assert.Throws<InvalidOperationException>(() => _engine.Build(built, "fire"));
    }

    [Fact]
    public void CheckBuild_UnknownBuilding_Throws()
    {
        Assert.Throws<ArgumentException>(() => _engine.CheckBuild(GameState.New, "tower"));
    }

    [Fact]
    public void Build_KeepsTheWorkedActionGoing()
    {
        var working = _engine.StartAction(With(("stick", 3), ("stone", 2)), "pick-stick");

        var built = _engine.Build(working, "fire");

        Assert.Equal(working.ActiveAction, built.ActiveAction);
    }

    [Fact]
    public void ATradeThatWaitsForABuilding_IsLockedUntilItIsBuilt()
    {
        var stores = With(("stick", 10), ("stone", 2));

        Assert.Equal([new TradeLock("cooking", null, "fire")], _engine.LockedTradesOf(stores));
        Assert.Equal(ActionBlock.MissingBuilding, _engine.CheckStart(stores, "roast"));

        var built = _engine.Build(stores, "fire");

        Assert.Empty(_engine.LockedTradesOf(built));
        Assert.Null(_engine.CheckStart(built, "roast"));
    }

    [Fact]
    public void ASaveWorkingALockedTrade_DoesNoWork()
    {
        // Only a save from before the lock can get here: starting is refused.
        var state = With(("stick", 10)) with { ActiveAction = new ActiveAction("roast", TimeSpan.Zero) };

        var after = _engine.Tick(state, TimeSpan.FromMinutes(1));

        Assert.False(after.Inventory.ContainsKey("roast"));
        Assert.Equal(10, after.ItemCount("stick"));
    }

    [Fact]
    public void Constructor_SkillWaitingForAnUnknownBuilding_Throws()
    {
        Assert.Throws<ArgumentException>(() => new GameContent(Skills, []));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Constructor_BuildingWithANonPositiveCost_Throws(long quantity)
    {
        Assert.Throws<ArgumentException>(() => new GameContent(
            TestSkills.All,
            [new ActionDefinition("chop", "woodcutting", TimeSpan.FromSeconds(1), 1, "log")],
            buildings: [new BuildingDefinition("hut", [new ItemAmount("log", quantity)])]));
    }

    [Fact]
    public void Constructor_BuildingCostingAnUnknownItem_Throws()
    {
        Assert.Throws<ArgumentException>(() => new GameContent(
            TestSkills.All,
            [],
            buildings: [new BuildingDefinition("hut", [new ItemAmount("log", 1)])]));
    }

    [Fact]
    public void DefaultContent_TheCampfireIsLitFromForagingAndOpensCooking()
    {
        var content = DefaultContent.Create();
        var campfire = content.FindBuilding("campfire")!;

        Assert.Equal(
            [new ItemAmount("twig", 10), new ItemAmount("reed", 5), new ItemAmount("pebble", 8)],
            campfire.Cost);
        Assert.All(campfire.Cost, item => Assert.Equal("foraging", content.FindRecipeFor(item.ItemId)!.SkillId));
        Assert.Equal("campfire", content.Skills.Single(skill => skill.Id == "cooking").RequiredBuildingId);
    }
}
