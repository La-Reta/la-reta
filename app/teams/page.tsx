import { TeamBuilder } from "@/components/features/teams/team-builder";
import { PageHeader } from "@/components/shared/page-header";
import { getPlayers, getRecentSplits } from "@/lib/queries";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Armar equipos · Reta Fútbol" };
export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const [players, recentSplits] = await Promise.all([
    getPlayers(),
    getRecentSplits(),
  ]);

  return (
    <div className="mx-auto space-y-6 md:max-w-4xl lg:max-w-6xl 2xl:max-w-7xl">
      <PageHeader
        title="Armar equipos"
        description="Selecciona a los que van a jugar y genera dos equipos parejos por overall y posición."
      />
      <TeamBuilder players={players} recentSplits={recentSplits} />
    </div>
  );
}
