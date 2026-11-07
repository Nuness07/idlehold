using IdleHold.Engine.Content;

namespace IdleHold.Engine.Tests;

public class GameContentTests
{
    [Fact]
    public void Constructor_DuplicateId_Throws()
    {
        var action = new ActionDefinition("chop", "woodcutting", TimeSpan.FromSeconds(3), 10, "log");

        Assert.Throws<ArgumentException>(() => new GameContent([action, action]));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Constructor_NonPositiveDuration_Throws(int seconds)
    {
        var action = new ActionDefinition("chop", "woodcutting", TimeSpan.FromSeconds(seconds), 10, "log");

        Assert.Throws<ArgumentException>(() => new GameContent([action]));
    }

    [Fact]
    public void Constructor_InputWithNonPositiveQuantity_Throws()
    {
        var action = new ActionDefinition("saw", "crafting", TimeSpan.FromSeconds(3), 10, "plank") { Inputs = [new ItemAmount("log", 0)] };

        Assert.Throws<ArgumentException>(() => new GameContent([action]));
    }

    [Fact]
    public void Constructor_SameInputTwice_Throws()
    {
        var action = new ActionDefinition("saw", "crafting", TimeSpan.FromSeconds(3), 10, "plank")
        {
            Inputs = [new ItemAmount("log", 1), new ItemAmount("log", 2)],
        };

        Assert.Throws<ArgumentException>(() => new GameContent([action]));
    }

    [Fact]
    public void Constructor_ToolRecipeMakingMoreThanOne_Throws()
    {
        var action = new ActionDefinition("craft-axe", "crafting", TimeSpan.FromSeconds(3), 10, "axe", OutputQuantity: 2);

        Assert.Throws<ArgumentException>(() => new GameContent([action], [new ToolDefinition("axe", "axe", 1, "woodcutting")]));
    }

    [Fact]
    public void Constructor_ToolsOfOneFamilyServingDifferentTrades_Throws()
    {
        Assert.Throws<ArgumentException>(() => new GameContent(
            [],
            [new ToolDefinition("axe", "axe", 1, "woodcutting"), new ToolDefinition("good-axe", "axe", 2, "mining")]));
    }

    [Fact]
    public void DefaultContent_EveryToolServesATradeWithActions()
    {
        var content = DefaultContent.Create();

        Assert.All(content.Tools, tool => Assert.Contains(content.Actions, action => action.SkillId == tool.SkillId));
    }

    [Fact]
    public void Constructor_TwoToolsWithTheSameFamilyAndTier_Throws()
    {
        Assert.Throws<ArgumentException>(() => new GameContent(
            [],
            [new ToolDefinition("axe", "axe", 1, "woodcutting"), new ToolDefinition("other-axe", "axe", 1, "woodcutting")]));
    }

    [Fact]
    public void DefaultContent_IsValid()
    {
        var content = DefaultContent.Create();

        Assert.NotEmpty(content.Actions);
    }

    [Fact]
    public void DefaultContent_HasExpectedActionsPerSkill()
    {
        var bySkill = DefaultContent.Create().Actions
            .GroupBy(action => action.SkillId)
            .ToDictionary(group => group.Key, group => group.Count());

        Assert.Equal(
            new Dictionary<string, int> { ["woodcutting"] = 3, ["fishing"] = 2, ["mining"] = 3, ["foraging"] = 2, ["crafting"] = 2 },
            bySkill);
    }

    [Theory]
    [InlineData("gather-twigs", "woodcutting")]
    [InlineData("pick-pebbles", "mining")]
    [InlineData("pick-wild-berries", "foraging")]
    public void DefaultContent_HasABareHandActionInEveryStartingTrade(string actionId, string skillId)
    {
        // Hand actions are the quickest in their trade: the player starts with nothing.
        var content = DefaultContent.Create();
        var action = content.GetAction(actionId);

        Assert.Equal(skillId, action.SkillId);
        Assert.All(
            content.Actions.Where(other => other.SkillId == skillId),
            other => Assert.True(action.Duration <= other.Duration));
    }

    [Fact]
    public void DefaultContent_SlowerActionsPayMoreXpPerSecond()
    {
        // Within a skill, waiting longer must be worth it; otherwise the slow action is a trap.
        foreach (var skill in DefaultContent.Create().Actions.GroupBy(action => action.SkillId))
        {
            var ordered = skill.OrderBy(action => action.Duration).ToList();
            var rates = ordered.Select(action => action.XpPerCompletion / action.Duration.TotalSeconds).ToList();

            Assert.True(
                rates.SequenceEqual(rates.Order()),
                $"In {skill.Key}, slower actions should not give less XP per second.");
        }
    }

    [Fact]
    public void DefaultContent_RecipesUseItemsThePlayerCanGather()
    {
        // Every input must come out of some action, or the recipe can never be made.
        var content = DefaultContent.Create();
        var produced = content.Actions.Select(action => action.OutputItemId).ToHashSet();

        Assert.All(
            content.Actions.SelectMany(action => action.Inputs),
            input => Assert.Contains(input.ItemId, produced));
    }

    [Fact]
    public void DefaultContent_EveryToolHasARecipe()
    {
        var content = DefaultContent.Create();

        Assert.All(content.Tools, tool => Assert.Contains(content.Actions, action => action.OutputItemId == tool.ItemId));
    }
}
