import Link from "next/link";
import Image from "next/image";
import {
  ArrowRightIcon,
  ShuffleIcon,
  UserPlusIcon,
  ShieldHalfIcon,
  TrophyIcon,
  RadioIcon,
} from "lucide-react";
import { getPlayers, getBannerWords, getTopScorers } from "@/lib/queries";
import { FifaCard } from "@/components/shared/fifa-card";
import { LineupBoard } from "@/components/features/dashboard/lineup-board";
import { Commentator } from "@/components/features/dashboard/commentator";
import { RotatingWord } from "@/components/features/dashboard/rotating-word";
import { RotatingPlayer } from "@/components/features/dashboard/rotating-player";
import { Button } from "@/components/ui/button";
import { flagEmoji } from "@/lib/format";
import {
  positionGroup,
  GROUP_LABEL,
  GROUP_COLOR,
  type PositionGroup,
} from "@/lib/constants";
import type { Player } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const CREDIX_RED = "#e0312a";

export default async function DashboardPage() {
  const [players, bannerWords, topScorers] = await Promise.all([
    getPlayers(),
    getBannerWords(),
    getTopScorers(),
  ]);

  if (players.length === 0) {
    return <EmptyState />;
  }

  const total = players.length;
  const avgOverall = Math.round(
    players.reduce((a, p) => a + p.overall, 0) / total,
  );
  const avgAge = Math.round(players.reduce((a, p) => a + p.age, 0) / total);
  const best = players[0];
  const counts: Record<PositionGroup, number> = {
    GK: 0,
    DEF: 0,
    MID: 0,
    FWD: 0,
  };
  for (const p of players) counts[positionGroup(p.position)]++;

  const ranking = players.slice(0, 6);

  const topScorer = topScorers[0] ?? null;
  const goleador =
    topScorer ?
      (players.find((p) => p.id === topScorer.playerId) ?? null)
    : null;

  return (
    <div className="space-y-6">
      {/* ── Matchday banner ───────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0b3d2e_0%,#0a3327_60%,#072018_100%)] text-white rounded-lg ring-1 ring-foreground/10">
        {/* faint chalk pitch, drawn from the right touchline */}
        <svg
          viewBox="0 0 600 400"
          preserveAspectRatio="xMaxYMid slice"
          className="pointer-events-none absolute inset-y-0 right-0 h-full w-2/3 opacity-[0.12]"
          aria-hidden="true"
        >
          <g fill="none" stroke="white" strokeWidth={2}>
            <line x1={300} y1={0} x2={300} y2={400} />
            <circle cx={300} cy={200} r={80} />
            <rect x={520} y={120} width={120} height={160} />
          </g>
        </svg>

        <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-end md:justify-between md:p-9">
          <div>
            <span className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300/90">
              Jornada · Temporada 2026
            </span>
            <h1 className="font-display mt-1 text-5xl font-bold uppercase leading-[0.92] tracking-tight md:text-7xl">
              La Reta
              <br />
              <RotatingWord className="text-emerald-300" words={bannerWords} />
            </h1>
            <p className="mt-3 max-w-sm text-sm text-emerald-50/70">
              El club de la reta en modo carrera: convoca, revisa el nivel y
              salta a armar los equipos de hoy.
            </p>

            <div className="mt-5 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                render={<Link href="/teams" />}
              >
                <ShuffleIcon />
                Armar equipos
              </Button>
              <Button
                size="sm"
                className="bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20"
                render={<Link href="/players" />}
              >
                Ver plantilla
                <ArrowRightIcon />
              </Button>
            </div>
          </div>

          <div className="shrink-0 self-start bg-white p-3 shadow-xl ring-1 ring-black/10 md:self-end rounded-xl">
            <Image
              src="/fifa-credix.png"
              alt="FIFA 26 × Credix"
              width={1536}
              height={1024}
              priority
              className="h-auto w-full max-w-[240px]"
            />
          </div>
        </div>

        {/* Scoreboard strip */}
        <div className="relative grid grid-cols-2 border-t border-white/10 bg-black/25 sm:grid-cols-4">
          <Score label="Plantel" value={total} />
          <Score label="OVR medio" value={avgOverall} />
          <Score label="Edad media" value={avgAge} />
          <Score
            label="Líder"
            value={best.overall}
            sub={best.displayName}
            accent
          />
        </div>
      </section>

      {/* ── Destacados: crack + goleador + jugadores (horizontal en desktop) ───── */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Spotlight
          title="El crack"
          subtitle="Mayor overall de la plantilla"
          player={best}
          statValue={best.overall}
          statLabel="OVR"
        />
        {goleador && topScorer ?
          <Spotlight
            title="El goleador"
            subtitle="Máximo anotador de la reta"
            player={goleador}
            statValue={topScorer.goals}
            statLabel="GOLES"
            note={`en ${topScorer.matches} ${topScorer.matches === 1 ? "partido" : "partidos"}`}
          />
        : <section className="rounded-lg bg-card ring-1 ring-foreground/10">
            <header className="border-b px-4 py-3">
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
                El goleador
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Máximo anotador de la reta
              </p>
            </header>
            <div className="flex flex-col items-center gap-3 p-6 text-center">
              <TrophyIcon className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Aún no hay goles registrados. Anota goles en un partido para
                coronar al goleador.
              </p>
              <Button
                variant="outline"
                size="sm"
                render={<Link href="/live" />}
              >
                <RadioIcon />
                Marcador en vivo
              </Button>
            </div>
          </section>
        }
        <RotatingPlayer players={players} />
      </div>

      {/* ── El comentarista ────────────────────────────────────────── */}
      <div className="md:grid md:grid-cols-2">
        <Commentator />
      </div>

      {/* ── Pizarra + ranking ──────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Pizarra del once ideal */}
        <section className="flex flex-col bg-card rounded-lg ring-1 ring-foreground/10">
          <header className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
                Once ideal
              </h2>
              <p className="text-[11px] text-muted-foreground">
                El mejor por línea · esquema 4-3-3
              </p>
            </div>
            <span className="font-display rounded-sm bg-foreground px-2 py-1 text-xs font-bold uppercase tracking-wider text-background">
              4-3-3
            </span>
          </header>
          <LineupBoard players={players} />
          <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-4 py-2.5 text-[11px]">
            {(Object.keys(counts) as PositionGroup[]).map((g) => (
              <span key={g} className="flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: GROUP_COLOR[g] }}
                />
                <span className="text-muted-foreground">{GROUP_LABEL[g]}</span>
                <span className="font-mono font-bold tabular-nums">
                  {counts[g]}
                </span>
              </span>
            ))}
          </footer>
        </section>

        {/* Ranking */}
        <section className="bg-card rounded-lg ring-1 ring-foreground/10">
          <header className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
              Ranking de nivel
            </h2>
            <Button variant="link" size="sm" render={<Link href="/players" />}>
              Todos
              <ArrowRightIcon />
            </Button>
          </header>
          <ol>
            {ranking.map((p, i) => (
              <li key={p.id}>
                <Link
                  href={`/players/${p.id}`}
                  className="flex items-center gap-3 border-b px-4 py-2 text-sm last:border-b-0 hover:bg-muted/60"
                >
                  <span
                    className="font-display w-5 text-center text-base font-bold tabular-nums"
                    style={{ color: i === 0 ? CREDIX_RED : undefined }}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="inline-flex min-w-9 justify-center rounded-sm px-1.5 py-0.5 text-[10px] font-bold text-white"
                    style={{
                      backgroundColor: GROUP_COLOR[positionGroup(p.position)],
                    }}
                  >
                    {p.position}
                  </span>
                  <span className="truncate font-medium">{p.name}</span>
                  <span className="ml-auto shrink-0">
                    {flagEmoji(p.nationality)}
                  </span>
                  <span className="w-8 shrink-0 text-right font-mono font-bold tabular-nums">
                    {p.overall}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}

function Spotlight({
  title,
  subtitle,
  player,
  statValue,
  statLabel,
  note,
}: {
  title: string;
  subtitle: string;
  player: Player;
  statValue: number;
  statLabel: string;
  note?: string;
}) {
  return (
    <section className="rounded-lg bg-card ring-1 ring-foreground/10">
      <header className="border-b px-4 py-3">
        <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
          {title}
        </h2>
        <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      </header>
      <div className="flex items-center gap-4 p-4">
        <Link
          href={`/players/${player.id}`}
          className="w-28 shrink-0 transition-transform hover:-translate-y-1"
        >
          <FifaCard player={player} size="sm" />
        </Link>
        <div className="min-w-0">
          <p className="font-display text-2xl font-bold uppercase leading-none">
            {player.displayName}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {player.name}
          </p>
          <p className="mt-2 font-mono text-3xl font-black tabular-nums">
            {statValue}
            <span className="ml-1 text-xs font-medium text-muted-foreground">
              {statLabel}
            </span>
          </p>
          {note ?
            <p className="text-[11px] text-muted-foreground">{note}</p>
          : null}
          <Button
            variant="outline"
            size="xs"
            className="mt-3"
            render={<Link href={`/players/${player.id}`} />}
          >
            Ver ficha
            <ArrowRightIcon />
          </Button>
        </div>
      </div>
    </section>
  );
}

function Score({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="border-l border-white/10 px-4 py-3 first:border-l-0">
      <p className="font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/70">
        {label}
      </p>
      <p
        className="font-mono text-3xl font-black leading-none tabular-nums"
        style={{ color: accent ? "#fca5a5" : undefined }}
      >
        {value}
      </p>
      {sub ?
        <p className="mt-0.5 truncate text-[11px] font-medium text-emerald-50/70">
          {sub}
        </p>
      : null}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <ShieldHalfIcon className="mx-auto size-10 text-muted-foreground" />
      <h1 className="mt-4 text-xl font-bold">Aún no hay jugadores</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Crea el primero o corre el seed para poblar la base de datos.
      </p>
      <Button className="mt-4" render={<Link href="/players/new" />}>
        <UserPlusIcon />
        Crear jugador
      </Button>
    </div>
  );
}
