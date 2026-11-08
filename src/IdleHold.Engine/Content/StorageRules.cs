namespace IdleHold.Engine.Content;

/// <summary>
/// How the storehouse holds items: <see cref="SlotCount"/> slots, each holding a stack of one item of up to
/// <see cref="StackSize"/>. An item takes as many slots as its stacks need, so 25,000 logs with a stack size
/// of 10,000 take three. An action stops when what it makes no longer fits.
/// </summary>
public sealed record StorageRules(int SlotCount, long StackSize)
{
    /// <summary>A storehouse that never fills, for content that does not test storage.</summary>
    public static StorageRules Unlimited { get; } = new(int.MaxValue, long.MaxValue);

    /// <summary>How many slots <paramref name="count"/> of one item take.</summary>
    public long SlotsFor(long count) => count <= 0 ? 0 : (count - 1) / StackSize + 1;
}
