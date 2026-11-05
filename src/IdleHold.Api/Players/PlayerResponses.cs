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
    DateTimeOffset UpdatedAt)
{
    public static PlayerResponse From(PlayerSave save, GameContent content)
    {
        var state = save.State;

        var activeAction = state.ActiveAction is { } active
            ? new ActiveActionResponse(
                active.ActionId,
                ProgressMs: (long)active.Progress.TotalMilliseconds,
                DurationMs: (long)content.GetAction(active.ActionId).Duration.TotalMilliseconds)
            : null;

        var skills = state.SkillXp.ToDictionary(pair => pair.Key, pair => SkillResponse.From(pair.Value));

        return new PlayerResponse(save.Id, activeAction, state.Inventory, skills, save.LastUpdated);
    }
}

/// <summary>Progress and duration let the client animate the bar on its own between requests.</summary>
public sealed record ActiveActionResponse(string ActionId, long ProgressMs, long DurationMs);

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

public sealed record StartActionRequest(string ActionId);
