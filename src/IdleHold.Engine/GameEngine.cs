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

        if (MissingToolFor(state, action.SkillId) is not null)
        {
            return ActionBlock.MissingTool;
        }

        if (content.FindTool(action.OutputItemId) is { } tool && ToolTierOf(state, tool.Family) >= tool.Tier)
        {
            return ActionBlock.ToolAlreadyOwned;
        }

        if (action.Inputs.Any(input => state.ItemCount(input.ItemId) < input.Quantity))
        {
            return ActionBlock.MissingInputs;
        }

        if (StorageLimit(state, action, upTo: 1) == 0)
        {
            return ActionBlock.StorageFull;
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
    /// The tool that opens <paramref name="skillId"/>, or <c>null</c> when the trade is open. A trade that some tool
    /// family serves stays locked until the player owns a tool of that family; the answer is its first tier, the one
    /// to make. Trades no tool serves (Foraging, Crafting) are always open. Derived from the stores, like the tier.
    /// </summary>
    public string? MissingToolFor(GameState state, string skillId) =>
        content.Tools
            .Where(tool => tool.SkillId == skillId)
            .GroupBy(tool => tool.Family)
            .Where(family => ToolTierOf(state, family.Key) == 0)
            .Select(family => family.MinBy(tool => tool.Tier)!.ItemId)
            .FirstOrDefault();

    /// <summary>The trades the player cannot work yet, in the game's trade order, with the tool that opens each.</summary>
    public IReadOnlyList<TradeLock> LockedTradesOf(GameState state) =>
        content.Skills
            .Select(skill => (skill.Id, Tool: MissingToolFor(state, skill.Id)))
            .Where(trade => trade.Tool is not null)
            .Select(trade => new TradeLock(trade.Id, trade.Tool!))
            .ToList();

    /// <summary>
    /// Every tool family, in catalog order, with the best tool the player owns and the recipe for the
    /// next tier: the lowest tier above the owned one. The next recipe is <c>null</c> once the family is
    /// at its best tool (or a tier has no recipe yet).
    /// </summary>
    public IReadOnlyList<ToolProgress> ToolProgressOf(GameState state) =>
        content.Tools
            .GroupBy(tool => tool.Family)
            .Select(family =>
            {
                var ownedTier = ToolTierOf(state, family.Key);
                var owned = family.FirstOrDefault(tool => tool.Tier == ownedTier);
                var next = family.Where(tool => tool.Tier > ownedTier).MinBy(tool => tool.Tier);
                var recipe = next is null ? null : content.FindRecipeFor(next.ItemId);
                return new ToolProgress(family.Key, owned?.ItemId, recipe?.Id);
            })
            .ToList();

    /// <summary>
    /// How the stores split into slots, in the game's item order: each item fills stacks of the content's stack
    /// size, the last one holding the rest. <see cref="StorageView.SlotCount"/> is how many slots there are.
    /// </summary>
    public StorageView StorageOf(GameState state)
    {
        var rules = content.Storage;
        var position = content.ItemIds.Select((itemId, index) => (itemId, index)).ToDictionary(pair => pair.itemId, pair => pair.index);
        var slots = state.Inventory
            .Where(item => item.Value > 0)
            // An item the content no longer lists still shows, after the known ones.
            .OrderBy(item => position.GetValueOrDefault(item.Key, int.MaxValue))
            .ThenBy(item => item.Key, StringComparer.Ordinal)
            .SelectMany(item => Stacks(item.Key, item.Value, rules.StackSize))
            .ToList();

        return new StorageView(rules.SlotCount, rules.StackSize, slots);
    }

    private static IEnumerable<ItemAmount> Stacks(string itemId, long count, long stackSize)
    {
        for (var left = count; left > 0; left -= stackSize)
        {
            yield return new ItemAmount(itemId, Math.Min(left, stackSize));
        }
    }

    /// <summary>
    /// Advances the game by <paramref name="elapsed"/>. Runs in constant time no matter how long
    /// the period is: completions are computed with division instead of a loop. When the stores
    /// can only pay for or hold fewer completions than the time allows (inputs run out, the tool is
    /// made, or the storehouse fills), the action completes those and stops.
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
        if (CompletionLimit(state, action, completions) is { } limit && completions >= limit)
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

    /// <summary>
    /// How many more completions the player can pay for and store, or <c>null</c> when nothing limits them
    /// before the <paramref name="completions"/> the time allows plus the next one (which decides whether the
    /// action goes on).
    /// </summary>
    private long? CompletionLimit(GameState state, ActionDefinition action, long completions)
    {
        // A locked trade does no work. Starting is refused, so only a save from before the lock gets here.
        if (MissingToolFor(state, action.SkillId) is not null)
        {
            return 0;
        }

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

        var upTo = Math.Min(limit ?? long.MaxValue, completions + 1);
        var storable = StorageLimit(state, action, upTo);
        return storable < upTo ? storable : limit;
    }

    /// <summary>
    /// The most completions, up to <paramref name="upTo"/>, whose results still fit in the storehouse. Each
    /// completion takes its inputs out and puts its output in, so a recipe can free the slot its output needs.
    /// A binary search over the slot count after k completions: constant time for any stretch of time.
    /// </summary>
    private long StorageLimit(GameState state, ActionDefinition action, long upTo)
    {
        var rules = content.Storage;
        if (rules == StorageRules.Unlimited)
        {
            return upTo;
        }

        // Slots taken by everything the action does not touch; the touched items are counted per k below.
        var touched = action.Inputs.Select(input => input.ItemId).Append(action.OutputItemId).ToHashSet();
        var untouched = state.Inventory.Where(item => !touched.Contains(item.Key)).Sum(item => rules.SlotsFor(item.Value));

        bool Fits(long k)
        {
            var slots = untouched + rules.SlotsFor(state.ItemCount(action.OutputItemId) + k * action.OutputQuantity);
            foreach (var input in action.Inputs)
            {
                slots += rules.SlotsFor(state.ItemCount(input.ItemId) - k * input.Quantity);
            }

            return slots <= rules.SlotCount;
        }

        // The search assumes the slot count never falls and then rises again as k grows. That holds for gathering
        // (it only adds) and for today's recipes, which each make a tool once. A recipe that frees slots of its
        // inputs while it fills its output's could stop a completion early or late; revisit with the first one.
        if (!Fits(0))
        {
            return 0;
        }

        long low = 0, high = upTo;
        while (low < high)
        {
            var mid = low + (high - low + 1) / 2;
            if (Fits(mid))
            {
                low = mid;
            }
            else
            {
                high = mid - 1;
            }
        }

        return low;
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
    /// <summary>The action's trade is locked: the player owns no tool of the family that serves it.</summary>
    MissingTool,

    /// <summary>The stores do not hold enough of every input for one completion.</summary>
    MissingInputs,

    /// <summary>The action makes a tool, and the player already owns that tier or a better one.</summary>
    ToolAlreadyOwned,

    /// <summary>What the action makes does not fit: its stack is full and no slot is free.</summary>
    StorageFull,
}

/// <summary>
/// The storehouse as slots: <see cref="Slots"/> lists the stacks in the game's item order, and
/// <see cref="SlotCount"/> says how many slots there are (more slots than that only after a rule change).
/// </summary>
public sealed record StorageView(int SlotCount, long StackSize, IReadOnlyList<ItemAmount> Slots);

/// <summary>
/// Where the player stands in one tool family: the tool they own (<c>null</c> with bare hands)
/// and the action that makes the next tier (<c>null</c> when there is nothing better to make).
/// </summary>
public sealed record ToolProgress(string Family, string? OwnedItemId, string? NextActionId);

/// <summary>A trade the player cannot work yet, and the tool (its first tier) that opens it.</summary>
public sealed record TradeLock(string SkillId, string ToolItemId);
