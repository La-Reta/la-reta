import { TeamBuilder } from "@/components/features/teams/team-builder";
import { getPlayers, getRecentSplits } from "@/lib/queries";

export const metadata = { title: "Armar equipos · Reta Fútbol" };
export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const [players, recentSplits] = await Promise.all([
    getPlayers(),
    getRecentSplits(),
  ]);

  return (
    <div className="mx-auto space-y-6 md:max-w-4xl lg:container lg:max-w-none">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Armar equipos</h1>
        <p className="text-muted-foreground text-sm">
          Selecciona a los que van a jugar y genera dos equipos parejos por
          overall y posición.
        </p>
      </div>
      <TeamBuilder players={players} recentSplits={recentSplits} />
    </div>
  );
}
