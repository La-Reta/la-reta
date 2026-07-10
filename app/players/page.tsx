import { PlayersBrowser } from "@/components/features/players/players-browser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isAdmin } from "@/lib/admin";
import { getPendingSignupCount, getPlayers } from "@/lib/queries";
import {
  ClipboardListIcon,
  UserPlusIcon,
  UserRoundPlusIcon,
} from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Jugadores · Reta Fútbol" };
export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const [players, admin] = await Promise.all([getPlayers(), isAdmin()]);
  const pendingSignups = admin ? await getPendingSignupCount() : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jugadores</h1>
          <p className="text-muted-foreground text-sm">
            La plantilla completa de la reta, en cartas estilo FIFA.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {admin && (
            <Button variant="outline" render={<Link href="/admin/registros" />}>
              <ClipboardListIcon />
              Solicitudes
              {pendingSignups > 0 ? (
                <Badge variant="secondary">{pendingSignups}</Badge>
              ) : null}
            </Button>
          )}
          <Button variant="outline" render={<Link href="/players/registro" />}>
            <UserRoundPlusIcon />
            Registrar nuevo jugador
          </Button>
          {admin && (
            <Button render={<Link href="/players/new" />}>
              <UserPlusIcon />
              Nuevo
            </Button>
          )}
        </div>
      </div>
      <PlayersBrowser players={players} isAdmin={admin} />
    </div>
  );
}
