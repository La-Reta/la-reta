import { CasacasClient } from "@/components/features/casacas/casacas-client";
import { PageHeader } from "@/components/shared/page-header";
import { isAdmin } from "@/lib/admin";
import { getCasacaAssignments, getPlayers } from "@/lib/queries";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Casacas · Reta Fútbol" };
export const dynamic = "force-dynamic";

export default async function CasacasPage() {
  const [players, assignments, admin, { userId }] = await Promise.all([
    getPlayers(),
    getCasacaAssignments(),
    isAdmin(),
    auth(),
  ]);

  return (
    <div className="container mx-auto space-y-6">
      <PageHeader
        title="Casacas"
        description="Gira la ruleta para decidir, al azar, a quién le toca lavar las casacas. Los últimos dos que lavaron descansan este turno."
      />
      <CasacasClient
        players={players}
        assignments={assignments}
        canManage={admin || Boolean(userId)}
        admin={admin}
      />
    </div>
  );
}
