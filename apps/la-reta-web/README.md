# ⚽ Reta Fútbol — web app

The Next.js 16 app: dashboard, player gallery, team builder, live scoreboard, admin area, and the `/api/v1` endpoints the [mobile app](../la-reta-app/README.md) consumes. It owns the database and is the source of truth for the project's data.

> Project overview, install steps and contribution guide live at the [monorepo root](../../README.md).

## Stack

- **[Next.js 16](https://nextjs.org)** — App Router, Server Components & Server Actions
- **[shadcn/ui](https://ui.shadcn.com) + [Base UI](https://base-ui.com)** · **[Tailwind CSS v4](https://tailwindcss.com)**
- **[Drizzle ORM](https://orm.drizzle.team)** + **[Neon](https://neon.tech)** (serverless Postgres)
- **[Clerk](https://clerk.com)** for authentication
- **[Vercel Blob](https://vercel.com/docs/vercel-blob)** for image uploads (public store)
- **[Jotai](https://jotai.org)** for team-builder / live / casacas state (persisted to `localStorage`)
- **[TanStack Query](https://tanstack.com/query)** (players gallery only)
- **[Recharts](https://recharts.org)** for the attribute radar

## Running it

From the monorepo root:

```bash
npm install
cp apps/la-reta-web/.env.example apps/la-reta-web/.env.local
npm run db:push -w la-reta-web
npm run db:seed -w la-reta-web
npm run dev:web              # http://localhost:3000
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Description |
| --- | :-: | --- |
| `DATABASE_URL` | ✅ | Neon Postgres connection string (the pooled URL works for both app and migrations). |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |  | Clerk publishable key (needed for sign-in / accounts). |
| `CLERK_SECRET_KEY` |  | Clerk secret key. |
| `BLOB_READ_WRITE_TOKEN` |  | Vercel Blob token for image uploads. The store must be **public**. |
| `BLOB_STORE_ID` |  | Vercel Blob store id. |
| `ADMIN_PIN` |  | PIN for the admin area (`/admin`). Defaults to `reta2026`. |
| `LIVE_PIN` |  | PIN for the live scoreboard (`/live`). Defaults to `gol2026`. |
| `PIN_TOKEN_SECRET` |  | Signs the tokens that redeem the admin/live PIN for native clients (`POST /api/v1/auth/pin`). Required for that route. |
| `API_ALLOWED_ORIGINS` |  | Comma-separated CORS origins for `/api/v1` (only needed for Expo web). |
| `NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN` |  | Cloudflare Web Analytics beacon token. |
| `NEXT_PUBLIC_SITE_URL` |  | Canonical / OG base URL (inferred from `VERCEL_URL` on Vercel). |

## Scripts

Run them with `-w la-reta-web` from the root, or directly inside this folder.

| Script                | What it does                               |
| --------------------- | ------------------------------------------ |
| `npm run dev`         | Start the dev server                       |
| `npm run build`       | Production build (source of truth for CSS) |
| `npm run start`       | Serve the production build                 |
| `npm run check-types` | `next typegen` + `tsc --noEmit`            |
| `npm run db:push`     | Sync the Drizzle schema to Neon            |
| `npm run db:seed`     | Insert the sample roster (⚠️ see below)    |
| `npm run db:studio`   | Open Drizzle Studio                        |
| `npm run db:generate` | Generate migration files                   |

Linting and formatting are handled at the root by Ultracite (`npm run check` / `npm run fix`).

> ⚠️ **Data safety:** `db:seed` **deletes** the `players` table (cascading to `match_goals`) but not `matches` / `ideas` / `reta_words`. Never run it — or any destructive DML — against real data. Schema changes must be **additive**.

## Project structure

```bash
app/
  page.tsx              Dashboard (KPIs, spotlights, distribution)
  players/              Gallery, detail, create, edit & sign-up
  teams/                Balanced-team builder (+ guests, generation registry)
  live/                 Live scoreboard
  casacas/              Spin-the-wheel for who washes the bibs
  matches/              Match history + detail
  ideas/ reportes/ palabras/ legal/   Community & info views
  sign-in/ sign-up/     Clerk auth pages
  admin/                PIN-gated admin area
  api/                  Route handlers (players, blob upload) + v1 API for native
  actions/*.ts          Server Actions (one file per domain)
components/
  ui/                   shadcn/ui primitives
  app/                  Shell, sidebar, providers
  features/<domain>/    Feature components
  shared/               FIFA card, pitch, page-header, section-heading
lib/
  db/                   Drizzle schema, Neon client, seed
  ratings.ts            Position-weighted overall + card tier
  team-balancer.ts      Even-teams algorithm
  casacas.ts            Wheel eligibility + landing math (has a self-check)
  guests.ts             Last-minute guest players (negative ids)
  constants.ts          Positions, groups, attributes
```

## How the overall is calculated

Each position belongs to a group (GK / DEF / MID / FWD) with its own weights over the six attributes (PAC, SHO, PAS, DRI, DEF, PHY) — see `lib/ratings.ts`. The overall is recomputed on every save, and the card tier (bronze / silver / gold / special) is derived from it.

> ⚠️ This is Next.js **16** — several framework APIs differ from older versions. Read the relevant guide in `node_modules/next/dist/docs/` before writing framework code (see [`AGENTS.md`](./AGENTS.md)).
