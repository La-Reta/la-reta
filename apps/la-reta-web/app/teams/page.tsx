import { TeamBuilder } from "@/components/features/teams/team-builder";
import { PageHeader } from "@/components/shared/page-header";
import { getPlayers, getRecentSplits } from "@/lib/queries";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Armar equipos · Reta Fútbol" };
export const dynamic = "force-dynamic";

const TeamsPage = async () => {
  const [players, recentSplits] = await Promise.all([
    getPlayers(),
    getRecentSplits(),
  ]);

  return (
    <div className="mx-auto space-y-6 md:max-w-4xl lg:max-w-6xl 2xl:max-w-7xl">
      <PageHeader
        title="Armar equipos"
        description="Convoca abajo a quienes juegan, elige en cuántos equipos y genera. Los equipos salen parejos por overall y por posición."
      />
      <TeamBuilder players={players} recentSplits={recentSplits} />
    </div>
  );
};

export default TeamsPage;
