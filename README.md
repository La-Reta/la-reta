# ⚽ Reta Fútbol — Manager estilo FIFA

Dashboard para organizar la reta: jugadores con cartas estilo FIFA, stats,
detalle profesional y generador de equipos balanceados.

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions)
- **shadcn/ui + Base UI** (`base-lyra`) · **Tailwind v4**
- **Drizzle ORM** + **Neon** (Postgres serverless)
- **Jotai** (estado del armador de equipos, persistido en localStorage)
- **Recharts** (radar de atributos)

## Puesta en marcha

1. Configura la base de datos. La `DATABASE_URL` de Neon vive en `.env`
   (también se acepta `.env.local`, que tiene prioridad):

   ```bash
   cp .env.example .env.local   # y pega tu connection string
   ```

2. Crea las tablas y carga datos de ejemplo:

   ```bash
   npm run db:push    # crea el schema en Neon
   npm run db:seed    # inserta el roster de ejemplo (18 jugadores)
   ```

3. Levanta la app:

   ```bash
   npm run dev
   ```

## Scripts de base de datos

| Script                | Qué hace                               |
| --------------------- | -------------------------------------- |
| `npm run db:push`     | Sincroniza el schema con Neon          |
| `npm run db:seed`     | Resetea e inserta jugadores de ejemplo |
| `npm run db:studio`   | Abre Drizzle Studio                    |
| `npm run db:generate` | Genera archivos de migración           |

## Estructura

```
app/
  page.tsx              Dashboard (KPIs, destacados, distribución)
  players/              Galería, detalle, alta y edición
  teams/                Armador de equipos balanceados
  actions/players.ts    Server Actions (crear/editar/borrar)
components/
  fifa-card.tsx         Carta estilo FIFA (tiers por overall)
  player-form.tsx       Formulario con preview de carta en vivo
  player-radar.tsx      Radar de atributos
  team-builder.tsx      Selección + generación de equipos
lib/
  db/                   Drizzle schema, cliente Neon y seed
  ratings.ts            Overall ponderado por posición + tier de carta
  team-balancer.ts      Algoritmo de equipos parejos
  constants.ts          Posiciones, grupos, atributos
```

## Cómo se calcula el overall

Cada posición pertenece a un grupo (GK / DEF / MID / FWD) con pesos distintos
sobre los 6 atributos (PAC, SHO, PAS, DRI, DEF, PHY). Ver `lib/ratings.ts`.
El overall se recalcula en cada guardado. El tier de la carta (bronce / plata /
oro / especial) se deriva del overall.
