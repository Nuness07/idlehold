using Microsoft.AspNetCore.Identity;

namespace IdleHold.Api.Accounts;

/// <summary>
/// A player's login. ASP.NET Core Identity owns everything here: the e-mail, the password hash,
/// lockout counters and the security stamp that invalidates old cookies. Game data never lives
/// on the account; the account owns a player through <c>players.account_id</c>.
/// </summary>
public sealed class Account : IdentityUser<Guid>;
