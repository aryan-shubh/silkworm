# silkworm

A research-grade experiment tracker. W&B-shaped, with sharper edges and a saner ingest path.

See [`DESIGN.md`](./DESIGN.md) for the half-page system design.

---

## Stack

| Layer       | Choice                                                  |
| ----------- | ------------------------------------------------------- |
| Frontend    | Next.js 15 · React 19 · TypeScript · Tailwind v4        |
| Charts      | [EvilCharts](https://evilcharts.com) on Recharts + Motion |
| Auth        | Better Auth (scaffolded, not yet wired)                 |
| DB (OLTP)   | PlanetScale (MySQL) · Drizzle ORM (schema only so far)  |
| Metrics     | ClickHouse (planned · phase 2)                          |
| Ingest      | AWS Kinesis → Lambda → ClickHouse (planned · phase 2)   |
| Artifacts   | S3 + content-addressed chunks (planned · phase 2)       |
| RAG         | Qdrant + Claude Sonnet 4.6 (planned · phase 3)          |
| Runtime     | Bun                                                     |

Typography: Instrument Serif (display) · IBM Plex Sans (UI) · JetBrains Mono (data).

## Quick start

```bash
bun install
cp .env.example .env.local       # set DATABASE_URL to your PlanetScale dev branch
bun run db:push                  # apply schema
bun run db:seed                  # load the demo acme org + MNIST run
bun dev
```

Open <http://localhost:3000>. The landing renders at `/`; the dashboard is at `/dashboard`.

## Routes

| Path                          | What's there                                                                                  |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| `/`                           | Projects grid                                                                                 |
| `/p/[project]`                | Runs table for one project · overlay chart of all runs · filter bar                           |
| `/p/[project]/runs/[runId]`   | Single-run detail: 5 metric tiles, 6 glowing charts, config + system + live log, artifacts    |

Right now every page reads from `src/lib/mock.ts` — deterministic seeded fake runs. No database call happens at request time.

## Project layout

```
src/
├─ app/
│  ├─ (app)/             # authed shell (sidebar layout)
│  │  ├─ page.tsx        # projects grid (the new root)
│  │  └─ p/[project]/
│  │     ├─ page.tsx     # runs table
│  │     └─ runs/[runId]/page.tsx
│  ├─ globals.css        # Tailwind v4 @theme + custom utilities
│  └─ layout.tsx
├─ components/
│  ├─ app/               # sidebar, page header
│  ├─ charts/            # MetricChart (EvilCharts wrapper)
│  ├─ evilcharts/        # generated from the EvilCharts registry
│  └─ ui/                # sparkline, pill, kbd, status-dot, tick-rule
└─ lib/
   ├─ schema.ts          # Drizzle schema (users, orgs, projects, runs, artifacts)
   ├─ db.ts              # PlanetScale serverless client (unused for now)
   ├─ mock.ts            # deterministic mock data
   └─ utils.ts
```

## Status

| Phase | Scope                                                     | State     |
| ----- | --------------------------------------------------------- | --------- |
| 1     | UI scaffold · dashboard · runs · run detail · mock data   | ✅ done   |
| 2     | Python SDK · PlanetScale · ClickHouse · Kinesis · S3      | not started |
| 3     | Sweeps · artifact CAS · Qdrant + RAG · self-host (SST)    | not started |

## Scripts

```bash
bun dev              # next dev (turbopack)
bun run build        # production build
bun run lint         # biome check
bun run format       # biome format --write
bun run db:generate  # drizzle migrations
bun run db:push      # push schema to PlanetScale
```

## Notes

- **Bun + kysely**: Better Auth's kysely-adapter pulls in sqlite dialect bundles that break on the latest kysely. Pinned to `kysely@^0.27.6` for now.
- **Tailwind v4**: design tokens live in `src/app/globals.css` under `@theme`. No `tailwind.config`.
- **EvilCharts registry**: configured under `@evilcharts` in `components.json` pointing at `https://evilcharts.com/r/{name}.json` (no `www` — the apex doesn't redirect cleanly).

## License

Private. Internal scaffold.
