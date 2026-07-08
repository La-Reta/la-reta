import { AdminBackButton } from "@/components/features/admin/admin-back-button";
import { AdminLogin } from "@/components/features/admin/admin-login";
import { LogoutButton } from "@/components/features/admin/logout-button";
import { AdminSignups } from "@/components/features/players/admin-signups";
import { isAdmin } from "@/lib/admin";
import { getPlayerSignups } from "@/lib/queries";

export const metadata = { title: "Solicitudes de jugadores · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminSignupsPage() {
  if (!(await isAdmin())) return <AdminLogin />;

  const signups = await getPlayerSignups();
  const pending = signups.filter((s) => s.status === "pendiente").length;

  return (
    <div className="mx-auto max-w-5xl min-w-0 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <AdminBackButton />
        <LogoutButton />
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Solicitudes de jugadores
        </h1>
        <p className="text-muted-foreground text-sm">
          Personas en espera de darse de alta.
          {pending > 0
            ? ` ${pending} pendiente${pending === 1 ? "" : "s"}.`
            : ""}{" "}
          Revisa su info y regístralos como es debido.
        </p>
      </div>
      <AdminSignups signups={signups} />
    </div>
  );
}
