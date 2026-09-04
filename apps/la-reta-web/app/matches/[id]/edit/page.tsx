import { RetaMatchForm } from "@/components/features/matches/reta-match-form";
import { PageHeader } from "@/components/shared/page-header";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { isAdmin } from "@/lib/admin";
import { getMatchById, getPlayers } from "@/lib/queries";
import { matchTeams } from "@/lib/teams";
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
    <div className="mx-auto max-w-4xl space-y-4 lg:container lg:max-w-none">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/matches">Partidos</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/matches/${match.id}/detail`}>
              Detalle partido
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Editar partido</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
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
