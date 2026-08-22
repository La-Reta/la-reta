import ScorersSection from "@/components/features/matches/detail/scorers-section";
import { MatchScorersChart } from "@/components/features/matches/match-detail-charts";
import { MatchHero } from "@/components/features/matches/match-hero";
import {
  MatchMvpVoting,
  type VoteCandidate,
} from "@/components/features/matches/match-mvp-voting";
import { MatchesBackButton } from "@/components/features/matches/matches-back-button";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isAdmin } from "@/lib/admin";
import { formatLongDate, formatShortDateOnly } from "@/lib/dates";
import { candidateKey, isVotingOpen, votingClosesAt } from "@/lib/match-votes";
import {
  getMatchById,
  getMatchVoteTally,
  getMyMatchVotes,
  type Scorer,
} from "@/lib/queries";
import { matchTeams, TEAM_COLORS } from "@/lib/teams";
import { cn } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import {
  ClockIcon,
  MedalIcon,
  PencilIcon,
  ScaleIcon,
  ShieldIcon,
  TargetIcon,
  UsersIcon,
} from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Detalle de partido · Reta Fútbol" };
export const dynamic = "force-dynamic";

// Icon-chip tints for the stat tiles, built from theme + Tailwind basics.
const STAT_TONES = {
  primary: "bg-primary/10 text-primary",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
} as const;

function balanceTone(value: number) {
  return value >= 60 ? "emerald" : value >= 40 ? "amber" : "rose";
}

