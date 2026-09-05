import { PlayersBrowser } from "@/components/features/players/players-browser";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { isAdmin } from "@/lib/admin";
import { getPendingSignupCount, getPlayers } from "@/lib/queries";
import {
  ClipboardListIcon,
  UserPlusIcon,
  UserRoundPlusIcon,
} from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageTransition } from "@/components/app/page-transition";

export const metadata: Metadata = { title: "Jugadores · Reta Fútbol" };
export const dynamic = "force-dynamic";

const PlayersPage = async () => {
  const [players, admin] = await Promise.all([getPlayers(), isAdmin()]);
  const pendingSignups = admin ? await getPendingSignupCount() : 0;

  return (
    <PageTransition>
      <div className="space-y-6 xl:container xl:mx-auto">
        <PageHeader
          title="Jugadores"
          description="La plantilla completa de la reta, en cartas estilo FIFA."
          actions={
            <>
              {admin ? (
                <Button
                  variant="outline"
                  render={<Link href="/admin/registros" />}
                >
                  <ClipboardListIcon />
                  Solicitudes
                  {pendingSignups > 0 ? (
                    <Badge variant="secondary">{pendingSignups}</Badge>
                  ) : null}
                </Button>
              ) : null}
              <Button
                variant="outline"
                render={<Link href="/players/registro" />}
              >
                <UserRoundPlusIcon />
                Registrar nuevo jugador
              </Button>
              {admin ? (
                <Button render={<Link href="/players/new" />}>
                  <UserPlusIcon />
                  Nuevo
                </Button>
              ) : null}
            </>
          }
        />
        {/* PlayersBrowser lee los filtros de la URL con useSearchParams, así
            que necesita su propio límite de Suspense. El esqueleto se va hacia
            abajo y la rejilla entra desde abajo: el relevo se lee como "ya
            llegaron los datos", no como un parpadeo. */}
        <Suspense fallback={<BrowserSkeleton />}>
          <PlayersBrowser players={players} isAdmin={admin} />
        </Suspense>
      </div>
    </PageTransition>
  );
};

export default PlayersPage;

const BrowserSkeleton = () => {
  return (
    <div aria-busy="true" className="space-y-4">
      <Skeleton className="h-9 w-full sm:max-w-xs" />
      <div className="3xl:grid-cols-7 4xl:grid-cols-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {Array.from({ length: 12 }, (_, i) => `card-${i}`).map((key) => (
          <Skeleton key={key} className="aspect-7/10 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
};
