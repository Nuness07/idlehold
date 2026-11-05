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
}
