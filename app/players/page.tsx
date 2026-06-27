import Link from "next/link";
import { UserPlusIcon } from "lucide-react";
import { getPlayers } from "@/lib/queries";
import { isAdmin } from "@/lib/admin";
import { PlayersBrowser } from "@/components/features/players/players-browser";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Jugadores · Reta Fútbol" };
export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const [players, admin] = await Promise.all([getPlayers(), isAdmin()]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jugadores</h1>
          <p className="text-muted-foreground text-sm">
            La plantilla completa de la reta, en cartas estilo FIFA.
          </p>
        </div>
        <Button render={<Link href="/players/new" />}>
          <UserPlusIcon />
          Nuevo
        </Button>
      </div>
      <PlayersBrowser players={players} isAdmin={admin} />
    </div>
  );
}
