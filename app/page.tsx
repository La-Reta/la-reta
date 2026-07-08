import { ElevenBoard } from "@/components/app/eleven-board";
import { RankingLevel } from "@/components/app/ranking-level";
import { ScorerNotFound } from "@/components/app/scorer-not-found";
import { Spotlight } from "@/components/app/spotlight";
import { Commentator } from "@/components/features/dashboard/commentator";
import { PlayerLegend } from "@/components/features/dashboard/player-legend";
import { RetaCountdownBanner } from "@/components/features/dashboard/reta-countdown-banner";
import { RotatingPlayer } from "@/components/features/dashboard/rotating-player";
import { RotatingWord } from "@/components/features/dashboard/rotating-word";
import { MatchesChart } from "@/components/features/matches/matches-chart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { positionGroup, type PositionGroup } from "@/lib/constants";
import {
  getBannerWords,
  getMatches,
  getPlayers,
  getTopScorers,
} from "@/lib/queries";
import {
  ArrowRightIcon,
  InfoIcon,
  ShieldHalfIcon,
  ShuffleIcon,
  UserPlusIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [players, bannerWords, topScorers, matches] = await Promise.all([
    getPlayers(),
    getBannerWords(),
    getTopScorers(),
    getMatches(),
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

  const topScorer = topScorers[0] ?? null;
  const goleador = topScorer
    ? (players.find((p) => p.id === topScorer.playerId) ?? null)
    : null;

  return (
    <div className="space-y-6">
      {/* ── Countdown a la próxima reta (solo ≤2 días antes) ───────── */}
      <RetaCountdownBanner />

      {/* ── Matchday banner ───────────────────────────────────────── */}
      <section className="ring-foreground/10 relative overflow-hidden rounded-lg bg-[linear-gradient(135deg,#0b3d2e_0%,#0a3327_60%,#072018_100%)] text-white ring-1">
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

        <div className="relative flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between lg:p-9">
          <div>
            <span className="font-display text-xs font-semibold tracking-[0.25em] text-emerald-300/90 uppercase">
              Jornada · Temporada 2026
            </span>
            <h1 className="font-display mt-1 text-5xl leading-[0.92] font-bold tracking-tight uppercase sm:text-6xl lg:text-7xl">
              La Reta
              <br />
              <RotatingWord className="text-emerald-300" words={bannerWords} />
            </h1>
            <p className="mt-3 max-w-sm text-sm text-emerald-50/70">
              El club de la reta en modo carrera: convoca, revisa el nivel y
              salta a armar los equipos de hoy.
            </p>

            <div className="mt-5 flex gap-2">
              <Button variant="default" render={<Link href="/teams" />}>
                <ShuffleIcon />
                Armar equipos
              </Button>
              <Button variant={"secondary"} render={<Link href="/players" />}>
                Ver plantilla
                <ArrowRightIcon />
              </Button>
            </div>
          </div>

          <div className="shrink-0 self-center rounded-xl bg-white p-2.5 shadow-xl ring-1 ring-black/10 sm:p-3 lg:self-end">
            <Image
              src="/fifa-credix.webp"
              alt="FIFA 26 × Credix"
              width={1536}
              height={1024}
              priority
              className="h-auto w-full max-w-[190px] sm:max-w-[210px] lg:max-w-[240px]"
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
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Spotlight
          title="El crack"
          subtitle="Mayor overall de la plantilla"
          player={best}
          statValue={best.overall}
          statLabel="OVR"
        />
        {goleador && topScorer ? (
          <Spotlight
            title="El goleador"
            subtitle="Máximo anotador de la reta"
            player={goleador}
            statValue={topScorer.goals}
            statLabel="GOLES"
            note={`en ${topScorer.matches} ${topScorer.matches === 1 ? "partido" : "partidos"}`}
          />
        ) : (
          <ScorerNotFound />
        )}
        <RotatingPlayer players={players} />
      </div>

      {/* ── Comentarista + Leyenda ──────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Commentator />
        <PlayerLegend />
      </div>

      {/* ── Pizarra + ranking ──────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="space-y-2">
          {/* Pizarra del once ideal */}
          <ElevenBoard players={players} counts={counts} />
          <Alert>
            <InfoIcon />
            <AlertTitle>Importante!</AlertTitle>
            <AlertDescription>
              Este proyecto es solo &quot;For Fun&quot;. No se busca lucro ni
              afectar a terceros. La idea es pasarnosla bien y divertirnos en
              cada reta.
            </AlertDescription>
          </Alert>
        </div>

        {/* Ranking + gráfica comparativa de partidos */}
        <div className="space-y-6">
          <RankingLevel players={players} />
          {matches.length > 0 && <MatchesChart matches={matches} />}
        </div>
      </div>
    </div>
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
      <p className="font-display text-[10px] font-semibold tracking-[0.18em] text-emerald-200/70 uppercase">
        {label}
      </p>
      <p
        className="font-mono text-3xl leading-none font-black tabular-nums"
        style={{ color: accent ? "#fca5a5" : undefined }}
      >
        {value}
      </p>
      {sub ? (
        <p className="mt-0.5 truncate text-[11px] font-medium text-emerald-50/70">
          {sub}
        </p>
      ) : null}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <ShieldHalfIcon className="text-muted-foreground mx-auto size-10" />
      <h1 className="mt-4 text-xl font-bold">Aún no hay jugadores</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Crea el primero o corre el seed para poblar la base de datos.
      </p>
      <Button className="mt-4" render={<Link href="/players/new" />}>
        <UserPlusIcon />
        Crear jugador
      </Button>
    </div>
  );
}
