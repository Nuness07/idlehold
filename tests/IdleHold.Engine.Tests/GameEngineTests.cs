using IdleHold.Engine.Content;
using IdleHold.Engine.State;

namespace IdleHold.Engine.Tests;

public class GameEngineTests
{
    // Test content is separate from DefaultContent so balancing the real game never breaks these tests.
    private static readonly GameContent Content = new(
    [
        new ActionDefinition("chop", "woodcutting", TimeSpan.FromSeconds(3), XpPerCompletion: 10, OutputItemId: "log"),
        new ActionDefinition("mine", "mining", TimeSpan.FromSeconds(4), XpPerCompletion: 7, OutputItemId: "ore", OutputQuantity: 2),
    ]);

    private readonly GameEngine _engine = new(Content);

    private GameState Chopping(TimeSpan? progress = null) =>
        GameState.New with { ActiveAction = new ActiveAction("chop", progress ?? TimeSpan.Zero) };

    [Fact]
    public void Tick_WithNoActiveAction_ReturnsSameState()
    {
        var state = GameState.New;

        var result = _engine.Tick(state, TimeSpan.FromHours(1));

        Assert.Same(state, result);
    }

    [Fact]
    public void Tick_ShorterThanDuration_AccumulatesProgressWithoutRewards()
    {
        var result = _engine.Tick(Chopping(), TimeSpan.FromSeconds(2));

        Assert.Equal(TimeSpan.FromSeconds(2), result.ActiveAction!.Progress);
        Assert.Equal(0, result.ItemCount("log"));
        Assert.Equal(0, result.XpOf("woodcutting"));
    }

    [Fact]
    public void Tick_ExactlyOneDuration_GrantsOneCompletion()
    {
        var result = _engine.Tick(Chopping(), TimeSpan.FromSeconds(3));

        Assert.Equal(1, result.ItemCount("log"));
        Assert.Equal(10, result.XpOf("woodcutting"));
        Assert.Equal(TimeSpan.Zero, result.ActiveAction!.Progress);
    }

    [Fact]
    public void Tick_CarriesLeftoverTimeIntoNextCycle()
    {
        var afterFirst = _engine.Tick(Chopping(), TimeSpan.FromSeconds(2));
        var afterSecond = _engine.Tick(afterFirst, TimeSpan.FromSeconds(2));

        Assert.Equal(1, afterSecond.ItemCount("log"));
        Assert.Equal(TimeSpan.FromSeconds(1), afterSecond.ActiveAction!.Progress);
    }

    [Fact]
    public void Tick_LongOfflinePeriod_GrantsEveryCompletion()
    {
        // 8 hours / 3 seconds = 9600 completions.
        var result = _engine.Tick(Chopping(), TimeSpan.FromHours(8));

        Assert.Equal(9600, result.ItemCount("log"));
        Assert.Equal(96_000, result.XpOf("woodcutting"));
    }

    [Fact]
    public void Tick_AppliesOutputQuantityPerCompletion()
    {
        var mining = _engine.StartAction(GameState.New, "mine");

        var result = _engine.Tick(mining, TimeSpan.FromSeconds(12));

        Assert.Equal(6, result.ItemCount("ore"));
        Assert.Equal(21, result.XpOf("mining"));
    }

    [Theory]
    [InlineData(1)]
    [InlineData(7)]
    [InlineData(250)]
    public void Tick_ManySmallTicks_MatchOneBigTick(int tickMilliseconds)
    {
        var total = TimeSpan.FromMinutes(5);
        var step = TimeSpan.FromMilliseconds(tickMilliseconds);

        var stepped = Chopping();
        var remaining = total;
        while (remaining > TimeSpan.Zero)
        {
            var dt = remaining < step ? remaining : step;
            stepped = _engine.Tick(stepped, dt);
            remaining -= dt;
        }

        var single = _engine.Tick(Chopping(), total);

        Assert.Equal(single.ItemCount("log"), stepped.ItemCount("log"));
        Assert.Equal(single.XpOf("woodcutting"), stepped.XpOf("woodcutting"));
        Assert.Equal(single.ActiveAction, stepped.ActiveAction);
    }

    [Fact]
    public void Tick_DoesNotMutateInputState()
    {
        var original = Chopping();

        _ = _engine.Tick(original, TimeSpan.FromMinutes(1));

        Assert.Equal(0, original.ItemCount("log"));
        Assert.Equal(TimeSpan.Zero, original.ActiveAction!.Progress);
    }

    [Fact]
    public void Tick_NegativeElapsed_Throws()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => _engine.Tick(Chopping(), TimeSpan.FromSeconds(-1)));
    }

    [Fact]
    public void StartAction_UnknownAction_Throws()
    {
        Assert.Throws<ArgumentException>(() => _engine.StartAction(GameState.New, "fly"));
    }

    [Fact]
    public void StartAction_SameAction_KeepsProgress()
    {
        var state = Chopping(TimeSpan.FromSeconds(2));

        var result = _engine.StartAction(state, "chop");

        Assert.Equal(TimeSpan.FromSeconds(2), result.ActiveAction!.Progress);
    }

    [Fact]
    public void StartAction_DifferentAction_ResetsProgress()
    {
        var state = Chopping(TimeSpan.FromSeconds(2));

        var result = _engine.StartAction(state, "mine");

        Assert.Equal(new ActiveAction("mine", TimeSpan.Zero), result.ActiveAction);
    }

    [Fact]
    public void StopAction_ClearsActiveActionAndKeepsRewards()
    {
        var state = _engine.Tick(Chopping(), TimeSpan.FromSeconds(9));

        var result = _engine.StopAction(state);

        Assert.Null(result.ActiveAction);
        Assert.Equal(3, result.ItemCount("log"));
    }
}
