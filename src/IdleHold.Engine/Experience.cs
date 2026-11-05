namespace IdleHold.Engine;

/// <summary>
/// Converts between total XP and skill level. The XP needed per level grows with the level,
/// so early levels come fast and later ones take much longer.
/// </summary>
public static class Experience
{
    public const int MaxLevel = 99;

    // Thresholds[i] = total XP needed to reach level i + 1. Level 1 needs 0 XP.
    private static readonly long[] Thresholds = BuildThresholds();

    public static long XpForLevel(int level)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(level, 1);
        ArgumentOutOfRangeException.ThrowIfGreaterThan(level, MaxLevel);
        return Thresholds[level - 1];
    }

    public static int LevelFor(long xp)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(xp);

        // Binary search: O(log n). When xp is not an exact threshold, the result is the
        // bitwise complement of the first index that is greater, which is exactly our level.
        var index = Array.BinarySearch(Thresholds, xp);
        return index >= 0 ? index + 1 : ~index;
    }

    private static long[] BuildThresholds()
    {
        var thresholds = new long[MaxLevel];
        for (var level = 2; level <= MaxLevel; level++)
        {
            var stepCost = (long)Math.Floor(100 * Math.Pow(level - 1, 1.5));
            thresholds[level - 1] = thresholds[level - 2] + stepCost;
        }

        return thresholds;
    }
}
