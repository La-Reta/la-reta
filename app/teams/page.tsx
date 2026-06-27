import { getPlayers } from "@/lib/queries";
import { TeamBuilder } from "@/components/features/teams/team-builder";

export const metadata = { title: "Armar equipos · Reta Fútbol" };
export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const players = await getPlayers();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Armar equipos</h1>
        <p className="text-sm text-muted-foreground">
          Selecciona a los que van a jugar y genera dos equipos parejos por
          overall y posición.
        </p>
      </div>
      <TeamBuilder players={players} />
    </div>
  );
}
