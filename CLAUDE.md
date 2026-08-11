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

Secrets live in **`.env`** (gitignored), not `.env.local`. Next loads `.env` on its own; `drizzle.config.ts` and `lib/db/seed.ts` load both via dotenv with `.env.local` winning. Neon `DATABASE_URL` is already in `.env`. Admin PIN in `ADMIN_PIN` (default `reta2026`), live PIN in `LIVE_PIN` (default `gol2026`). Auth via Clerk (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`). Image uploads via Vercel Blob (`BLOB_READ_WRITE_TOKEN`) — the store must be **public** (photos are served by URL); env is read from `.env`, so after `vercel env pull` copy the token there too.

## Data safety (hard rule)

`db:seed` deletes `players` (cascades to everything FK'd to a player: `match_goals`, `casaca_assignments`, `player_stat_history`, `player_comments`, `generated_reta_players`) but NOT `matches`/`ideas`/`reta_words` — re-seeding accumulates those. **Do not re-seed or run DML against real data.** Schema changes must be additive (new migrations in `drizzle/`, `db:push`); never rewrite seeded/user rows.

## Architecture

FIFA-style dashboard for organizing pickup football ("la reta"). **Next 16 App Router + Server Components/Actions · Drizzle ORM + Neon serverless Postgres · Clerk auth · Vercel Blob uploads · Jotai · TanStack Query (one flow only) · shadcn/ui + Base UI (`base-lyra`) · Tailwind v4.**

- **DB client** (`lib/db/index.ts`): `db` is a lazy `Proxy` — the Neon connection is created on first query so `next build` needs no env at module eval. Any page reading the DB must set `export const dynamic = "force-dynamic"`.
- **Ratings** (`lib/ratings.ts`): overall is a position-group-weighted (GK/DEF/MID/FWD) average of the 6 attributes (PAC/SHO/PAS/DRI/DEF/PHY); card tier (bronze/silver/gold/special) derives from overall. Server Actions in `app/actions/players.ts` **recompute overall on every save**.
- **Positions**: players have `position` + nullable `position2`; helper `playerPositions()` in `lib/format.ts`. `lib/team-balancer.ts` builds even teams (one GK-capable per side, shuffled for variety) returning `Lineup[]` with the role played — overall still uses the primary position.
- **N equipos** (default 2, hasta 6): las letras viven en `lib/teams.ts` (`TEAM_KEYS`, colores, `teamName()`). `balanceTeams(players, teamCount)` devuelve `{ teams: TeamSplit[], diff }` (`diff` = spread max−min) y afina el greedy con una búsqueda local (`refine`). La reta guarda sus N equipos en `generated_retas.teams` (jsonb); las filas viejas se reconstruyen con `retaTeams()` en `lib/queries.ts`. Una reta de 3+ equipos se registra como **un solo partido con marcador de N equipos**: `matches.teams` (jsonb) trae `{key,name,score}` por equipo y `match_goals.team` guarda la letra real (A…F). Los dos primeros equipos se copian siempre a `team_a_name`/`score_a` y su par B, así que todo lo viejo sigue leyendo. Helper `matchTeams()` en `lib/teams.ts` (client-safe) — úsalo en vez de `scoreA`/`scoreB` en cualquier vista nueva. El alta vive en `RetaMatchForm` (`/matches`): arma la reta a mano o prellena desde una generada y deja agregar jugadores/invitados y quitar a quien no llegó. `MatchForm` ya solo se usa en `/matches/[id]/edit`. `updateMatch` conserva `teams` cuando la forma de edición (de 2 lados) no lo manda. La rotación "gana y se queda" es `lib/live-rotation.ts` (self-check: `npx tsx lib/live-rotation.ts`).
- **Server Actions** live in `app/actions/*.ts`, one file per domain (players, matches, ideas, words, comments, reports, legal, admin, casacas, retas, uploads, player-signups). Prefer RSC + Server Actions; **TanStack Query is used ONLY in the players gallery** (`hooks/use-players.ts` + `GET /api/players`, seeded with server `initialData`).
- **State**: Jotai atoms in `lib/state/atoms.ts`. Live match (`/live`) uses `liveMatchAtom` (`atomWithStorage`, clave `reta:live-match-v2`) — lleva todos los equipos + `home`/`away`/`queue`; "Finalizar" llama `createMatch` y "Guardar y siguiente" además rota. Nombres y número de equipos se comparten con /teams (`teamNamesAtom`, `teamCountAtom`). Team builder selection + last-minute guests are also Jotai/localStorage.
- **Schema** (`lib/db/schema.ts`): `players`, `player_stat_history`, `player_comments`, `comment_reactions`, `matches`, `match_goals`, `generated_retas`, `generated_reta_players`, `ideas`, `reta_words`, `legal_acceptances`, `reports`, `player_signups`, `casaca_assignments`. `getTopScorers` aggregates goals across `match_goals`.
- **Auth**: Clerk (`@clerk/nextjs`). `middleware.ts` runs `clerkMiddleware()` — no route gating yet, it just exposes the session so `auth()` / `currentUser()` work anywhere. Sign-in/up at `/sign-in`, `/sign-up`. This is **separate** from the admin PIN cookie.
- **Admin**: `/admin*` gated by PIN cookie `reta_admin` — see `lib/admin.ts` `isAdmin()`. Admin-only UI (kebab actions, etc.) is conditionally rendered. Sensitive actions allow `isAdmin()` **or** a signed-in Clerk user.
- **Image uploads**: Vercel Blob (`@vercel/blob`). Simple server action `app/actions/uploads.ts` (`put`, `access:"public"`) plus an optimized client-upload flow (`components/ImageUploader.tsx` → `app/api/blob/upload/route.ts`, WebP). Store must be **public**. `lib/queries.ts` overlays a local `public/players/<id>` image over `photoUrl` when present.
- **Casacas** (`/casacas`): a from-scratch SVG wheel (`components/features/casacas/wheel.tsx`) that randomly picks who washes the bibs. Pure logic in `lib/casacas.ts` (excludes the last 2 winners; self-check via `npx tsx lib/casacas.ts`). Persisted in `casaca_assignments` (roster `playerId` **or** guest `guestName`). Logic lives in the `useCasacaWheel` hook; UI split into `wheel-panel` / `casaca-history` / `winner-dialog`.

### UI conventions

- Display font is **Oswald** via `next/font` (`--font-oswald`). Tailwind v4 did NOT generate `font-display` from the `@theme` token — it's hand-defined in `app/globals.css` (`@layer utilities`). Use `font-display`.
- `components/ui/button.tsx` is modified: when `render` is passed (e.g. `<Button render={<Link/>}>`) it sets `nativeButton={false}` to avoid a Base UI warning. Keep this if regenerating.
- Component layout: `components/ui/*` (shadcn primitives), `components/app/*` (shell/sidebar/providers), `components/features/<domain>/*`, `components/shared/*` (fifa-card, pitch, page-header, section-heading).
- **Reusable page chrome**: every view's header is `<PageHeader title description actions />` (`components/shared/page-header.tsx`); section separators with the accent bar are `<SectionHeading title count? tone? />` (`components/shared/section-heading.tsx`, tones `primary`/`emerald`/`muted`). Reach for these instead of re-inlining an `h1`/`h2`.
- **Prefer shadcn primitives over bespoke containers**: cards/panels use `Card`/`CardContent` (theme radius is `rounded-xl`; use `size="sm"` for compact density), empty states use `Empty`. Don't hand-roll `bg-card ring rounded-lg` boxes.
- Dashboard banner rotates a colored word via `getBannerWords()` = base `constants/rotatingWords.ts` + user `reta_words`, deduped; starts on index 0 so SSR/client match.

If a new Tailwind/`@theme` class doesn't appear, the long-running dev server may be serving stale CSS: `rm -rf .next/dev` and relaunch. Production build is the truth.
