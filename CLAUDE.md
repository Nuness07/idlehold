# IdleHold

Browser idle game (genre inspiration: Melvor Idle — skills, progression, resources accumulating over time). The project is **original**: genre mechanics yes; names, art or content from existing games no.

## How to work on this project

- Visible engineering quality: clear architecture, tests, a good README, a clean commit history.
- **Explain** what is being done and why. Before adopting a technology or pattern, present the trade-offs; the project owner decides.
- Prefer small, incremental steps. Start simple and evolve.
- Talk to the project owner in **Portuguese**. Everything inside the repository (code, names, comments, commits, PRs, docs) is in **English**.
- Commits and PRs never include co-author or AI attribution lines.

## Workflow (Git and PRs)

`main` is protected by the "Protect main" ruleset on GitHub. It rejects direct pushes, force pushes and deletion.

1. Create a branch from an up-to-date `main` (`feat/...`, `fix/...`, `docs/...`, `chore/...`, `ci/...`).
2. Use Conventional Commits, without co-author lines.
3. Open the PR with `gh pr create` (description with what / why / how to test).
4. Codex reviews automatically when the PR is opened (👀 reaction, then 👍 or comments). It is the default reviewer.
5. CodeRabbit is **opt-in**: it only reviews when the project owner comments `@coderabbitai review`. Never post that comment on your own.
6. Read the reviewers' comments and fix them in the same PR. All conversations must be resolved before merging.
7. The "Build and test" (.NET) and "Web" (frontend) checks from GitHub Actions must be green. They are the required checks.
8. The project owner does the merge.

## Design pillars

- **The village is the core.** The player manages a small village rebuilt after the old one was attacked; skills feed the village, and unlockable villagers take on work. Game design ideas, their status and the proposed order live in `docs/game-design.md`. Ideas there are not decisions until marked "Decided"; do not implement them before discussing with the project owner.
- **Reward active play.** The game is idle, but being present has to be genuinely worth it. This must not be just "actions take less time": the idea is decisions, events and interaction that make sense for someone who is playing. The mechanic is not defined yet; do not implement it before discussing it with the project owner.

## Roadmap (high level)

1. **MVP**: open it in the browser, click, progress, save (saves already live on the server, because the server is authoritative).
2. **Accounts + server saves**: sign up, log in, progress persisted in the backend.
3. **Data at scale**: the game must handle a lot of data (many items, skills, players, history).
4. **Multiplayer (future)**: interaction between players (market, leaderboards, chat, etc.). The architecture should leave the door open without implementing it ahead of time.

## Structure and commands

- `IdleHold.slnx`: .NET solution. `Directory.Build.props` holds shared settings (net10.0, nullable, warnings as errors). `global.json` pins SDK 10.
- `src/IdleHold.Engine`: pure game rules (`GameEngine`, `GameState`, `GameContent`, `Experience`). Must not depend on web, databases or I/O.
- `src/IdleHold.Api`: ASP.NET Core API (Minimal APIs) that references the Engine. Never the reverse.
  - `Players/`: `PlayerService` (catches the player up to "now" with `Tick`, applies the command, saves), `IPlayerStore` + `InMemoryPlayerStore`, endpoints and DTOs.
  - `Persistence/`: `GameDbContext` (EF Core), `PlayerRecord` (`players` table: `id`, `state` as `jsonb`, `last_updated`, `xmin` as concurrency token), `StateDocument` (the versioned saved shape of `GameState`, separate from the engine type), `PostgresPlayerStore` (optimistic concurrency with retries), and `Migrations/` (generated, never hand-edited).
  - With a `ConnectionStrings:Game` value the API saves to Postgres; without one it falls back to the in-memory store. Development applies migrations on start.
  - Endpoints: `GET /health`, `GET /content`, `POST /players`, `GET /players/{id}`, `POST /players/{id}/action`, `DELETE /players/{id}/action`.
  - The current time always comes from the injected `TimeProvider`. Never use `DateTime.Now` directly.