function balanceLabel(value: number) {
  if (value >= 80) return "Parejísimo";
  if (value >= 60) return "Equilibrado";
  if (value >= 40) return "Competido";
  if (value >= 20) return "Disparejo";
  return "Paliza";
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
  tone = "primary",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail?: string;
  tone?: keyof typeof STAT_TONES;
}) {
  return (
    <Card size="sm">
      <CardContent className="space-y-2">
        <div className="text-muted-foreground flex items-center gap-2 text-[10px] font-semibold uppercase">
          <span
            className={cn(
              "flex size-6 items-center justify-center rounded-md [&_svg]:size-3.5",
              STAT_TONES[tone],
            )}
          >
            {icon}
          </span>
          {label}
        </div>
        <p className="text-2xl font-black tabular-nums">{value}</p>
        {detail ? (
          <p className="text-muted-foreground text-xs">{detail}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function TeamFigureCard({
  teamName,
  score,
  scorers,
  color,
  cleanSheet,
}: {
  teamName: string;
  score: number;
  scorers: Scorer[];
  color: string;
  cleanSheet: boolean;
}) {
  const figure = topScorer(scorers);
  const registeredGoals = scorers.reduce(
    (sum, scorer) => sum + scorer.goals,
    0,
  );
  const totalAssists = scorers.reduce((sum, s) => sum + s.assists, 0);
  const guestGoals = scorers
    .filter((s) => s.isGuest)
    .reduce((sum, s) => sum + s.goals, 0);

  return (
    <Card size="sm">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            {teamName}
          </CardTitle>
          <div className="flex items-center gap-1.5">
            {cleanSheet ? (
              <Badge className="border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <ShieldIcon />
                Valla invicta
              </Badge>
            ) : null}
            <Badge variant="secondary" className="tabular-nums">
              {score} goles
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 [&_svg]:size-4">
            <MedalIcon />
          </span>
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
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>Asistencias</span>
          <span className="font-mono font-bold tabular-nums">
            {totalAssists}
          </span>
        </div>
        {guestGoals > 0 ? (
          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span>Goles de invitados</span>
            <span className="font-mono font-bold tabular-nums">
              {guestGoals}
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

// Team accent for the roster bars/dot; unassigned falls back to primary.
function TeamRosterCard({
  title,
  scorers,
  maxGoals,
  color,
}: {
  title: string;
  scorers: Scorer[];
  maxGoals: number;
  /** Color del equipo; sin él (p. ej. "sin equipo") usa el primario. */
  color?: string;
}) {
  // Sorted by goals so the numbered rank reflects the scoring order.
  const ranked = [...scorers].sort((a, b) => b.goals - a.goals);
  const totalGoals = scorers.reduce((sum, s) => sum + s.goals, 0);

  return (
    <Card size="sm" className="overflow-hidden">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex min-w-0 items-center gap-2 text-sm">
            <span
              className="bg-primary size-2 shrink-0 rounded-full"
              style={color ? { backgroundColor: color } : undefined}
            />
            <span className="truncate">{title}</span>
          </CardTitle>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Badge variant={"default"} className="shrink-0 tabular-nums">
              {totalGoals > 0
                ? `${totalGoals} gol${totalGoals === 1 ? "" : "es"}`
                : "Sin goles"}
            </Badge>
            <Badge variant="secondary" className="shrink-0 tabular-nums">
              {scorers.length} jugador{scorers.length === 1 ? "" : "es"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        {ranked.length === 0 ? (
          <p className="text-muted-foreground py-2 text-xs">
            Sin jugadores asignados.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {ranked.map((scorer, idx) => (
              <li
                key={`${title}-${scorer.playerId ?? `guest-${idx}`}`}
                className="space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-3 shrink-0 text-center font-mono text-[11px] font-semibold tabular-nums">
                    {idx + 1}
                  </span>
                  {scorer.isGuest ? (
                    // El "inv." va después del nombre y no le roba ancho: la
                    // tarjeta es angosta y el nombre es lo que importa.
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {scorer.name}
                      <span className="text-muted-foreground ml-1 text-[10px] font-normal">
                        inv.
                      </span>
                    </span>
                  ) : (
                    <Link
                      href={`/players/${scorer.playerId}`}
                      className="hover:text-primary min-w-0 flex-1 truncate text-sm font-medium transition-colors"
                    >
                      {scorer.name}
                    </Link>
                  )}
                  {/* Solo se muestran los números que existen: una lista llena
                      de "0 goles" es ruido y se come el ancho del nombre. */}
                  <span className="text-muted-foreground flex shrink-0 items-center gap-1.5 font-mono text-xs tabular-nums">
                    {scorer.goals > 0 ? (
                      <span className="text-foreground font-bold">
                        {scorer.goals}
                        <span className="text-muted-foreground ml-0.5 font-normal">
                          G
                        </span>
                      </span>
                    ) : null}
                    {scorer.assists > 0 ? (
                      <span>
                        {scorer.assists}
                        <span className="ml-0.5">A</span>
                      </span>
                    ) : null}
                    {scorer.goals === 0 && scorer.assists === 0 ? (
                      <span className="text-muted-foreground/60">—</span>
                    ) : null}
                  </span>
                </div>
                {scorer.goals > 0 ? (
                  <div className="bg-muted ml-5 h-1 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{
                        backgroundColor: color,
                        width: `${(scorer.goals / maxGoals) * 100}%`,
                      }}
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [match, admin, { userId }] = await Promise.all([
    getMatchById(Number(id)),
    isAdmin(),
    auth(),
  ]);

  if (!match) notFound();

  //  Votación de premios (Figura / Golazo / Error)
  // Votar es exclusivo de cuentas: el PIN de admin no vota.
  const voterId = userId ?? null;
  const [voteTally, myVotes] = await Promise.all([
    getMatchVoteTally(match.id),
    getMyMatchVotes(match.id, voterId),
  ]);
  const votingOpen = isVotingOpen(match.createdAt);
  const closesLabel = formatLongDate(votingClosesAt(match.createdAt));
  // Candidatos = participantes únicos del partido (roster o invitado).
  const voteCandidates: VoteCandidate[] = [];
  const seenCandidates = new Set<string>();
  for (const s of match.scorers) {
    const guestName = s.isGuest ? s.name : null;
    const key = candidateKey({ playerId: s.playerId, guestName });
    if (seenCandidates.has(key)) continue;
    seenCandidates.add(key);
    voteCandidates.push({
      key,
      playerId: s.playerId,
      guestName,
      name: s.name,
      photoUrl: s.photoUrl,
      team: s.team,
      isGuest: s.isGuest,
    });
  }

  // Una reta puede haberse jugado con 3+ equipos: todo se deriva de la lista.
  const teams = matchTeams(match);
  const totalGoals = teams.reduce((n, t) => n + t.score, 0);
  const best = Math.max(...teams.map((t) => t.score));
  const leaders = teams.filter((t) => t.score === best);
  const winner = leaders.length === 1 ? leaders[0].name : null;
  const teamSquads = teams.map((team) => ({
    ...team,
    scorers: match.scorers.filter((scorer) => scorer.team === team.key),
  }));
  const unassignedScorers = match.scorers.filter(
    (scorer) => !teams.some((t) => t.key === scorer.team),
  );
  // Distancia entre el primero y el segundo, sean 2 o 6 equipos.
  const ranked = [...teams].sort((a, b) => b.score - a.score);
  const scoreGap = ranked.length > 1 ? ranked[0].score - ranked[1].score : 0;
  const pace = matchPace(totalGoals, match.durationSec);
  const maxScorerGoals = Math.max(1, ...match.scorers.map((s) => s.goals));

  // Derived, data-driven highlights.
  const scored = match.scorers
    .filter((s) => s.goals > 0)
    .sort((a, b) => b.goals - a.goals);

  const guestGoals = match.scorers
    .filter((s) => s.isGuest)
    .reduce((n, s) => n + s.goals, 0);

  const scorerChartData = scored.slice(0, 6).map((scorer) => ({
    player: scorer.displayName,
    goals: scorer.goals,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6 lg:container">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MatchesBackButton />
        {admin ? (
          <Button
            variant="default"
            render={<Link href={`/matches/${match.id}/edit`} />}
          >
            <PencilIcon />
            Editar información
          </Button>
        ) : null}
      </div>

      <MatchHero
        matchId={match.id}
        teams={teams}
        dateLabel={formatShortDateOnly(match.playedAt)}
        winner={winner}
        photoUrl={match.photoUrl}
        admin={admin}
      />

      {match.notes ? (
        <p className="text-muted-foreground text-center text-sm">
          {match.notes}
        </p>
      ) : null}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={<TargetIcon />}
          label="Goles totales"
          value={String(totalGoals)}
          detail={pace ? `1 gol cada ${pace} min` : "Ritmo pendiente"}
          tone="primary"
        />
        <StatTile
          icon={<UsersIcon />}
          label="Goleadores"
          value={String(scored.length)}
          detail={
            guestGoals > 0
              ? `${guestGoals} gol${guestGoals === 1 ? "" : "es"} de invitados`
              : `de ${match.scorers.length} jugadores`
          }
          tone="emerald"
        />
        <StatTile
          icon={<ScaleIcon />}
          label="Balance"
          value={`${match.balance}/100`}
          detail={balanceLabel(match.balance)}
          tone={balanceTone(match.balance)}
        />
        <StatTile
          icon={<ClockIcon />}
          label="Duración"
          value={
            match.durationSec ? `${Math.round(match.durationSec / 60)}m` : "—"
          }
          detail={match.durationSec ? "Registrado en vivo" : "Sin reloj"}
          tone="sky"
        />
      </section>

      <MatchMvpVoting
        matchId={match.id}
        candidates={voteCandidates}
        tally={voteTally}
        myVotes={myVotes}
        canVote={Boolean(userId)}
        votingOpen={votingOpen}
        closesLabel={closesLabel}
      />

      <SectionHeading title="Los goleadores" />

      <ScorersSection match={match} scored={scored} />

      <section className="grid gap-6 lg:grid-cols-2">
        {teamSquads.map((team) => (
          <TeamFigureCard
            key={team.key}
            teamName={team.name}
            score={team.score}
            scorers={team.scorers}
            color={TEAM_COLORS[team.key]}
            // Valla invicta: nadie más anotó en todo el partido.
            cleanSheet={totalGoals > 0 && totalGoals === team.score}
          />
        ))}
      </section>

      {scorerChartData.length > 0 ? (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Goleadores del partido</CardTitle>
          </CardHeader>
          <CardContent>
            <MatchScorersChart data={scorerChartData} />
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="space-y-3">
          <SectionHeading title="Equipos y goles" />
          {match.scorers.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No se registraron jugadores ni goleadores para este partido.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {teamSquads.map((team) => (
                <TeamRosterCard
                  key={team.key}
                  title={team.name}
                  scorers={team.scorers}
                  maxGoals={maxScorerGoals}
                  color={TEAM_COLORS[team.key]}
                />
              ))}
              {unassignedScorers.length > 0 ? (
                <TeamRosterCard
                  title="Sin equipo asignado"
                  scorers={unassignedScorers}
                  maxGoals={maxScorerGoals}
                />
              ) : null}
            </div>
          )}
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Resumen táctico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="bg-primary/10 text-primary mt-0.5 flex size-7 items-center justify-center rounded-md [&_svg]:size-4">
                <ShieldIcon />
              </span>
              <div>
                <p className="text-sm font-semibold">
                  {winner
                    ? `${winner} se llevó el partido`
                    : "Partido empatado"}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Diferencia de {scoreGap} gol{scoreGap === 1 ? "" : "es"} con
                  el siguiente.
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
              <div className="bg-muted h-2 overflow-hidden rounded-full">
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

            <div className="bg-muted/40 text-muted-foreground rounded-lg p-3 text-xs">
              Este dashboard usa la información registrada del partido:
              marcador, balance, duración, equipos y goleadores. Para agregar
              jugadores, asignar equipo o corregir datos, usa la acción de
              edición.
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
