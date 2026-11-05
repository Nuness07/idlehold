using System.Collections.Immutable;
using IdleHold.Engine.Content;
using IdleHold.Engine.State;

namespace IdleHold.Engine;

/// <summary>
/// The game rules. Every method is a pure function: same input, same output, no side effects.
/// That lets the server replay any amount of elapsed time (including hours offline)
/// and makes the rules trivial to test.
/// </summary>
public sealed class GameEngine(GameContent content)
{
    public GameState StartAction(GameState state, string actionId)
    {
        if (content.FindAction(actionId) is null)
        {
            throw new ArgumentException($"Unknown action '{actionId}'.", nameof(actionId));
        }

        // Restarting the action you are already doing should not throw away its progress.
        if (state.ActiveAction?.ActionId == actionId)
        {
            return state;
        }

        return state with { ActiveAction = new ActiveAction(actionId, TimeSpan.Zero) };
    }

    public GameState StopAction(GameState state) => state with { ActiveAction = null };

    /// <summary>
    /// Advances the game by <paramref name="elapsed"/>. Runs in constant time no matter how long
    /// the period is: completions are computed with division instead of a loop.
    /// </summary>
    public GameState Tick(GameState state, TimeSpan elapsed)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(elapsed, TimeSpan.Zero);

        if (state.ActiveAction is not { } active || elapsed == TimeSpan.Zero)
        {
            return state;
        }

        var action = content.GetAction(active.ActionId);
        var totalTicks = active.Progress.Ticks + elapsed.Ticks;
        var completions = totalTicks / action.Duration.Ticks;
        var remainder = TimeSpan.FromTicks(totalTicks % action.Duration.Ticks);

        var next = state with { ActiveAction = active with { Progress = remainder } };
        if (completions == 0)
        {
            return next;
        }

        return next with
        {
            Inventory = AddTo(next.Inventory, action.OutputItemId, completions * action.OutputQuantity),
            SkillXp = AddTo(next.SkillXp, action.SkillId, completions * action.XpPerCompletion),
        };
    }

    private static ImmutableDictionary<string, long> AddTo(ImmutableDictionary<string, long> totals, string key, long amount) =>
        totals.SetItem(key, totals.GetValueOrDefault(key) + amount);
}
