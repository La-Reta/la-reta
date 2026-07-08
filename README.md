<div align="center">

# ⚽ Reta Fútbol

**A FIFA-style manager for organizing pickup football ("la reta").**

Players as FIFA-style cards, attribute ratings, professional-looking profiles,
a live scoreboard, and a balanced-team generator — all in one dashboard.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team)
[![Neon](https://img.shields.io/badge/Neon-Postgres-00E599?logo=postgresql&logoColor=white)](https://neon.tech)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

</div>

> This is a **just-for-fun** project. No profit motive, nothing but good vibes and
> a well-organized kickabout. Contributions are welcome — see
> [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## ✨ Features

- **FIFA-style player cards** with position-weighted overall and card tiers
  (bronze / silver / gold / special).
- **Player profiles** — attributes, radar chart, stat history, goal history, and
  open reviews with star ratings and emoji reactions.
- **Balanced team generator** — splits selected players into even sides, spreads
  positions sensibly (it's 7-a-side, so exact spots stay loose), and shuffles for
  variety between generations.
- **Live scoreboard** (`/live`) — track goals in real time and save the match.
- **Community touches** — a rotating "La Reta ____" banner, ideas board, and
  player sign-up requests.
- **Admin area** (`/admin`) — PIN-gated management of players, matches, and
  moderation (archive comments without deleting them).

## 🧱 Stack

- **[Next.js 16](https://nextjs.org)** — App Router, Server Components & Server Actions
- **[shadcn/ui](https://ui.shadcn.com) + [Base UI](https://base-ui.com)** · **[Tailwind CSS v4](https://tailwindcss.com)**
- **[Drizzle ORM](https://orm.drizzle.team)** + **[Neon](https://neon.tech)** (serverless Postgres)
- **[Jotai](https://jotai.org)** for the team-builder state (persisted to `localStorage`)
- **[TanStack Query](https://tanstack.com/query)** (players gallery only)
- **[Recharts](https://recharts.org)** for the attribute radar

## 🚀 Getting started

### Prerequisites

- **Node.js 20+** (22 recommended)
- A free **[Neon](https://neon.tech)** Postgres database

### Setup

```bash
# 1. Clone and install
git clone https://github.com/mrluisfer/la-reta.git
cd la-reta
npm install

# 2. Configure environment
cp .env.example .env.local   # then paste your Neon connection string

# 3. Create the schema and seed sample data
npm run db:push              # sync the Drizzle schema to Neon
npm run db:seed              # insert the sample roster

# 4. Run the app
npm run dev                  # http://localhost:3000
```

### Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable                                     | Required | Description                                                                         |
| -------------------------------------------- | :------: | ----------------------------------------------------------------------------------- |
| `DATABASE_URL`                               |    ✅    | Neon Postgres connection string (the pooled URL works for both app and migrations). |
| `ADMIN_PIN`                                  |          | PIN for the admin area (`/admin`). Defaults to `reta2026`.                          |
| `LIVE_PIN`                                   |          | PIN for the live scoreboard (`/live`). Defaults to `gol2026`.                       |
| `NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN` |          | Cloudflare Web Analytics beacon token.                                              |
| `NEXT_PUBLIC_SITE_URL`                       |          | Canonical / OG base URL (inferred from `VERCEL_URL` on Vercel).                     |

## 📜 Scripts

| Script                | What it does                               |
| --------------------- | ------------------------------------------ |
| `npm run dev`         | Start the dev server                       |
| `npm run build`       | Production build (source of truth for CSS) |
| `npm run start`       | Serve the production build                 |
| `npm run lint`        | Run ESLint                                 |
| `npm run format`      | Format with Prettier                       |
| `npm run db:push`     | Sync the Drizzle schema to Neon            |
| `npm run db:seed`     | Insert the sample roster (⚠️ see below)    |
| `npm run db:studio`   | Open Drizzle Studio                        |
| `npm run db:generate` | Generate migration files                   |

> ⚠️ **Data safety:** `db:seed` **deletes** the `players` table (cascading to
> `match_goals`) but not `matches` / `ideas` / `reta_words`. Never run it — or any
> destructive DML — against real data. Schema changes must be **additive**.

## 🗂️ Project structure

```bash
app/
  page.tsx              Dashboard (KPIs, spotlights, distribution)
  players/              Gallery, detail, create & edit
  teams/                Balanced-team builder
  live/                 Live scoreboard
  admin/                PIN-gated admin area
  actions/*.ts          Server Actions (one file per domain)
components/
  ui/                   shadcn/ui primitives
  app/                  Shell, sidebar, providers
  features/<domain>/    Feature components
  shared/               FIFA card, pitch, etc.
lib/
  db/                   Drizzle schema, Neon client, seed
  ratings.ts            Position-weighted overall + card tier
  team-balancer.ts      Even-teams algorithm
  constants.ts          Positions, groups, attributes
```

## 🧮 How the overall is calculated

Each position belongs to a group (GK / DEF / MID / FWD) with its own weights over
the six attributes (PAC, SHO, PAS, DRI, DEF, PHY) — see `lib/ratings.ts`. The
overall is recomputed on every save, and the card tier (bronze / silver / gold /
special) is derived from it.

## 🤝 Contributing

Contributions of all sizes are welcome! Please read
**[CONTRIBUTING.md](./CONTRIBUTING.md)** and our
**[Code of Conduct](./CODE_OF_CONDUCT.md)** first. Good first steps:

- Open an [issue](https://github.com/mrluisfer/la-reta/issues) for a bug or idea.
- Pick something small and send a focused pull request.

> ⚠️ **Heads-up for contributors:** this is Next.js **16** — several APIs differ
> from older versions. Read the relevant guide in `node_modules/next/dist/docs/`
> before writing framework code (see [`AGENTS.md`](./AGENTS.md)).

## 📄 License

[MIT](./LICENSE) © Luis Alvarez
