import { PlayerForm } from "@/components/features/players/player-form";
import { isAdmin } from "@/lib/admin";

export const metadata = { title: "Nuevo jugador · Reta Fútbol" };

export default async function NewPlayerPage() {
  const admin = await isAdmin();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo jugador</h1>
        <p className="text-muted-foreground text-sm">
          Define sus datos y atributos. El overall se calcula según la posición.
        </p>
      </div>
      <PlayerForm admin={admin} />
    </div>
  );
}
