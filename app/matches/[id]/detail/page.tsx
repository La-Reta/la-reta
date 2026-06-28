import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  ClockIcon,
  MedalIcon,
  PencilIcon,
  ScaleIcon,
  ShieldIcon,
  TargetIcon,
} from "lucide-react";
import { isAdmin } from "@/lib/admin";
import { formatShortDateOnly } from "@/lib/dates";
import { flagEmoji } from "@/lib/format";
import { getMatchById, type Scorer } from "@/lib/queries";
import { cn } from "@/lib/utils";
import {
  MatchScorersChart,
  MatchTeamGoalsChart,
} from "@/components/features/matches/match-detail-charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Detalle de partido · Reta Fútbol" };
export const dynamic = "force-dynamic";

function balanceLabel(value: number) {
  if (value >= 80) return "Parejísimo";
  if (value >= 60) return "Equilibrado";
  if (value >= 40) return "Competido";
  if (value >= 20) return "Disparejo";
  return "Paliza";
}

function matchResult(scoreA: number, scoreB: number, teamA: string, teamB: string) {
  if (scoreA === scoreB) return "Empate";
  return scoreA > scoreB ? `Ganó ${teamA}` : `Ganó ${teamB}`;
}

function matchPace(totalGoals: number, durationSec: number | null) {
  if (!durationSec || totalGoals === 0) return null;
  return Math.round(durationSec / 60 / totalGoals);
}

function topScorer(scorers: Scorer[]) {
  return scorers
    .filter((scorer) => scorer.goals > 0)
    .sort((a, b) => b.goals - a.goals)[0];
}

