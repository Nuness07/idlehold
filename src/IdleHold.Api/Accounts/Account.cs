using Microsoft.AspNetCore.Identity;

namespace IdleHold.Api.Accounts;

/// <summary>
/// Whoever plays a hold. ASP.NET Core Identity owns everything here: the e-mail, the password hash,
/// lockout counters and the security stamp that invalidates old cookies. Game data never lives
/// on the account; the account owns a player through <c>players.account_id</c>.
///
/// A guest is an anonymous account: a generated user name (<c>guest-…</c>), no e-mail and no password,
/// reachable only through its session cookie. Signing up promotes the same account, so the hold stays.
/// </summary>
public sealed class Account : IdentityUser<Guid>
{
    /// <summary><c>true</c> until the guest signs up and the account gets an e-mail and a password.</summary>
    public bool IsAnonymous { get; set; }

    public static Account NewGuest()
    {
        var id = Guid.NewGuid();
        return new Account { Id = id, UserName = $"guest-{id:N}", IsAnonymous = true };
    }
}
