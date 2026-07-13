import { MatchForm } from "@/components/features/matches/match-form";
import { MatchesBackButton } from "@/components/features/matches/matches-back-button";
import { PageHeader } from "@/components/shared/page-header";
import { isAdmin } from "@/lib/admin";
import { getMatchById, getPlayers } from "@/lib/queries";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = { title: "Editar partido · Reta Fútbol" };
export const dynamic = "force-dynamic";

export default async function EditMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!(await isAdmin())) {
    redirect(`/matches/${id}/detail`);
  }

  const [match, players, admin] = await Promise.all([
    getMatchById(Number(id)),
    getPlayers(),
    isAdmin(),
  ]);
  if (!match) notFound();

  const formPlayers = [...players]
    .map((p) => ({ id: p.id, name: p.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <MatchesBackButton />
      <PageHeader
        title="Editar partido"
        description="Ajusta el marcador, el balance y los goleadores."
      />
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
            guestName: s.isGuest ? s.name : undefined,
            team: s.team,
            goals: s.goals,
          })),
        }}
        admin={admin}
      />
    </div>
  );
}
