import { MatchesBackButton } from "@/components/features/matches/matches-back-button";
import { RetaMatchForm } from "@/components/features/matches/reta-match-form";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { isAdmin } from "@/lib/admin";
import { getMatchById, getPlayers } from "@/lib/queries";
import { matchTeams } from "@/lib/teams";
import { ArrowLeftIcon } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
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
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Dos salidas: al partido que se está editando (cancelar) y al listado. */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          render={<Link href={`/matches/${match.id}/detail`} />}
        >
          <ArrowLeftIcon />
          Volver al partido
        </Button>
        <MatchesBackButton />
      </div>
      <PageHeader
        title="Editar partido"
        description="Ajusta el marcador de cada equipo, las plantillas y los goleadores."
      />
      <RetaMatchForm
        players={formPlayers}
        admin={admin}
        match={{
          id: match.id,
          playedAt: match.playedAt,
          balance: match.balance,
          durationSec: match.durationSec,
          notes: match.notes,
          // Sean 2 o 6 equipos, siempre llegan como lista.
          teams: matchTeams(match),
          scorers: match.scorers.map((s) => ({
            playerId: s.playerId,
            name: s.name,
            team: s.team,
            goals: s.goals,
            assists: s.assists,
          })),
        }}
      />
    </div>
  );
}
