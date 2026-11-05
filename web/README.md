# IdleHold web client

React + TypeScript + Vite, styled with Tailwind CSS.

```bash
pnpm install
pnpm dev        # http://localhost:5173, proxies /api to the API on http://localhost:5085
pnpm test
pnpm build
```

The API must be running for the game to load (`dotnet run --project src/IdleHold.Api` from the repository root).

`src/api/schema.d.ts` is generated from the API's OpenAPI document. With the API running, refresh it with `pnpm gen:api`.
