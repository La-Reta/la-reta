import { PlayerForm } from "@/components/features/players/player-form";

export const metadata = { title: "Nuevo jugador · Reta Fútbol" };

export default function NewPlayerPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo jugador</h1>
        <p className="text-sm text-muted-foreground">
          Define sus datos y atributos. El overall se calcula según la posición.
        </p>
      </div>
      <PlayerForm />
    </div>
  );
}
