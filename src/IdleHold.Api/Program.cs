using System.Text.Json.Serialization;
using IdleHold.Api;
using IdleHold.Api.Accounts;
using IdleHold.Api.Persistence;
using IdleHold.Api.Players;
using IdleHold.Engine;
using IdleHold.Engine.Content;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// --- Services (dependency injection) ---
// Registering here means "when someone asks for this type, hand them this instance".
// Singleton = one shared instance for the whole app lifetime.
// Numbers are JSON numbers only. The web default also accepts numeric strings,
// which makes the OpenAPI document type every number as "number | string".
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.NumberHandling = JsonNumberHandling.Strict);

builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddHealthChecks();

builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton(_ => DefaultContent.Create());
builder.Services.AddSingleton<GameEngine>();
builder.Services.AddSingleton<PlayerService>();

// Saves and accounts live in Postgres; the game does not run without it. Locally, `docker compose up -d`
// starts one and appsettings.Development.json points at it.
var gameDatabase = builder.Configuration.GetConnectionString("Game");
if (string.IsNullOrWhiteSpace(gameDatabase))
{
    throw new InvalidOperationException(
        "ConnectionStrings:Game is not set. Start the local database with `docker compose up -d`, " +
        "or set ConnectionStrings__Game.");
}

// The factory serves the singleton store; it also registers GameDbContext as a scoped service,
// which is what Identity's EF Core stores ask for.
builder.Services.AddDbContextFactory<GameDbContext>(options => options.UseNpgsql(gameDatabase));
builder.Services.AddSingleton<IPlayerStore, PostgresPlayerStore>();

// Every player, guest or account, is a signed-in Identity user; a guest is an anonymous one.
builder.Services.AddAuthentication(IdentityConstants.ApplicationScheme).AddIdentityCookies();
builder.Services.AddAuthorization();
builder.Services
    .AddIdentityCore<Account>(options =>
    {
        options.User.RequireUniqueEmail = true;
        options.Password.RequiredLength = 8;
        options.Password.RequireDigit = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    })
    .AddEntityFrameworkStores<GameDbContext>()
    .AddSignInManager();

// Replaces Identity's user validator, which refuses a guest for having no e-mail.
builder.Services.Replace(ServiceDescriptor.Scoped<IUserValidator<Account>, AccountValidator>());

// Check the session's account on every request (one lookup by key), not every 30 minutes: a deleted
// guest or a changed password ends the session at once, and no request reaches a deleted account's hold.
builder.Services.Configure<SecurityStampValidatorOptions>(options => options.ValidationInterval = TimeSpan.Zero);

// Deletes guests that never made any progress (settings under "GuestCleanup").
builder.Services.Configure<GuestCleanupOptions>(builder.Configuration.GetSection("GuestCleanup"));
builder.Services.AddSingleton<GuestCleanup>();
if (builder.Configuration.GetValue("GuestCleanup:Enabled", defaultValue: true))
{
    builder.Services.AddHostedService<GuestCleanupService>();
}

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = "idlehold.session";
    options.Cookie.HttpOnly = true;                  // JavaScript can never read it.
    options.Cookie.SameSite = SameSiteMode.Strict;   // Never sent by another site: blocks CSRF.
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest; // HTTPS-only once deployed behind HTTPS.
    options.ExpireTimeSpan = TimeSpan.FromDays(30);
    options.SlidingExpiration = true;

    // This is an API: answer 401/403 instead of redirecting to an HTML login page.
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };
    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.CompletedTask;
    };
});

var app = builder.Build();

// In development, bring the local database schema up to date on start. Deployed environments
// will run migrations as a separate release step instead.
if (app.Environment.IsDevelopment())
{
    await using var db = await app.Services.GetRequiredService<IDbContextFactory<GameDbContext>>().CreateDbContextAsync();
    await db.Database.MigrateAsync();
}

// --- HTTP pipeline ---
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();             // OpenAPI document at /openapi/v1.json
    app.MapScalarApiReference();  // Interactive docs UI at /scalar, built from that document
}

// Liveness probe for hosting platforms and uptime monitors.
app.MapHealthChecks("/health");

app.UseAuthentication();
app.UseAuthorization();

app.MapGameContentEndpoints();
app.MapAccountEndpoints();
app.MapPlayerEndpoints();

await app.RunAsync();

// Lets the test project start the real app in memory (WebApplicationFactory<Program>).
public partial class Program;
