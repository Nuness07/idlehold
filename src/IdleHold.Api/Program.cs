using IdleHold.Api;
using IdleHold.Api.Players;
using IdleHold.Engine;
using IdleHold.Engine.Content;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// --- Services (dependency injection) ---
// Registering here means "when someone asks for this type, hand them this instance".
// Singleton = one shared instance for the whole app lifetime.
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();

builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton(_ => DefaultContent.Create());
builder.Services.AddSingleton<GameEngine>();
builder.Services.AddSingleton<IPlayerStore, InMemoryPlayerStore>();
builder.Services.AddSingleton<PlayerService>();

var app = builder.Build();

// --- HTTP pipeline ---
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();             // OpenAPI document at /openapi/v1.json
    app.MapScalarApiReference();  // Interactive docs UI at /scalar, built from that document
}

app.MapGameContentEndpoints();
app.MapPlayerEndpoints();

app.Run();

// Lets the test project start the real app in memory (WebApplicationFactory<Program>).
public partial class Program;
