import { LiveLock } from "@/components/features/live/live-lock";
import { LiveMatch } from "@/components/features/live/live-match";
import { PageHeader } from "@/components/shared/page-header";
import { isLiveUnlocked } from "@/lib/admin";
import { getPlayers } from "@/lib/queries";
import { Metadata } from "next";

export const metadata: Metadata = { title: "En vivo · Reta Fútbol" };
export const dynamic = "force-dynamic";

export default async function LivePage() {
  const [players, unlocked] = await Promise.all([
    getPlayers(),
    isLiveUnlocked(),
  ]);
  const list = [...players]
    .map((p) => ({ id: p.id, name: p.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="container space-y-6 lg:mx-auto">
      <PageHeader
        title="Marcador en vivo"
        description="Lleva el marcador durante el partido. Al finalizar se guarda solo en el registro de partidos."
      />
      {unlocked ? <LiveMatch players={list} /> : <LiveLock />}
    </div>
  );
}
