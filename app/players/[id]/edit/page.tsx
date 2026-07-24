import { PlayerForm } from "@/components/features/players/player-form";
import { PageHeader } from "@/components/shared/page-header";
import { isAdmin } from "@/lib/admin";
import { getPlayerById } from "@/lib/queries";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [admin, { userId }, player] = await Promise.all([
    isAdmin(),
    auth(),
    getPlayerById(Number(id)),
  ]);
  if (!player) notFound();

  const isOwner = Boolean(userId) && player.clerkUserId === userId;
  // El dueño puede editar su info; solo el admin toca atributos.
  const canManage = admin || isOwner;
  if (!canManage) redirect(`/players/${id}`);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title={`Editar · ${player.name}`}
        description={
          admin
            ? "Ajusta los datos y atributos del jugador."
            : "Edita tu información. Los atributos los ajusta el staff."
        }
      />
      <PlayerForm player={player} canManage={canManage} canEditStats={admin} />
    </div>
  );
}
