namespace IdleHold.Engine.Content;

/// <summary>
/// A heading a trade splits its recipes under, such as a station in Cooking (the campfire, the stone furnace) or a
/// material in Crafting (chipped stone, copper). It only sorts the recipes on screen and changes no rule. A group can
/// be listed before any recipe is in it, so the player sees what is coming. When a trade has groups, every one of
/// its actions names one (<see cref="ActionDefinition.GroupId"/>).
/// </summary>
public sealed record RecipeGroupDefinition(string Id, string SkillId);
