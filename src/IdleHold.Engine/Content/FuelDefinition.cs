namespace IdleHold.Engine.Content;

/// <summary>
/// An item that can feed a fire, such as a log, and how many completions of a fire-using action one of it
/// burns for. The fire only burns while it works: it takes the next one from the stores when the last runs
/// out, and what is left of a burning one waits in the fire (<see cref="State.GameState.FireCyclesLeft"/>).
/// </summary>
public sealed record FuelDefinition(string ItemId, int Cycles);
