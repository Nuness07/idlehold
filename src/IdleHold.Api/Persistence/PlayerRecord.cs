namespace IdleHold.Api.Persistence;

/// <summary>
/// One row of the <c>players</c> table. The game state is a JSON document in a <c>jsonb</c>
/// column; everything the database needs to query or relate stays a normal column.
/// </summary>
public sealed class PlayerRecord
{
    public Guid Id { get; set; }

    /// <summary>The serialized <see cref="StateDocument"/>.</summary>
    public string State { get; set; } = "";

    public DateTimeOffset LastUpdated { get; set; }

    /// <summary>The owning account, or <c>null</c> while the player is a guest. Unique: one hold per account.</summary>
    public Guid? AccountId { get; set; }

    /// <summary>
    /// Mapped to Postgres' hidden <c>xmin</c> column, which changes on every update. EF Core uses it
    /// to detect that someone else changed the row between our read and our write.
    /// </summary>
    public uint Version { get; set; }
}
