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
    /// <summary>
    /// Why an action cannot start right now, or <c>null</c> if it can. Throws for an unknown action:
    /// that is a bad request, not a game situation.
    /// </summary>
    public ActionBlock? CheckStart(GameState state, string actionId)
    {
        var action = content.FindAction(actionId)
            ?? throw new ArgumentException($"Unknown action '{actionId}'.", nameof(actionId));

        if (content.FindTool(action.OutputItemId) is { } tool && ToolTierOf(state, tool.Family) >= tool.Tier)
        {
            return ActionBlock.ToolAlreadyOwned;
        }

        if (action.Inputs.Any(input => state.ItemCount(input.ItemId) < input.Quantity))
        {
            return ActionBlock.MissingInputs;
        }

        return null;
    }

    public GameState StartAction(GameState state, string actionId)
    {
        // Restarting the action you are already doing should not throw away its progress.
        if (state.ActiveAction?.ActionId == actionId && content.FindAction(actionId) is not null)
        {
            return state;
        }

        if (CheckStart(state, actionId) is { } block)
        {
            throw new InvalidOperationException($"Action '{actionId}' cannot start: {block}.");
        }

        return state with { ActiveAction = new ActiveAction(actionId, TimeSpan.Zero) };
    }

    public GameState StopAction(GameState state) => state with { ActiveAction = null };

    /// <summary>
    /// The tier of the best tool of <paramref name="family"/> the player owns, or 0 with bare hands.
    /// Derived from the stores, so it can never get out of sync with what the player has.
    /// </summary>
    public int ToolTierOf(GameState state, string family) =>
        state.Inventory
            .Where(item => item.Value > 0)
            .Select(item => content.FindTool(item.Key))
            .Where(tool => tool?.Family == family)
            .Select(tool => tool!.Tier)
            .DefaultIfEmpty(0)
            .Max();

    /// <summary>
    /// Advances the game by <paramref name="elapsed"/>. Runs in constant time no matter how long
    /// the period is: completions are computed with division instead of a loop. When the stores
    /// can only pay for fewer completions than the time allows (inputs run out, or the tool is made),
    /// the action completes those and stops.
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

        GameState next;
        if (CompletionLimit(state, action) is { } limit && completions >= limit)
        {
            // The next cycle could not be paid for, so the action ends here and its partial progress goes.
            completions = limit;
            next = state with { ActiveAction = null };
        }
        else
        {
            next = state with { ActiveAction = active with { Progress = TimeSpan.FromTicks(totalTicks % action.Duration.Ticks) } };
        }

        if (completions == 0)
        {
            return next;
        }

        var inventory = AddTo(next.Inventory, action.OutputItemId, completions * action.OutputQuantity);
        foreach (var input in action.Inputs)
        {
            inventory = AddTo(inventory, input.ItemId, -completions * input.Quantity);
        }

        return next with
        {
            Inventory = inventory,
            SkillXp = AddTo(next.SkillXp, action.SkillId, completions * action.XpPerCompletion),
        };
    }

    /// <summary>How many more completions the player can pay for, or <c>null</c> when nothing limits them.</summary>
    private long? CompletionLimit(GameState state, ActionDefinition action)
    {
        long? limit = null;

        if (content.FindTool(action.OutputItemId) is { } tool)
        {
            limit = ToolTierOf(state, tool.Family) >= tool.Tier ? 0 : 1;
        }

        foreach (var input in action.Inputs)
        {
            var affordable = state.ItemCount(input.ItemId) / input.Quantity;
            limit = limit is { } current ? Math.Min(current, affordable) : affordable;
        }

        return limit;
    }

    /// <summary>Adds (or, with a negative amount, removes) and drops entries that reach zero.</summary>
    private static ImmutableDictionary<string, long> AddTo(ImmutableDictionary<string, long> totals, string key, long amount)
    {
        var total = totals.GetValueOrDefault(key) + amount;
        return total == 0 ? totals.Remove(key) : totals.SetItem(key, total);
    }
}

/// <summary>Why an action cannot start.</summary>
public enum ActionBlock
{
    /// <summary>The stores do not hold enough of every input for one completion.</summary>
    MissingInputs,

    /// <summary>The action makes a tool, and the player already owns that tier or a better one.</summary>
    ToolAlreadyOwned,
}
