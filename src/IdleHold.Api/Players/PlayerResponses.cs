using IdleHold.Engine;
using IdleHold.Engine.Content;

namespace IdleHold.Api.Players;

/// <summary>
/// The JSON shape the client receives. Kept separate from the engine's GameState (a DTO)
/// so the engine can change internally without breaking the API contract.
/// </summary>
public sealed record PlayerResponse(
    Guid Id,
    ActiveActionResponse? ActiveAction,
    IReadOnlyDictionary<string, long> Inventory,
    IReadOnlyDictionary<string, SkillResponse> Skills,
    IReadOnlyList<ToolProgressResponse> Tools,
    IReadOnlyList<TradeLockResponse> LockedTrades,
    StorageResponse Storage,
    long FireCyclesLeft,
    DateTimeOffset UpdatedAt)
{
    public static PlayerResponse From(PlayerSave save, GameEngine engine, GameContent content)
    {
        var state = save.State;

        var activeAction = state.ActiveAction is { } active
            ? new ActiveActionResponse(
                active.ActionId,
                ProgressMs: (long)active.Progress.TotalMilliseconds,
                DurationMs: (long)content.GetAction(active.ActionId).Duration.TotalMilliseconds,
                active.FuelItemId)
            : null;

        var skills = state.SkillXp.ToDictionary(pair => pair.Key, pair => SkillResponse.From(pair.Value));

        var tools = engine.ToolProgressOf(state)
            .Select(tool => new ToolProgressResponse(tool.Family, tool.OwnedItemId, tool.NextActionId))
            .ToList();

        var lockedTrades = engine.LockedTradesOf(state)
            .Select(trade => new TradeLockResponse(trade.SkillId, trade.ToolItemId))
            .ToList();

        var storage = engine.StorageOf(state);
        var storageResponse = new StorageResponse(
            storage.SlotCount,
            storage.StackSize,
            storage.Slots.Select(slot => new ItemAmountResponse(slot.ItemId, slot.Quantity)).ToList());

        return new PlayerResponse(save.Id, activeAction, state.Inventory, skills, tools, lockedTrades, storageResponse, state.FireCyclesLeft, save.LastUpdated);
    }
}

/// <summary>
/// The storehouse as slots: each slot is a stack of one item, in the game's item order, and
/// <see cref="SlotCount"/> is how many slots the hold has. The server splits the stores, so the client
/// never applies the stack rule itself.
/// </summary>
public sealed record StorageResponse(int SlotCount, long StackSize, IReadOnlyList<ItemAmountResponse> Slots);

/// <summary>
/// One tool family: the tool owned (null with bare hands) and the action that makes the next tier
/// (null when there is nothing better to make). The server decides which tier comes next.
/// </summary>
public sealed record ToolProgressResponse(string Family, string? OwnedItemId, string? NextActionId);

/// <summary>
/// A trade the player cannot work yet, and the tool that opens it (its first tier). The server decides which trades
/// are locked; starting one of their actions is refused with the reason <c>missing-tool</c>.
/// </summary>
public sealed record TradeLockResponse(string SkillId, string ToolItemId);

/// <summary>
/// Progress and duration let the client animate the bar on its own between requests. <see cref="FuelItemId"/> is the
/// fuel the fire burns, for an action that uses one.
/// </summary>
public sealed record ActiveActionResponse(string ActionId, long ProgressMs, long DurationMs, string? FuelItemId);

/// <summary>
/// A skill's XP and level, plus the XP bounds of the current level so the client can show
/// progress to the next level without reimplementing the XP curve.
/// <see cref="NextLevelXp"/> is null at the maximum level.
/// </summary>
public sealed record SkillResponse(long Xp, int Level, long LevelStartXp, long? NextLevelXp)
{
    public static SkillResponse From(long xp)
    {
        var level = Experience.LevelFor(xp);
        long? next = level < Experience.MaxLevel ? Experience.XpForLevel(level + 1) : null;
        return new SkillResponse(xp, level, Experience.XpForLevel(level), next);
    }
}

/// <summary>Starts an action. <see cref="FuelItemId"/> is required for an action that burns fuel, and ignored otherwise.</summary>
public sealed record StartActionRequest(string ActionId, string? FuelItemId = null);
