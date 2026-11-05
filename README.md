# IdleHold

A browser idle game with a server-authoritative backend in C#/.NET. Pick a skill and an action, and progress builds up over time, even while you are offline.

> **Status:** early development. The game engine and HTTP API work; the web client comes next.

## Architecture

```
┌─────────────┐   HTTP/JSON   ┌──────────────────┐   in-process   ┌──────────────────┐
│ Web client  │ ────────────▶ │  IdleHold.Api    │ ─────────────▶ │ IdleHold.Engine  │
│ (planned)   │ ◀──────────── │  ASP.NET Core    │                │ pure game rules  │
└─────────────┘               └──────────────────┘                └──────────────────┘
```

- **The server is authoritative.** All game rules live in C#. The client only renders state and animates progress, so it cannot cheat its way to more resources.
- **The engine is pure.** `IdleHold.Engine` has no web, database or I/O dependencies. Its core is `Tick(state, elapsed) → state`.
- **Lazy evaluation.** Nothing runs while a player is away. On each request, the API simulates the time since the player's last update in one constant-time step. Eight hours offline costs the same as one frame.
- **Ports and adapters.** Storage sits behind `IPlayerStore`. Today it is in memory; a database becomes another implementation without touching the endpoints.

## Tech stack

| Area | Choice |
|---|---|
| Language | C# / .NET 10 |
| API | ASP.NET Core Minimal APIs, OpenAPI + Scalar |
| Tests | xUnit, `WebApplicationFactory`, `FakeTimeProvider` |
| Web client (planned) | React + TypeScript + Vite |

## Getting started

Requires the [.NET 10 SDK](https://dotnet.microsoft.com/download).

```bash
dotnet test                              # build and run all tests
dotnet run --project src/IdleHold.Api    # start the API on http://localhost:5085
```

With the API running, open http://localhost:5085/scalar for interactive API docs.

## Project layout

```
src/
  IdleHold.Engine/   Game rules: state, content, XP curve, Tick
  IdleHold.Api/      HTTP endpoints, player service, storage
tests/
  IdleHold.Engine.Tests/   Unit tests for the rules
  IdleHold.Api.Tests/      Integration tests with a fake clock
```

## Roadmap

1. Playable MVP in the browser
2. Accounts and persistent saves (PostgreSQL)
3. More skills, items and content as data files
4. Multiplayer features (market, leaderboards, chat)
