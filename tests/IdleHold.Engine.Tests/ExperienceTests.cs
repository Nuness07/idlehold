namespace IdleHold.Engine.Tests;

public class ExperienceTests
{
    [Fact]
    public void LevelFor_ZeroXp_IsLevelOne()
    {
        Assert.Equal(1, Experience.LevelFor(0));
    }

    [Theory]
    [InlineData(2)]
    [InlineData(10)]
    [InlineData(50)]
    [InlineData(Experience.MaxLevel)]
    public void LevelFor_IsExactAtEachThreshold(int level)
    {
        var threshold = Experience.XpForLevel(level);

        Assert.Equal(level, Experience.LevelFor(threshold));
        Assert.Equal(level - 1, Experience.LevelFor(threshold - 1));
    }

    [Fact]
    public void XpForLevel_GrowsFasterAtHigherLevels()
    {
        var earlyStep = Experience.XpForLevel(3) - Experience.XpForLevel(2);
        var lateStep = Experience.XpForLevel(99) - Experience.XpForLevel(98);

        Assert.True(lateStep > earlyStep);
    }

    [Fact]
    public void LevelFor_BeyondMaxXp_IsCappedAtMaxLevel()
    {
        Assert.Equal(Experience.MaxLevel, Experience.LevelFor(long.MaxValue));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(Experience.MaxLevel + 1)]
    public void XpForLevel_OutOfRange_Throws(int level)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => Experience.XpForLevel(level));
    }

    [Fact]
    public void LevelFor_NegativeXp_Throws()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => Experience.LevelFor(-1));
    }
}
