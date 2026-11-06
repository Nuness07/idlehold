using System.Text.Json.Serialization;
using IdleHold.Api;
using IdleHold.Api.Persistence;
using IdleHold.Api.Players;
using IdleHold.Engine;
using IdleHold.Engine.Content;
using Microsoft.EntityFrameworkCore;
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

// Saves go to Postgres when a "Game" connection string is configured; without one (tests, or a
// quick run with no database) they stay in memory and are lost when the server stops.
var gameDatabase = builder.Configuration.GetConnectionString("Game");
if (string.IsNullOrWhiteSpace(gameDatabase))
{
    builder.Services.AddSingleton<IPlayerStore, InMemoryPlayerStore>();
}
else
{
    builder.Services.AddDbContextFactory<GameDbContext>(options => options.UseNpgsql(gameDatabase));
    builder.Services.AddSingleton<IPlayerStore, PostgresPlayerStore>();
}

var app = builder.Build();

// In development, bring the local database schema up to date on start. Deployed environments
// will run migrations as a separate release step instead.
if (app.Environment.IsDevelopment() && !string.IsNullOrWhiteSpace(gameDatabase))
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

app.MapGameContentEndpoints();
app.MapPlayerEndpoints();

await app.RunAsync();

// Lets the test project start the real app in memory (WebApplicationFactory<Program>).
public partial class Program;
