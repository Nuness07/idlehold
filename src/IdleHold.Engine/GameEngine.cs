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
    /// Why an action cannot start right now, or <c>null</c> if it can. An action that burns fuel needs
    /// <paramref name="fuelItemId"/>, the fuel the player chose; other actions ignore it. Throws for an unknown action
    /// or a fuel that is not one: that is a bad request, not a game situation.
    /// </summary>
    public ActionBlock? CheckStart(GameState state, string actionId, string? fuelItemId = null)
    {
        var action = content.FindAction(actionId)
            ?? throw new ArgumentException($"Unknown action '{actionId}'.", nameof(actionId));
        var fuel = FuelFor(action, fuelItemId);

        if (MissingBuildingFor(state, action.SkillId) is not null)
        {
            return ActionBlock.MissingBuilding;
        }

        if (MissingToolFor(state, action.SkillId) is not null)
        {
            return ActionBlock.MissingTool;
        }

        if (state.LevelOf(action.SkillId) < action.RequiredLevel)
        {
            return ActionBlock.LevelTooLow;
        }

        if (content.FindTool(action.OutputItemId) is { } tool && ToolTierOf(state, tool.Family) >= tool.Tier)
        {
            return ActionBlock.ToolAlreadyOwned;
        }

        if (action.Inputs.Any(input => state.ItemCount(input.ItemId) < input.Quantity))
        {
            return ActionBlock.MissingInputs;
        }

        if (fuel is not null && FireCyclesFor(state, fuel) == 0)
        {
            return ActionBlock.MissingFuel;
        }

        if (StorageLimit(state, action, upTo: 1) == 0)
        {
            return ActionBlock.StorageFull;
        }

        return null;
    }

    public GameState StartAction(GameState state, string actionId, string? fuelItemId = null)
    {
        var action = content.FindAction(actionId)
            ?? throw new ArgumentException($"Unknown action '{actionId}'.", nameof(actionId));
        var fuelId = FuelFor(action, fuelItemId)?.ItemId;

        // Restarting the action you are already doing should not throw away its progress.
        if (state.ActiveAction is { } active && active.ActionId == actionId && active.FuelItemId == fuelId)
        {
            return state;
        }

        if (CheckStart(state, actionId, fuelId) is { } block)
        {
            throw new InvalidOperationException($"Action '{actionId}' cannot start: {block}.");
        }

        // Changing only the fuel keeps the cycle going: the pot stays on the fire.
        var progress = state.ActiveAction?.ActionId == actionId ? state.ActiveAction.Progress : TimeSpan.Zero;
        return state with { ActiveAction = new ActiveAction(actionId, progress, fuelId) };
    }

    /// <summary>
    /// The fuel an action burns when started with <paramref name="fuelItemId"/>: <c>null</c> for an action that
    /// burns none. Throws when a fire-using action gets no fuel or an item that is not one.
    /// </summary>
    private FuelDefinition? FuelFor(ActionDefinition action, string? fuelItemId)
    {
        if (!action.UsesFuel)
        {
            return null;
        }

        return fuelItemId is not null && content.FindFuel(fuelItemId) is { } fuel
            ? fuel
            : throw new ArgumentException($"Action '{action.Id}' needs a fuel, and '{fuelItemId}' is not one.", nameof(fuelItemId));
    }

    /// <summary>How many completions the fire can burn for: what is left in it, plus every fuel of this kind in the stores.</summary>
    private static long FireCyclesFor(GameState state, FuelDefinition fuel)
    {
        var stored = state.ItemCount(fuel.ItemId);
        var room = (long.MaxValue - state.FireCyclesLeft) / fuel.Cycles;
        return state.FireCyclesLeft + Math.Min(stored, room) * fuel.Cycles;
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

    /// <summary>
    /// The village building <paramref name="skillId"/> still waits for, or <c>null</c> when it waits for none or it
    /// is built.
    /// </summary>
    public string? MissingBuildingFor(GameState state, string skillId) =>
        content.Skills.FirstOrDefault(skill => skill.Id == skillId)?.RequiredBuildingId is { } building
        && !state.Buildings.Contains(building)
            ? building
            : null;

    /// <summary>
    /// The trades the player cannot work yet, in the game's trade order, each with what opens it: a village building
    /// to build, else the tool to make.
    /// </summary>
    public IReadOnlyList<TradeLock> LockedTradesOf(GameState state) =>
        content.Skills
            .Select(skill => new TradeLock(skill.Id, MissingToolFor(state, skill.Id), MissingBuildingFor(state, skill.Id)))
            .Where(trade => trade.ToolItemId is not null || trade.BuildingId is not null)
            .ToList();

    /// <summary>
    /// Why a village building cannot be built right now, or <c>null</c> if it can. Throws for an unknown building:
    /// that is a bad request, not a game situation.
    /// </summary>
    public BuildBlock? CheckBuild(GameState state, string buildingId)
    {
        var building = content.FindBuilding(buildingId)
            ?? throw new ArgumentException($"Unknown building '{buildingId}'.", nameof(buildingId));

        if (state.Buildings.Contains(building.Id))
        {
            return BuildBlock.AlreadyBuilt;
        }

        if (building.Cost.Any(item => state.ItemCount(item.ItemId) < item.Quantity))
        {
            return BuildBlock.MissingInputs;
        }

        return null;
    }

    /// <summary>
    /// Builds a village building at once: its cost leaves the stores and it joins the village. The worked action
    /// goes on; call <see cref="Tick"/> first so the stores are up to date.
    /// </summary>
    public GameState Build(GameState state, string buildingId)
    {
        if (CheckBuild(state, buildingId) is { } block)
        {
            throw new InvalidOperationException($"Building '{buildingId}' cannot be built: {block}.");
        }

        var building = content.FindBuilding(buildingId)!;
        var inventory = building.Cost.Aggregate(state.Inventory, (stores, item) => AddTo(stores, item.ItemId, -item.Quantity));
        return state with { Inventory = inventory, Buildings = state.Buildings.Add(building.Id) };
    }

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

        var fireLeft = next.FireCyclesLeft;
        if (action.UsesFuel && active.FuelItemId is { } fuelId && content.FindFuel(fuelId) is { } fuel)
        {
            // The fire burns what is already in it first, then takes whole fuels from the stores as it needs them.
            var fromFire = Math.Min(completions, fireLeft);
            var rest = completions - fromFire;
            var burned = (rest + fuel.Cycles - 1) / fuel.Cycles;
            inventory = AddTo(inventory, fuelId, -burned);
            fireLeft = fireLeft - fromFire + burned * fuel.Cycles - rest;
        }

        return next with
        {
            Inventory = inventory,
            SkillXp = AddTo(next.SkillXp, action.SkillId, completions * action.XpPerCompletion),
            FireCyclesLeft = fireLeft,
        };
    }

    /// <summary>
    /// How many more completions the player can pay for and store, or <c>null</c> when nothing limits them
    /// before the <paramref name="completions"/> the time allows plus the next one (which decides whether the
    /// action goes on).
    /// </summary>
    private long? CompletionLimit(GameState state, ActionDefinition action, long completions)
    {
        // A locked trade or an action above the player's level does no work. Starting is refused, so only a save
        // from before the lock or the level gate gets here.
        if (MissingBuildingFor(state, action.SkillId) is not null
            || MissingToolFor(state, action.SkillId) is not null
            || state.LevelOf(action.SkillId) < action.RequiredLevel)
        {
            return 0;
        }

        long? limit = null;

        if (action.UsesFuel)
        {
            // An action that burns fuel and has none chosen (or a fuel the content dropped) cannot go on.
            limit = state.ActiveAction?.FuelItemId is { } fuelId && content.FindFuel(fuelId) is { } fuel
                ? FireCyclesFor(state, fuel)
                : 0;
        }

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
    /// The most completions, up to <paramref name="upTo"/>, whose results still fit in the storehouse, one after
    /// another. Each completion takes its inputs out and puts its output in, so a recipe can free the slot its
    /// output needs, and the slot count can rise and fall as completions go on. It only changes where a touched
    /// item crosses a stack boundary, so checking those completions in order finds the first that does not fit.
    /// There are at most a slot count's worth of them per item: constant time for any stretch of time.
    /// </summary>
    private long StorageLimit(GameState state, ActionDefinition action, long upTo)
    {
        var rules = content.Storage;
        if (rules == StorageRules.Unlimited)
        {
            return upTo;
        }

        // Slots taken by everything the action does not touch; the touched items are counted per k below. Fuel
        // burned along the way is counted as still there: it only frees slots, so the answer can stop a little early
        // when burning the last of a stack is what would make room, never late.
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

        if (!Fits(0))
        {
            return 0;
        }

        var changes = new SortedSet<long>();
        AddStackBoundaries(changes, rules, state.ItemCount(action.OutputItemId), action.OutputQuantity, upTo);
        foreach (var input in action.Inputs)
        {
            AddStackBoundaries(changes, rules, state.ItemCount(input.ItemId), -input.Quantity, upTo);
        }

        foreach (var k in changes)
        {
            if (!Fits(k))
            {
                return k - 1;
            }
        }

        return upTo;
    }

    /// <summary>
    /// Adds every completion k in (0, <paramref name="upTo"/>] at which an item counting
    /// <paramref name="start"/> + <paramref name="step"/> × k takes a different number of slots.
    /// </summary>
    private static void AddStackBoundaries(SortedSet<long> into, StorageRules rules, long start, long step, long upTo)
    {
        var stacks = rules.SlotsFor(start);
        if (step > 0)
        {
            // A new stack opens once the count passes a full one. Past the slot count the item alone overflows,
            // so later boundaries can never be reached.
            for (var stack = stacks; stack <= stacks + rules.SlotCount; stack++)
            {
                var k = CeilDiv(stack * rules.StackSize + 1 - start, step);
                if (k > upTo)
                {
                    return;
                }

                into.Add(k);
            }
        }
        else
        {
            // A stack frees once the count falls to the one below it. The stores fit, so there are few stacks.
            for (var stack = stacks; stack >= 1; stack--)
            {
                var k = CeilDiv(start - (stack - 1) * rules.StackSize, -step);
                if (k > upTo)
                {
                    return;
                }

                into.Add(k);
            }
        }
    }

    private static long CeilDiv(long value, long divisor) => (value + divisor - 1) / divisor;

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
    /// <summary>The action's trade is locked: it waits for a village building that is not built yet.</summary>
    MissingBuilding,

    /// <summary>The action's trade is locked: the player owns no tool of the family that serves it.</summary>
    MissingTool,

    /// <summary>The player's level in the action's trade is below the level the action needs.</summary>
    LevelTooLow,

    /// <summary>The action burns fuel, and neither the fire nor the stores hold any of the chosen kind.</summary>
    MissingFuel,

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

/// <summary>
/// A trade the player cannot work yet, and what opens it: the tool to make (its first tier) and the village building
/// to build. At least one is set.
/// </summary>
public sealed record TradeLock(string SkillId, string? ToolItemId, string? BuildingId = null);

/// <summary>Why a village building cannot be built.</summary>
public enum BuildBlock
{
    /// <summary>It is already part of the village.</summary>
    AlreadyBuilt,

    /// <summary>The stores do not hold enough of every item it costs.</summary>
    MissingInputs,
}
