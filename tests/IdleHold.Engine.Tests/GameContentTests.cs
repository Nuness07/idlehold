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
            new Dictionary<string, int> { ["woodcutting"] = 3, ["fishing"] = 2, ["mining"] = 3, ["foraging"] = 1 },
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
}
