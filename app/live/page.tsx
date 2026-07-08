import { LiveLock } from "@/components/features/live/live-lock";
import { LiveMatch } from "@/components/features/live/live-match";
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
    <div className="container space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Marcador en vivo</h1>
        <p className="text-muted-foreground text-sm">
          Lleva el marcador durante el partido. Al finalizar se guarda solo en
          el registro de partidos.
        </p>
      </div>
      {unlocked ? <LiveMatch players={list} /> : <LiveLock />}
    </div>
  );
}
