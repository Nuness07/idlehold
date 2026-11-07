using IdleHold.Engine.State;

namespace IdleHold.Api.Players;

/// <summary>
/// What the server stores per player: the game state plus the moment it was last brought up to date.
/// The gap between <see cref="LastUpdated"/> and "now" is the time the engine still has to simulate.
/// </summary>
/// <param name="AccountId">The account that owns this player: a guest's anonymous account or a full one.</param>
public sealed record PlayerSave(Guid Id, GameState State, DateTimeOffset LastUpdated, Guid AccountId);
