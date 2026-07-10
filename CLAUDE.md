# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

**Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/`** (per AGENTS.md above — this is Next 16.2.9 and APIs differ from training data). Real deltas noted in those docs: `unstable_instant` for instant navigation, `refresh()` from `next/cache`.

**Before writing/customizing Base UI (`@base-ui/react`) code, consult `docs/base-ui-llms.txt`** — an index of the official docs (`base-ui.com/react/**.md`). Find the relevant component/handbook page and `WebFetch` its `.md` URL before coding; the `render` prop, `nativeButton`, and slot composition differ from memory.

**Skills:** This session ships Vercel (`vercel:*`) and Neon (`neon`, `neon-postgres`) skills. Prefer them over memorized APIs for anything touching Vercel deploys/env or Neon Postgres.

## Commands

```bash
npm run dev          # dev server
npm run build        # production build (source of truth for CSS — dev can serve stale @theme)
npm run lint         # eslint
npm run format       # prettier --write .
npm run db:push      # sync Drizzle schema → Neon
npm run db:seed      # tsx lib/db/seed.ts (see warning below)
npm run db:studio    # Drizzle Studio
npm run db:generate  # generate migration files
```

No test runner is configured.

## Environment

Secrets live in **`.env`** (gitignored), not `.env.local`. Next loads `.env` on its own; `drizzle.config.ts` and `lib/db/seed.ts` load both via dotenv with `.env.local` winning. Neon `DATABASE_URL` is already in `.env`. Admin PIN in `ADMIN_PIN` (default `reta2026`).

## Data safety (hard rule)

`db:seed` deletes `players` (cascades to `match_goals`) but NOT `matches`/`ideas`/`reta_words` — re-seeding accumulates those. **Do not re-seed or run DML against real data.** Schema changes must be additive (new migrations in `drizzle/`, `db:push`); never rewrite seeded/user rows.

## Architecture

FIFA-style dashboard for organizing pickup football ("la reta"). **Next 16 App Router + Server Components/Actions · Drizzle ORM + Neon serverless Postgres · Jotai · TanStack Query (one flow only) · shadcn/ui + Base UI (`base-lyra`) · Tailwind v4.**

- **DB client** (`lib/db/index.ts`): `db` is a lazy `Proxy` — the Neon connection is created on first query so `next build` needs no env at module eval. Any page reading the DB must set `export const dynamic = "force-dynamic"`.
- **Ratings** (`lib/ratings.ts`): overall is a position-group-weighted (GK/DEF/MID/FWD) average of the 6 attributes (PAC/SHO/PAS/DRI/DEF/PHY); card tier (bronze/silver/gold/special) derives from overall. Server Actions in `app/actions/players.ts` **recompute overall on every save**.
- **Positions**: players have `position` + nullable `position2`; helper `playerPositions()` in `lib/format.ts`. `lib/team-balancer.ts` builds even teams (one GK-capable per side, shuffled for variety) returning `Lineup[]` with the role played — overall still uses the primary position.
- **Server Actions** live in `app/actions/*.ts`, one file per domain (players, matches, ideas, words, comments, reports, legal, admin). Prefer RSC + Server Actions; **TanStack Query is used ONLY in the players gallery** (`hooks/use-players.ts` + `GET /api/players`, seeded with server `initialData`).
- **State**: Jotai atoms in `lib/state/atoms.ts`. Live match (`/live`) uses `liveMatchAtom` (`atomWithStorage`) — client-persisted score with optional scorers, "Finalizar" calls `createMatch`. Team builder selection is also Jotai/localStorage.
- **Schema** (`lib/db/schema.ts`): `players`, `player_stat_history`, `player_comments`, `matches`, `match_goals`, `ideas`, `reta_words`, `legal_acceptances`, `reports`. `getTopScorers` aggregates goals across `match_goals`.
- **Admin**: `/admin*` gated by PIN cookie `reta_admin` — see `lib/admin.ts` `isAdmin()`. Admin-only UI (kebab actions, etc.) is conditionally rendered.

### UI conventions

- Display font is **Oswald** via `next/font` (`--font-oswald`). Tailwind v4 did NOT generate `font-display` from the `@theme` token — it's hand-defined in `app/globals.css` (`@layer utilities`). Use `font-display`.
- `components/ui/button.tsx` is modified: when `render` is passed (e.g. `<Button render={<Link/>}>`) it sets `nativeButton={false}` to avoid a Base UI warning. Keep this if regenerating.
- Component layout: `components/ui/*` (shadcn primitives), `components/app/*` (shell/sidebar/providers), `components/features/<domain>/*`, `components/shared/*` (fifa-card, pitch).
- Dashboard banner rotates a colored word via `getBannerWords()` = base `constants/rotatingWords.ts` + user `reta_words`, deduped; starts on index 0 so SSR/client match.

If a new Tailwind/`@theme` class doesn't appear, the long-running dev server may be serving stale CSS: `rm -rf .next/dev` and relaunch. Production build is the truth.
