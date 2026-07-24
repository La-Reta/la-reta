import { MatchForm } from "@/components/features/matches/match-form";
import { MatchHistoryList } from "@/components/features/matches/match-history-list";
import { MatchesChart } from "@/components/features/matches/matches-chart";
import { TopScorersCard } from "@/components/features/matches/top-scorers-card";
import { PageHeader } from "@/components/shared/page-header";
import { SectionHeading } from "@/components/shared/section-heading";
import { isAdmin } from "@/lib/admin";
import { getMatches, getPlayers, getTopScorers } from "@/lib/queries";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Partidos · Reta Fútbol" };
export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const [players, matches, scorers, admin] = await Promise.all([
    getPlayers(),
    getMatches(),
    getTopScorers(),
    isAdmin(),
  ]);

  const formPlayers = [...players]
    .map((p) => ({ id: p.id, name: p.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-5xl space-y-6 lg:max-w-6xl 2xl:max-w-7xl">
      <PageHeader
        title="Partidos"
        description="Registra los resultados de la reta y lleva la tabla de goleadores."
      />

      <MatchForm players={formPlayers} admin={admin} />

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
