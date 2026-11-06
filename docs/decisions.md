# Technical decisions

Every decision, with the reason in one line. Add new ones here; the agent guides (`AGENTS.md` files) keep only the rules that follow from them.

## Architecture

- **Backend in C# / .NET (ASP.NET Core)**: strong typing, performance, and SignalR for real-time multiplayer.
- **Server-authoritative**: game rules live only in C#. The client never decides outcomes; it receives state and timestamps and only animates progress. This prevents cheating and prepares for multiplayer.
- **Pure game engine** (`state = Tick(state, elapsed)`) in a class library separate from the API: enables offline progress computed on the server and easy testing.
- **Minimal APIs** (not Controllers): Microsoft's current default, with less ceremony.
- **Monorepo:** root folder with `.slnx` for .NET and a pnpm workspace for the frontend; Turborepo only if needed.
- **Lazy evaluation:** every request runs `Tick(state, now − LastUpdated)`. Nothing runs while the player is away.
- **Reads never write.** The current state follows from the save, its timestamp and the clock, and `Tick` is deterministic and constant-time, so `GET` only computes. Only commands save, which cuts writes from every poll to every player action and removes almost all concurrency conflicts.

## Data

- **Postgres, with the game state as `jsonb`**: relational for what will need transactions and queries (accounts, market, leaderboards), a JSON document for the state the engine reads and writes whole. A field that needs indexing later (for a leaderboard) gets promoted to its own column.
- **EF Core + Npgsql, migrations in the repo**; local Postgres in Docker, a managed Postgres (likely Neon) when deployed.
- **Optimistic concurrency on `xmin`** instead of locks: a conflicting write reloads the newer state and reapplies the command.
- **Saved state is a versioned document (`StateDocument`)**, not the engine record, so engine refactors cannot break existing saves.

## Accounts

- **ASP.NET Core Identity with cookie auth, guest first** (API and web screens done). Players start as guests; the game asks them to create an account later and the guest's progress moves to it. A future tutorial runs as a guest, and the account is asked for when the real game starts.
- **Guest routes keep the player id in the URL** (`/players/{id}`): fine for an unowned guest hold; once a hold belongs to an account, only the signed-in `/me/player` routes reach it.

## API contract

- **API JSON numbers are strict** (`JsonNumberHandling.Strict`), so the OpenAPI document types numbers as `number`, not `number | string`.
- **Skill responses carry level bounds** (`levelStartXp`, `nextLevelXp`), so the client shows level progress without reimplementing the XP curve.

## Frontend

- **React + TypeScript + Vite** (Vite 8 uses Rolldown). The client is a "screen" with no game rules.
- **TypeScript 7 (native compiler)** in `web/`. `openapi-typescript` still needs the TypeScript 5 JS API, so `gen:api` runs it through `pnpm dlx` with TypeScript 5.9 in isolation.
- **Server state via TanStack Query; types via OpenAPI** (`openapi-fetch` + generated `schema.d.ts`).
- **i18n with react-i18next** (English + pt-BR): the market standard, with plural rules from `Intl` per language and typed keys.
- **Self-hosted fonts** through Fontsource; icons from Lucide.
- **Pixel art for world objects only**, generated with PixelLab Pro against `art/style-reference.png` (the tree and log sprites): one style base keeps every sprite consistent. Rules and the asset log live in `docs/art-direction.md`.

## Testing

- **xUnit on the backend, Vitest on the frontend.**

## Agent context

- **Short root guides, details on demand**: the root `AGENTS.md` and `CLAUDE.md` load in every agent session, so they hold only rules and an index; per-area rules live in `src/AGENTS.md` and `web/AGENTS.md`, and the rest in `docs/`. A large always-loaded guide makes every step of every session more expensive.

## Before deploying

- Persist ASP.NET Data Protection keys (they sign the session cookie; if they live only in the container, every restart signs everyone out).
- Send e-mail for confirmation and password reset.
- Serve over HTTPS so the cookie is Secure.

## Open questions

- Hosting.
- Real time (SignalR, when multiplayer arrives).
