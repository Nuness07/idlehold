using IdleHold.Engine.Content;

namespace IdleHold.Engine.Tests;

public class RecipeGroupTests
{
    private static ActionDefinition Cook(string? groupId) =>
        new("cook", "crafting", TimeSpan.FromSeconds(3), 10, "meal") { GroupId = groupId };

    [Fact]
    public void Constructor_KeepsTheGroupsInOrder()
    {
        var content = new GameContent(
            TestSkills.All,
            [Cook("fire")],
            recipeGroups: [new RecipeGroupDefinition("fire", "crafting"), new RecipeGroupDefinition("oven", "crafting")]);

        Assert.Equal(["fire", "oven"], content.RecipeGroups.Select(group => group.Id));
    }

    [Fact]
    public void Constructor_GroupOfAnUnknownSkill_Throws()
    {
        Assert.Throws<ArgumentException>(() =>
            new GameContent(TestSkills.All, [], recipeGroups: [new RecipeGroupDefinition("fire", "baking")]));
    }

    [Fact]
    public void Constructor_DuplicateGroup_Throws()
    {
        Assert.Throws<ArgumentException>(() => new GameContent(
            TestSkills.All,
            [],
            recipeGroups: [new RecipeGroupDefinition("fire", "crafting"), new RecipeGroupDefinition("fire", "mining")]));
    }

    [Fact]
    public void Constructor_ActionInAnUnknownGroup_Throws()
    {
        Assert.Throws<ArgumentException>(() => new GameContent(TestSkills.All, [Cook("oven")]));
    }

    [Fact]
    public void Constructor_ActionInAnotherTradesGroup_Throws()
    {
        Assert.Throws<ArgumentException>(() => new GameContent(
            TestSkills.All,
            [Cook("quarry")],
            recipeGroups: [new RecipeGroupDefinition("quarry", "mining")]));
    }

    [Fact]
    public void Constructor_UngroupedActionInATradeWithGroups_Throws()
    {
        Assert.Throws<ArgumentException>(() => new GameContent(
            TestSkills.All,
            [Cook(null)],
            recipeGroups: [new RecipeGroupDefinition("fire", "crafting")]));
    }

    [Fact]
    public void Constructor_GroupWithoutRecipes_IsAllowed()
    {
        // A group can show what is coming before anything is in it.
        var content = new GameContent(TestSkills.All, [], recipeGroups: [new RecipeGroupDefinition("oven", "crafting")]);

        Assert.Single(content.RecipeGroups);
    }

    [Fact]
    public void DefaultContent_SortsCraftingByMaterialAndCookingByStation()
    {
        var content = DefaultContent.Create();

        Assert.Equal(
            ["chipped-stone", "stone", "copper", "campfire", "stone-furnace"],
            content.RecipeGroups.Select(group => group.Id));
        Assert.All(content.Actions.Where(action => action.SkillId == "cooking"), action => Assert.Equal("campfire", action.GroupId));
        Assert.All(content.Actions.Where(action => action.SkillId == "crafting"), action => Assert.Equal("chipped-stone", action.GroupId));
    }

    [Fact]
    public void DefaultContent_TheCampfireDishesAreOpenFromTheStartAndTakeOnlyBerries()
    {
        var content = DefaultContent.Create();

        Assert.Equal([new ItemAmount("wild-berry", 4)], content.GetAction("cook-grilled-berries").Inputs);
        Assert.Equal([new ItemAmount("wild-berry", 12)], content.GetAction("cook-berry-soup").Inputs);
        Assert.All(content.Actions.Where(action => action.SkillId == "cooking"), action => Assert.Equal(1, action.RequiredLevel));
    }
}
