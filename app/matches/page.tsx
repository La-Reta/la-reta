import { MatchHistoryList } from "@/components/features/matches/match-history-list";
import { MatchesChart } from "@/components/features/matches/matches-chart";
import { RetaMatchForm } from "@/components/features/matches/reta-match-form";
import { TopScorersCard } from "@/components/features/matches/top-scorers-card";
import type { RetaToMatchItem } from "@/components/features/teams/registro/reta-to-match-list";
import { PageHeader } from "@/components/shared/page-header";
import { SectionHeading } from "@/components/shared/section-heading";
import { isAdmin } from "@/lib/admin";
import { formatApiDate, formatCompactDate, formatTime } from "@/lib/dates";
import {
  getGeneratedRetas,
  getMatches,
  getPlayers,
  getTopScorers,
  retaTeams,
} from "@/lib/queries";
import type { TeamKey } from "@/lib/teams";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Partidos · Reta Fútbol" };
export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const [players, matches, scorers, admin, retas] = await Promise.all([
    getPlayers(),
    getMatches(),
    getTopScorers(),
    isAdmin(),
    // Últimas retas generadas: el alta manual puede partir de cualquiera de sus
    // duelos (una reta de 3+ equipos se registra como varios partidos).
    getGeneratedRetas(10),
  ]);

  const formPlayers = [...players]
    .map((p) => ({ id: p.id, name: p.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const retaOptions: RetaToMatchItem[] = retas.map((r) => ({
    id: r.id,
    // La hora distingue las varias generaciones "de práctica" del mismo día.
    dateLabel: `${formatCompactDate(r.createdAt)} ${formatTime(r.createdAt)}`,
    playedAt: formatApiDate(r.createdAt),
    teams: retaTeams(r),
    players: r.players.map((p) => ({
      playerId: p.playerId,
      guestName: p.isGuest ? p.name : null,
      team: p.team as TeamKey,
      name: p.name,
    })),
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6 lg:max-w-6xl 2xl:max-w-7xl">
      <PageHeader
        title="Partidos"
        description="Registra los resultados de la reta y lleva la tabla de goleadores."
      />

      <RetaMatchForm retas={retaOptions} players={formPlayers} />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
        <section className="space-y-3">
          <SectionHeading title="Historial" count={matches.length} />
          <MatchHistoryList matches={matches} admin={admin} />
          {matches.length > 0 && <MatchesChart matches={matches} />}
        </section>

        <section className="space-y-3 lg:sticky lg:top-6">
          <SectionHeading title="Goles y asistencias" />
          <TopScorersCard scorers={scorers} />
        </section>
      </div>
    </div>
  );
}