- `tests/IdleHold.Engine.Tests`: xUnit, engine tests.
- `tests/IdleHold.Api.Tests`: integration tests with `WebApplicationFactory` and `FakeTimeProvider` (`ApiFactory`, which runs in a "Testing" environment with in-memory saves unless given a connection string). `PostgresPlayerStoreTests` use a throwaway Postgres container (`PostgresFixture`, Testcontainers) and need Docker running.
- Run the tests: `dotnet test` (from the root; Docker must be running).
- Local database: `docker compose up -d` starts Postgres 17 on host port **5433** (`docker-compose.yml`, local-only credentials; 5433 avoids a natively installed Postgres on 5432). New migration: `dotnet ef migrations add <Name> --project src/IdleHold.Api --output-dir Persistence/Migrations` (`dotnet-ef` is a local tool in `dotnet-tools.json`; run `dotnet tool restore` once).
- `web/`: React + TypeScript + Vite + Tailwind CSS v4 client (pnpm). Feature folders under `web/src/features` (`player`, `actions`, `trades`, `stores`); typed API client in `web/src/api` (`schema.d.ts` is generated, never hand-edited); display names and trade paints in `web/src/content/labels.ts`; design tokens in the `@theme` block of `web/src/index.css`.
  - Languages: English and Brazilian Portuguese with react-i18next. All UI copy and content names (trades, actions, items, with plural forms) live in `web/src/i18n/locales/en.ts` and `pt-BR.ts`; `pt-BR` is typed against `en`, so a missing key fails the build. Never hard-code UI text in components. `web/src/content/labels.ts` holds only paints, icons and sprites; `web/src/content/text.ts` resolves content names. The language switch is in the header; the first visit follows the browser language and the choice is saved.
  - The client never computes rewards or XP rules. It animates the working bar locally and refetches when a cycle ends; numbers on screen come from the server.
  - Commands (in `web/`): `pnpm dev` (http://localhost:5173, proxies `/api` to the API), `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm gen:api` (regenerates types from a running API).
- Visual design: PRODUCT.md holds product context. The visual direction is "Guild Signboards": each trade hangs a painted sign; limestone ground, oxblood band, one paint per trade, ochre only for what is working; Grenze Gotisch for the wordmark and trade names only, Alegreya Sans for everything else.
- Run the API: `dotnet run --project src/IdleHold.Api` → http://localhost:5085. Interactive docs (Scalar) at http://localhost:5085/scalar, Development only. Manual requests live in `src/IdleHold.Api/IdleHold.Api.http`.

## Technical decisions

Record every decision here, with the reason in one line.

- **Backend in C# / .NET (ASP.NET Core)**: strong typing, performance, and SignalR for real-time multiplayer.
- **Server-authoritative**: game rules live only in C#. The client never decides outcomes; it receives state and timestamps and only animates progress. This prevents cheating and prepares for multiplayer.
- **Pure game engine** (`state = Tick(state, elapsed)`) in a class library separate from the API: enables offline progress computed on the server and easy testing.
- **Frontend: React + TypeScript + Vite** (Vite 8 uses Rolldown). The client is a "screen" with no game rules.
- **Tests:** xUnit on the backend, Vitest on the frontend.
- **Monorepo:** root folder with `.slnx` for .NET and a pnpm workspace for the frontend; Turborepo only if needed.
- **Minimal APIs** (not Controllers): Microsoft's current default, with less ceremony.
- **Postgres, with the game state as `jsonb`**: relational for what will need transactions and queries (accounts, market, leaderboards), a JSON document for the state the engine reads and writes whole. A field that needs indexing later (for a leaderboard) gets promoted to its own column.
- **EF Core + Npgsql, migrations in the repo**; local Postgres in Docker, a managed Postgres (likely Neon) when deployed.
- **Optimistic concurrency on `xmin`** instead of locks: a conflicting write reloads the newer state and reapplies the command.
- **Saved state is a versioned document (`StateDocument`)**, not the engine record, so engine refactors cannot break existing saves.
- **Accounts (next): ASP.NET Core Identity with cookie auth, guest first.** Players start as guests; the game asks them to create an account later and the guest's progress moves to it. A future tutorial runs as a guest, and the account is asked for when the real game starts.
- **Player id in the URL** (temporary, insecure): becomes `/me` once auth is added.
- **Lazy evaluation:** every request runs `Tick(state, now − LastUpdated)`. Nothing runs while the player is away.
- **TypeScript 7 (native compiler)** in `web/`. `openapi-typescript` still needs the TypeScript 5 JS API, so `gen:api` runs it through `pnpm dlx` with TypeScript 5.9 in isolation.
- **API JSON numbers are strict** (`JsonNumberHandling.Strict`), so the OpenAPI document types numbers as `number`, not `number | string`.
- **Skill responses carry level bounds** (`levelStartXp`, `nextLevelXp`), so the client shows level progress without reimplementing the XP curve.
- **Server state via TanStack Query; types via OpenAPI** (`openapi-fetch` + generated `schema.d.ts`).
- **Self-hosted fonts** through Fontsource; icons from Lucide.
- **i18n with react-i18next** (English + pt-BR): the market standard, with plural rules from `Intl` per language and typed keys.
- **Pixel art for world objects only**, generated with PixelLab Pro against `art/style-reference.png` (the tree and log sprites): one style base keeps every sprite consistent. Rules and the asset log live in `docs/art-direction.md`.
- **Open questions:** hosting, real time (SignalR, when multiplayer arrives).