function StatTile({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold uppercase">
        <span className="[&_svg]:size-3.5">{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-2xl font-black tabular-nums">{value}</p>
      {detail ? <p className="text-muted-foreground mt-1 text-xs">{detail}</p> : null}
    </div>
  );
}

function TeamFigureCard({
  teamName,
  score,
  scorers,
}: {
  teamName: string;
  score: number;
  scorers: Scorer[];
}) {
  const figure = topScorer(scorers);
  const registeredGoals = scorers.reduce((sum, scorer) => sum + scorer.goals, 0);

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{teamName}</CardTitle>
          <Badge variant="secondary">{score} goles</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3">
          <MedalIcon className="text-muted-foreground mt-0.5 size-4" />
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {figure ? figure.name : "Sin figura asignada"}
            </p>
            <p className="text-muted-foreground text-xs">
              {figure
                ? `${figure.goals} gol${figure.goals === 1 ? "" : "es"}`
                : "Agrega equipo y goles para calcularla"}
            </p>
          </div>
        </div>
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>Jugadores registrados</span>
          <span className="font-mono font-bold tabular-nums">
            {scorers.length}
          </span>
        </div>
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>Goles asociados</span>
          <span className="font-mono font-bold tabular-nums">
            {registeredGoals}/{score}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamRosterCard({
  title,
  scorers,
  maxGoals,
}: {
  title: string;
  scorers: Scorer[];
  maxGoals: number;
}) {
  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <p className="text-sm font-semibold">{title}</p>
        <Badge variant="outline">{scorers.length}</Badge>
      </div>
      {scorers.length === 0 ? (
        <p className="text-muted-foreground p-3 text-xs">
          Sin jugadores asignados.
        </p>
      ) : (
        <div className="space-y-2 p-3">
          {scorers
            .sort((a, b) => b.goals - a.goals)
            .map((scorer) => (
              <div key={`${title}-${scorer.playerId}`} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{flagEmoji(scorer.nationality)}</span>
                  <Link
                    href={`/players/${scorer.playerId}`}
                    className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
                  >
                    {scorer.name}
                  </Link>
                  <Badge variant={scorer.goals > 0 ? "default" : "secondary"}>
                    {scorer.goals} gol{scorer.goals === 1 ? "" : "es"}
                  </Badge>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width:
                        scorer.goals > 0
                          ? `${(scorer.goals / maxGoals) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [match, admin] = await Promise.all([getMatchById(Number(id)), isAdmin()]);

  if (!match) notFound();

  const totalGoals = match.scoreA + match.scoreB;
  const winner =
    match.scoreA === match.scoreB
      ? null
      : match.scoreA > match.scoreB
        ? match.teamAName
        : match.teamBName;
  const teamAScorers = match.scorers.filter((scorer) => scorer.team === "A");
  const teamBScorers = match.scorers.filter((scorer) => scorer.team === "B");
  const unassignedScorers = match.scorers.filter(
    (scorer) => scorer.team !== "A" && scorer.team !== "B",
  );
  const matchTopScorer = topScorer(match.scorers);
  const pace = matchPace(totalGoals, match.durationSec);
  const maxScorerGoals = Math.max(1, ...match.scorers.map((s) => s.goals));
  const teamChartData = [
    { team: match.teamAName, goals: match.scoreA },
    { team: match.teamBName, goals: match.scoreB },
  ];
  const scorerChartData = match.scorers
    .filter((scorer) => scorer.goals > 0)
    .slice(0, 6)
    .map((scorer) => ({
      player: scorer.displayName,
      goals: scorer.goals,
    }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" render={<Link href="/matches" />}>
          <ArrowLeftIcon />
          Partidos
        </Button>
        {admin ? (
          <Button
            size="sm"
            variant="outline"
            render={<Link href={`/matches/${match.id}/edit`} />}
          >
            <PencilIcon />
            Editar información
          </Button>
        ) : null}
      </div>

      <section className="rounded-lg border bg-card p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <Badge variant="secondary">{formatShortDateOnly(match.playedAt)}</Badge>
            <h1 className="text-2xl font-black tracking-tight">
              {match.teamAName} vs {match.teamBName}
            </h1>
            <p className="text-muted-foreground text-sm">
              {matchResult(match.scoreA, match.scoreB, match.teamAName, match.teamBName)}
            </p>
          </div>
          <div className="font-mono text-5xl font-black tabular-nums sm:text-6xl">
            {match.scoreA}
            <span className="text-muted-foreground mx-2">-</span>
            {match.scoreB}
          </div>
        </div>

        {match.notes ? (
          <p className="text-muted-foreground mt-4 rounded-lg bg-muted/40 p-3 text-sm italic">
            {match.notes}
          </p>
        ) : null}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={<TargetIcon />}
          label="Goles totales"
          value={String(totalGoals)}
          detail={pace ? `1 gol cada ${pace} min` : "Ritmo pendiente"}
        />
        <StatTile
          icon={<ScaleIcon />}
          label="Balance"
          value={`${match.balance}/100`}
          detail={balanceLabel(match.balance)}
        />
        <StatTile
          icon={<ClockIcon />}
          label="Duración"
          value={match.durationSec ? `${Math.round(match.durationSec / 60)}m` : "—"}
          detail={match.durationSec ? "Registrado en vivo" : "Sin reloj"}
        />
        <StatTile
          icon={<MedalIcon />}
          label="Figura"
          value={matchTopScorer ? matchTopScorer.displayName : "—"}
          detail={
            matchTopScorer
              ? `${matchTopScorer.goals} gol${matchTopScorer.goals === 1 ? "" : "es"}`
              : "Sin goleadores"
          }
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <TeamFigureCard
          teamName={match.teamAName}
          score={match.scoreA}
          scorers={teamAScorers}
        />
        <TeamFigureCard
          teamName={match.teamBName}
          score={match.scoreB}
          scorers={teamBScorers}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Goles por equipo</CardTitle>
          </CardHeader>
          <CardContent>
            <MatchTeamGoalsChart data={teamChartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Goleadores del partido</CardTitle>
          </CardHeader>
          <CardContent>
            <MatchScorersChart data={scorerChartData} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Equipos y goles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {match.scorers.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No se registraron jugadores ni goleadores para este partido.
              </p>
            ) : (
              <>
                <TeamRosterCard
                  title={match.teamAName}
                  scorers={teamAScorers}
                  maxGoals={maxScorerGoals}
                />
                <TeamRosterCard
                  title={match.teamBName}
                  scorers={teamBScorers}
                  maxGoals={maxScorerGoals}
                />
                {unassignedScorers.length > 0 ? (
                  <TeamRosterCard
                    title="Sin equipo asignado"
                    scorers={unassignedScorers}
                    maxGoals={maxScorerGoals}
                  />
                ) : null}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Resumen táctico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <ShieldIcon className="text-muted-foreground mt-0.5 size-4" />
              <div>
                <p className="text-sm font-semibold">
                  {winner ? `${winner} se llevó el partido` : "Partido empatado"}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Diferencia de {Math.abs(match.scoreA - match.scoreB)} gol
                  {Math.abs(match.scoreA - match.scoreB) === 1 ? "" : "es"}.
                </p>
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Balance percibido</span>
                <span className="font-mono font-bold tabular-nums">
                  {match.balance}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    match.balance >= 60
                      ? "bg-emerald-500"
                      : match.balance >= 40
                        ? "bg-amber-500"
                        : "bg-rose-500",
                  )}
                  style={{ width: `${match.balance}%` }}
                />
              </div>
            </div>

            <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
              Este dashboard usa la información registrada del partido: marcador,
              balance, duración, equipos y goleadores. Para agregar jugadores,
              asignar equipo o corregir datos, usa la acción de edición.
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
