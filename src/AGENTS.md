# Backend guide (`src/` and `tests/`)

Read this before changing the engine, the API or their tests.

## Layout

- `IdleHold.slnx` at the root; `Directory.Build.props` holds shared settings (net10.0, nullable, warnings as errors); `global.json` pins SDK 10.
- `IdleHold.Engine`: pure game rules (`GameEngine`, `GameState`, `GameContent`, `Experience`).
- `IdleHold.Api` (Minimal APIs), referencing the Engine:
  - `Players/`: `PlayerService` catches the player up to "now" with `Tick`; reads never write, commands apply and save. `IPlayerStore` + `InMemoryPlayerStore`, endpoints and DTOs. Commands return `CommandResult` (Done / NotFound / Forbidden), and the ownership check runs inside the store's update, so it repeats on every concurrency retry.
  - `Persistence/`: `GameDbContext` (EF Core), `PlayerRecord` (`players` table: `id`, `state` as `jsonb`, `last_updated`, `xmin` as concurrency token), `StateDocument` (the versioned saved shape of `GameState`), `PostgresPlayerStore` (optimistic concurrency with retries; an update that returns its input unchanged skips the write), and `Migrations/` (generated, never hand-edited).
  - `Accounts/`: `Account` (Identity user, `Guid` key) and `AccountEndpoints`. `GameDbContext` inherits `IdentityDbContext`, so `AspNetUsers` lives in the same database; `players.account_id` (unique, nullable) links an account to its one hold.
- With a `ConnectionStrings:Game` value the API saves to Postgres and enables accounts; without one it uses the in-memory store and has no account routes. Development applies migrations on start.

## Endpoints

- `GET /health`, `GET /content`.
- Guest: `POST /players`, `GET /players/{id}`, `POST|DELETE /players/{id}/action` (403 once the hold belongs to an account).
- Accounts: `POST /account/register` (optional `guestPlayerId` keeps the guest's progress), `POST /account/login`, `POST /account/logout`, `GET /account/me`.
- Signed in: `GET /me/player`, `POST|DELETE /me/player/action`.
- Session: Identity's cookie `idlehold.session`, HttpOnly, SameSite=Strict, 30 days sliding. Unauthenticated calls get 401, never a redirect. Login answers one 401 for wrong password, unknown e-mail and lockout.

## Rules

- The engine is pure: no ASP.NET Core, databases, file system, network, `DateTime.Now`/`UtcNow` or unseeded randomness. The Api references the Engine, never the reverse.
- `GameState` is immutable: engine methods return a new state (`with`), never mutate their input.
- `Tick(state, elapsed)` is constant-time in `elapsed`: compute completions with arithmetic, never a loop per cycle.
- The current time comes only from the injected `TimeProvider`. ASP.NET also uses it for cookie expiry, so test clocks start at a fixed date far in the future (`ApiFactory`: 2100-01-01 12:00 UTC), never the wall clock or a past date.
- Validate request bodies and route values before calling the engine. Responses use DTOs, not engine types.
- Storage only through `IPlayerStore`. Saves are written as `StateDocument`; a change to the saved shape bumps `SchemaVersion` and handles older documents.
- Schema changes go through EF Core migrations; never edit a migration already on `main`.
- Classes and records are `sealed` unless designed for inheritance. `long` for item quantities and XP. Nullable and warnings-as-errors are on; never suppress a warning to pass a build.

## Tests

- `tests/IdleHold.Engine.Tests`: xUnit, engine rules. Any rule change needs tests here.
- `tests/IdleHold.Api.Tests`: integration tests with `WebApplicationFactory` and `FakeTimeProvider` (`ApiFactory`, "Testing" environment, in-memory saves unless given a connection string). Any endpoint change needs tests here. `PostgresPlayerStoreTests` use a throwaway Postgres container (`PostgresFixture`, Testcontainers) and need Docker.
- xUnit v2: use `CancellationToken.None` (there is no `TestContext.Current`).
- Deterministic: no real clock, no real waiting, no shared state between tests.

## Commands (from the root)

- `dotnet test` (Docker must be running).
- `dotnet run --project src/IdleHold.Api` → http://localhost:5085; Scalar docs at `/scalar` (Development only). Manual requests in `src/IdleHold.Api/IdleHold.Api.http`.
- `docker compose up -d`: Postgres 17 on host port **5433** (5433 avoids a native Postgres on 5432; local-only credentials in `docker-compose.yml`).
- New migration: `dotnet ef migrations add <Name> --project src/IdleHold.Api --output-dir Persistence/Migrations` (`dotnet tool restore` once).
