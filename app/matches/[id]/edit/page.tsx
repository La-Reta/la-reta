import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { getMatchById, getPlayers } from "@/lib/queries";
import { MatchForm } from "@/components/features/matches/match-form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Editar partido · Reta Fútbol" };
export const dynamic = "force-dynamic";

export default async function EditMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [match, players] = await Promise.all([
    getMatchById(Number(id)),
    getPlayers(),
  ]);
  if (!match) notFound();

  const formPlayers = [...players]
    .map((p) => ({ id: p.id, name: p.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Button variant="ghost" size="sm" render={<Link href="/matches" />}>
        <ArrowLeftIcon />
        Partidos
      </Button>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar partido</h1>
        <p className="text-muted-foreground text-sm">
          Ajusta el marcador, el balance y los goleadores.
        </p>
      </div>
      <MatchForm
        players={formPlayers}
        match={{
          id: match.id,
          playedAt: match.playedAt,
          teamAName: match.teamAName,
          teamBName: match.teamBName,
          scoreA: match.scoreA,
          scoreB: match.scoreB,
          balance: match.balance,
          durationSec: match.durationSec,
          notes: match.notes,
          scorers: match.scorers.map((s) => ({
            playerId: s.playerId,
            goals: s.goals,
          })),
        }}
      />
    </div>
  );
}
