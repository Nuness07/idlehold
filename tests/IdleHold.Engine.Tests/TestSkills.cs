using IdleHold.Engine.Content;

namespace IdleHold.Engine.Tests;

/// <summary>The skills that test content builds its actions and tools on.</summary>
internal static class TestSkills
{
    public static readonly SkillDefinition[] All =
    [
        new("woodcutting", SkillCategory.Gathering),
        new("mining", SkillCategory.Gathering),
        new("crafting", SkillCategory.Production),
    ];
}
