# AGENTS.md

Guidance for AI coding agents and reviewers working on IdleHold.

## Project

IdleHold is a browser idle game. The backend is C#/.NET 10 and is **server-authoritative**: all game rules run on the server, and the client only renders state.

```
src/IdleHold.Engine   Pure game rules (GameEngine, GameState, GameContent, Experience)
src/IdleHold.Api      ASP.NET Core Minimal API around the engine
tests/                xUnit unit tests (engine) and integration tests (API)
```

Build and test from the repository root:

```bash
dotnet build
dotnet test
```

## Architecture rules

- `IdleHold.Engine` is pure. It must not reference ASP.NET Core, databases, the file system, the network, `DateTime.Now`/`UtcNow`, or unseeded randomness.
- Dependencies point one way: `IdleHold.Api` references `IdleHold.Engine`, never the reverse.
- Game state is immutable. Engine methods return a new `GameState` (`with` expressions) and never mutate their input.
- `Tick(state, elapsed)` must run in constant time with respect to `elapsed`. Compute completions with arithmetic, never with a loop per cycle.
- The API gets the current time only from the injected `TimeProvider`.
- Never trust client input. Validate request bodies and route values before calling the engine.
- Storage is accessed only through `IPlayerStore`. Endpoints and services must not depend on a concrete store.
- API responses use DTOs, not engine types.

## Code style

- Nullable reference types and warnings-as-errors are on. Do not suppress warnings to make a build pass.
- Classes and records are `sealed` unless they are designed for inheritance.
- Use `long` for item quantities and XP, since idle numbers grow large.
- Names, comments, commit messages and docs are in English.
- Commits follow Conventional Commits (`feat:`, `fix:`, `docs:`, `ci:`, `chore:`, `test:`, `refactor:`).
- Commits and pull requests must not include AI co-author or attribution lines.

## Testing

- Any change to game rules needs engine unit tests in `tests/IdleHold.Engine.Tests`.
- Any change to an endpoint needs integration tests in `tests/IdleHold.Api.Tests`, using `ApiFactory` and its `FakeTimeProvider` to control time.
- Tests must be deterministic: no real clock, no real waiting, no shared state between tests.

## Review guidelines

Treat these as **P1** (must fix before merge):

- The engine gains a dependency on web, database, I/O or the real clock.
- Code calls `DateTime.Now`/`DateTime.UtcNow` instead of `TimeProvider`.
- An endpoint uses client input without validating it.
- `GameState` (or anything it holds) is mutated in place.
- `Tick` or another time-based calculation loops once per cycle.
- `int` is used for item quantities or XP.
- A game rule or endpoint changes without a matching test.
- A response DTO changes shape in a way that breaks existing clients, without saying so in the PR.

Do not flag pure formatting or naming preferences unless they hurt readability.
