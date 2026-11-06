# AGENTS.md

Guidance for AI coding agents and reviewers working on IdleHold. This file loads in every session, so it stays short; details live in the files it points to.

## Project

IdleHold is an original browser idle game (genre: Melvor Idle; mechanics yes, names, art or content from existing games no). The backend is C#/.NET 10 and **server-authoritative**: all game rules run on the server, and the client only renders state.

```
src/IdleHold.Engine   Pure game rules
src/IdleHold.Api      ASP.NET Core Minimal API around the engine, Postgres saves, Identity accounts
tests/                xUnit: engine unit tests, API integration tests
web/                  React + TypeScript + Vite + Tailwind client (pnpm)
```

## Where to read more

| Working on | Read first |
|---|---|
| Engine, API, backend tests | `src/AGENTS.md` |
| Web client | `web/AGENTS.md` |
| Why something is the way it is | `docs/decisions.md` (add every new decision there, with the reason in one line) |
| Game design | `docs/game-design.md` (only "Decided" items are decisions) |
| Visual design and art | `PRODUCT.md`, `DESIGN.md`, `docs/art-direction.md` |

## Design pillars

- **The village is the core.** Skills feed a village rebuilt after the old one was attacked; unlockable villagers take on work.
- **Reward active play.** Being present has to matter through decisions, events and interaction, not just faster actions.
- Do not implement game design ideas, or the active-play mechanic, before the project owner decides them.

## Roadmap

1. MVP (done). 2. Accounts and server saves (done). 3. Data at scale. 4. Multiplayer (market, leaderboards, chat): leave the door open, do not build ahead.

## Rules for every change

- Prefer small, incremental steps. Start simple and evolve.
- Game rules live only in the engine. The web client never computes rewards, XP or levels.
- No real secret is ever committed. Local-only Docker credentials are fine; production values come from environment variables (for example `ConnectionStrings__Game`).
- Guest routes refuse a hold that belongs to an account. Login errors never reveal whether an e-mail has an account. Passwords are handled only by ASP.NET Core Identity.
- Everything in the repository (code, names, comments, commits, PRs, docs) is in English.
- Conventional Commits (`feat:`, `fix:`, `docs:`, `ci:`, `chore:`, `test:`, `refactor:`). Commits and pull requests never include AI co-author or attribution lines.

## Workflow

`main` is protected (no direct push, force push or deletion).

1. Branch from an up-to-date `main` (`feat/...`, `fix/...`, `docs/...`, `chore/...`, `ci/...`).
2. Open the PR with `gh pr create` (what / why / how to test).
3. Codex reviews automatically. CodeRabbit reviews only when the project owner comments `@coderabbitai review`; never post that comment.
4. Fix reviewers' comments in the same PR; all conversations resolved before merging.
5. Required checks: "Build and test" (.NET) and "Web". The project owner merges.

## Commands

```bash
docker compose up -d     # local Postgres on port 5433; also needed by the Testcontainers tests
dotnet test              # from the root
cd web && pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

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
- Web UI text is hard-coded instead of coming from the locale files.

Do not flag pure formatting or naming preferences unless they hurt readability.
