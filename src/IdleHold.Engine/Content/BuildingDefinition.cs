namespace IdleHold.Engine.Content;

/// <summary>
/// A piece of the village the player builds once, such as lighting the campfire. Building takes
/// <see cref="Cost"/> from the stores at once and adds the building to the village for good. A trade can wait for
/// one (<see cref="SkillDefinition.RequiredBuildingId"/>): Cooking opens when the campfire is lit.
/// </summary>
public sealed record BuildingDefinition(string Id, IReadOnlyList<ItemAmount> Cost);
