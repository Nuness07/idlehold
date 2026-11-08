using System.Collections.Immutable;
using IdleHold.Engine.Content;
using IdleHold.Engine.State;

namespace IdleHold.Engine.Tests;

public class StorageTests
{
    // A tiny storehouse: 3 slots of up to 10 of one item each.
    private static readonly GameContent Content = new(
    TestSkills.All,
    [
        new ActionDefinition("chop", "woodcutting", TimeSpan.FromSeconds(3), XpPerCompletion: 10, OutputItemId: "log"),
        new ActionDefinition("mine", "mining", TimeSpan.FromSeconds(4), XpPerCompletion: 7, OutputItemId: "ore", OutputQuantity: 2),
        new ActionDefinition("saw-plank", "crafting", TimeSpan.FromSeconds(5), XpPerCompletion: 4, OutputItemId: "plank", OutputQuantity: 2)
        {
            Inputs = [new ItemAmount("log", 3)],
        },
    ],
    storage: new StorageRules(SlotCount: 3, StackSize: 10));

    private readonly GameEngine _engine = new(Content);

    private static GameState Doing(string actionId, params (string ItemId, long Count)[] items) => GameState.New with
    {
        Inventory = items.ToImmutableDictionary(item => item.ItemId, item => item.Count),
        ActiveAction = new ActiveAction(actionId, TimeSpan.Zero),
    };

    [Fact]
    public void Tick_StopsWhenTheOutputNoLongerFits()
    {
        // Two slots taken, so logs get one slot: 10 of them.
        var state = Doing("chop", ("ore", 10), ("plank", 10));

        var result = _engine.Tick(state, TimeSpan.FromHours(1));

        Assert.Equal(10, result.ItemCount("log"));
        Assert.Equal(100, result.XpOf("woodcutting"));
        Assert.Null(result.ActiveAction);
    }

    [Fact]
    public void Tick_FillsTheItemsOwnStackBeforeNeedingANewSlot()
    {
        var state = Doing("chop", ("ore", 10), ("plank", 10), ("log", 7));

        var result = _engine.Tick(state, TimeSpan.FromHours(1));

        Assert.Equal(10, result.ItemCount("log"));
        Assert.Null(result.ActiveAction);
    }

    [Fact]
    public void Tick_KeepsGoingWhileTheNextCompletionStillFits()
    {
        var state = Doing("chop", ("ore", 10));

        // 15 s = 5 logs; there is room for 20.
        var result = _engine.Tick(state, TimeSpan.FromSeconds(16));

        Assert.Equal(5, result.ItemCount("log"));
        Assert.Equal(TimeSpan.FromSeconds(1), result.ActiveAction!.Progress);
    }

    [Fact]
    public void Tick_StopsRightWhenTheLastSlotFills()
    {
        // Exactly 10 logs fit, and 30 s makes exactly 10: the next one could not be stored.
        var state = Doing("chop", ("ore", 10), ("plank", 10));

        var result = _engine.Tick(state, TimeSpan.FromSeconds(30));

        Assert.Equal(10, result.ItemCount("log"));
        Assert.Null(result.ActiveAction);
    }

    [Fact]
    public void Tick_StoresOnlyWholeCompletions()
    {
        // Mining makes 2 ore at a time; 9 ore leaves room for 1, so no completion fits.
        var state = Doing("mine", ("log", 10), ("plank", 10), ("ore", 29));

        var result = _engine.Tick(state, TimeSpan.FromHours(1));

        Assert.Equal(29, result.ItemCount("ore"));
        Assert.Null(result.ActiveAction);
    }

    [Fact]
    public void Tick_ARecipeCanUseTheSlotItsInputsFree()
    {
        // Full, but sawing takes the last 3 logs out as it puts 2 planks in.
        var state = Doing("saw-plank", ("log", 3), ("ore", 10), ("pebble", 10));

        var result = _engine.Tick(state, TimeSpan.FromSeconds(5));

        Assert.Equal(2, result.ItemCount("plank"));
        Assert.Equal(0, result.ItemCount("log"));
    }

    [Fact]
    public void Tick_OverfullStores_StopTheActionAtOnce()
    {
        var state = Doing("chop", ("ore", 10), ("plank", 10), ("pebble", 10), ("stone", 1));

        var result = _engine.Tick(state, TimeSpan.FromHours(1));

        Assert.Equal(0, result.ItemCount("log"));
        Assert.Null(result.ActiveAction);
    }

    [Fact]
    public void CheckStart_RefusesWhenTheOutputHasNoRoom()
    {
        var state = Doing("chop", ("ore", 10), ("plank", 10), ("pebble", 10)) with { ActiveAction = null };

        Assert.Equal(ActionBlock.StorageFull, _engine.CheckStart(state, "chop"));
    }

    [Fact]
    public void CheckStart_AllowsAStackWithRoomEvenWhenEverySlotIsTaken()
    {
        var state = Doing("chop", ("ore", 10), ("plank", 10), ("log", 9)) with { ActiveAction = null };

        Assert.Null(_engine.CheckStart(state, "chop"));
    }

    [Fact]
    public void StorageOf_SplitsItemsIntoStacksInTheGamesOrder()
    {
        var state = Doing("chop", ("plank", 4), ("log", 25), ("relic", 1)) with { ActiveAction = null };

        var storage = _engine.StorageOf(state);

        Assert.Equal(3, storage.SlotCount);
        Assert.Equal(10, storage.StackSize);
        Assert.Equal(
            [new ItemAmount("log", 10), new ItemAmount("log", 10), new ItemAmount("log", 5), new ItemAmount("plank", 4), new ItemAmount("relic", 1)],
            storage.Slots);
    }

    [Fact]
    public void Tick_WithUnlimitedStorage_NeverStops()
    {
        var engine = new GameEngine(new GameContent(TestSkills.All, Content.Actions));
        var state = Doing("chop", ("ore", 1_000_000));

        var result = engine.Tick(state, TimeSpan.FromDays(30));

        Assert.Equal(864_000, result.ItemCount("log"));
        Assert.NotNull(result.ActiveAction);
    }
}
