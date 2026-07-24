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
import { cn } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import {
  ClockIcon,
  MedalIcon,
  PencilIcon,
  ScaleIcon,
  ShieldIcon,
  TargetIcon,
  TrophyIcon,
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

// Team-colored text (sky = A, rose = B) to tie figures/shares to a side.
const TEAM_TEXT = {
  A: "text-sky-600 dark:text-sky-400",
  B: "text-rose-600 dark:text-rose-400",
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
  tone,
  cleanSheet,
}: {
  teamName: string;
  score: number;
  scorers: Scorer[];
  tone: "A" | "B";
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
              className={cn(
                "size-2 rounded-full",
                ROSTER_TONE[tone === "A" ? "sky" : "rose"],
              )}
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
const ROSTER_TONE = {
  sky: "bg-sky-500",
  rose: "bg-rose-500",
  muted: "bg-primary",
} as const;

function TeamRosterCard({
  title,
  scorers,
  maxGoals,
  tone = "muted",
}: {
  title: string;
  scorers: Scorer[];
  maxGoals: number;
  tone?: keyof typeof ROSTER_TONE;
}) {
  // Sorted by goals so the numbered rank reflects the scoring order.
  const ranked = [...scorers].sort((a, b) => b.goals - a.goals);

  return (
    <Card size="sm" className="overflow-hidden">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <span className={cn("size-2 rounded-full", ROSTER_TONE[tone])} />
            {title}
          </CardTitle>
          <Badge variant="secondary">{scorers.length} jugadores</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        {ranked.length === 0 ? (
          <p className="text-muted-foreground py-2 text-xs">
            Sin jugadores asignados.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {ranked.map((scorer, idx) => (
              <li
                key={`${title}-${scorer.playerId ?? `guest-${idx}`}`}
                className="space-y-1.5"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-muted-foreground w-4 shrink-0 text-center font-mono text-xs font-semibold tabular-nums">
                    {idx + 1}
                  </span>
                  {scorer.isGuest ? (
                    <span className="flex min-w-0 flex-1 items-center gap-1.5">
                      <span className="truncate text-sm font-medium">
                        {scorer.name}
                      </span>
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        invitado
                      </Badge>
                    </span>
                  ) : (
                    <Link
                      href={`/players/${scorer.playerId}`}
                      className="hover:text-primary min-w-0 flex-1 truncate text-sm font-medium transition-colors"
                    >
                      {scorer.name}
                    </Link>
                  )}
                  <span className="flex shrink-0 items-center gap-1.5">
                    <Badge variant={scorer.goals > 0 ? "default" : "secondary"}>
                      {scorer.goals} gol{scorer.goals === 1 ? "" : "es"}
                    </Badge>
                    {scorer.assists > 0 ? (
                      <Badge variant="outline" className="text-[10px]">
                        {scorer.assists} asis.
                      </Badge>
                    ) : null}
                  </span>
                </div>
                <div className="bg-muted ml-[1.625rem] h-1.5 overflow-hidden rounded-full">
                  <div
                    className={cn("h-full rounded-full", ROSTER_TONE[tone])}
                    style={{
                      width:
                        scorer.goals > 0
                          ? `${(scorer.goals / maxGoals) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
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

  // ── Votación de premios (Figura / Golazo / Error) ──
  const voterId = userId ?? (admin ? "admin" : null);
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
  const pace = matchPace(totalGoals, match.durationSec);
  const maxScorerGoals = Math.max(1, ...match.scorers.map((s) => s.goals));

  // Derived, data-driven highlights.
  const scored = match.scorers
    .filter((s) => s.goals > 0)
    .sort((a, b) => b.goals - a.goals);
  const mvp = scored[0] ?? null;
  const mvpTeam = mvp?.team === "A" || mvp?.team === "B" ? mvp.team : null;
  const guestGoals = match.scorers
    .filter((s) => s.isGuest)
    .reduce((n, s) => n + s.goals, 0);
  const aShare = totalGoals
    ? Math.round((match.scoreA / totalGoals) * 100)
    : 50;

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
        teamAName={match.teamAName}
        teamBName={match.teamBName}
        scoreA={match.scoreA}
        scoreB={match.scoreB}
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

      <SectionHeading title="Los goleadores" />
      <Card className="overflow-hidden">
        <CardContent className="grid gap-5 sm:grid-cols-2 sm:items-center sm:divide-x">
          {/* Figura del partido: máximo goleador entre ambos equipos. */}
          <div className="flex items-center gap-4 sm:pr-5">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400 [&_svg]:size-7">
              <TrophyIcon />
            </span>
            <div className="min-w-0">
              <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                Figura del partido
              </p>
              {mvp ? (
                <>
                  <div className="flex items-center gap-2">
                    <p className="font-display truncate text-xl font-bold">
                      {mvp.name}
                    </p>
                    {mvp.isGuest ? (
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        invitado
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {mvpTeam ? (
                      <span className={cn("font-medium", TEAM_TEXT[mvpTeam])}>
                        {mvpTeam === "A" ? match.teamAName : match.teamBName}
                      </span>
                    ) : (
                      "Sin equipo"
                    )}{" "}
                    · {mvp.goals} gol{mvp.goals === 1 ? "" : "es"}
                    {mvp.assists > 0
                      ? ` · ${mvp.assists} asistencia${mvp.assists === 1 ? "" : "s"}`
                      : ""}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground mt-0.5 text-sm">
                  Sin goles registrados
                </p>
              )}
            </div>
          </div>

          {/* Cuota de gol: proporción del marcador por equipo. */}
          <div className="sm:pl-5">
            <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
              <span className={cn("min-w-0 truncate font-medium", TEAM_TEXT.A)}>
                {match.teamAName}
              </span>
              <span className="text-muted-foreground shrink-0 text-[10px] font-semibold tracking-wider uppercase">
                Cuota de gol
              </span>
              <span
                className={cn(
                  "min-w-0 truncate text-right font-medium",
                  TEAM_TEXT.B,
                )}
              >
                {match.teamBName}
              </span>
            </div>
            <div className="bg-muted flex h-2.5 overflow-hidden rounded-full">
              <div className="bg-sky-500" style={{ width: `${aShare}%` }} />
              <div
                className="bg-rose-500"
                style={{ width: `${100 - aShare}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between font-mono text-sm font-bold tabular-nums">
              <span className={TEAM_TEXT.A}>{match.scoreA}</span>
              <span className={TEAM_TEXT.B}>{match.scoreB}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      <section className="grid gap-6 lg:grid-cols-2">
        <TeamFigureCard
          teamName={match.teamAName}
          score={match.scoreA}
          scorers={teamAScorers}
          tone="A"
          cleanSheet={match.scoreB === 0 && totalGoals > 0}
        />
        <TeamFigureCard
          teamName={match.teamBName}
          score={match.scoreB}
          scorers={teamBScorers}
          tone="B"
          cleanSheet={match.scoreA === 0 && totalGoals > 0}
        />
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
            <div
              className={cn(
                "grid grid-cols-1",
                unassignedScorers.length > 0
                  ? "lg:grid-cols-3"
                  : "lg:grid-cols-2",
                "gap-3",
              )}
            >
              <TeamRosterCard
                title={match.teamAName}
                scorers={teamAScorers}
                maxGoals={maxScorerGoals}
                tone="sky"
              />
              <TeamRosterCard
                title={match.teamBName}
                scorers={teamBScorers}
                maxGoals={maxScorerGoals}
                tone="rose"
              />
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

      <MatchMvpVoting
        matchId={match.id}
        candidates={voteCandidates}
        tally={voteTally}
        myVotes={myVotes}
        canVote={admin || Boolean(userId)}
        votingOpen={votingOpen}
        closesLabel={closesLabel}
      />
    </div>
  );
}
