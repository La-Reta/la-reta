import { notFound, redirect } from "next/navigation";
import { getPlayerById } from "@/lib/queries";
import { isAdmin } from "@/lib/admin";
import { PlayerForm } from "@/components/features/players/player-form";

export const dynamic = "force-dynamic";

export default async function EditPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!(await isAdmin())) {
    redirect(`/players/${id}`);
  }

  const player = await getPlayerById(Number(id));
  if (!player) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Editar · {player.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Ajusta los datos y atributos del jugador.
        </p>
      </div>
      <PlayerForm player={player} />
    </div>
  );
}
