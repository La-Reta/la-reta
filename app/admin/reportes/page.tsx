import { AdminBackButton } from "@/components/features/admin/admin-back-button";
import { AdminLogin } from "@/components/features/admin/admin-login";
import { AdminReports } from "@/components/features/admin/admin-reports";
import { LogoutButton } from "@/components/features/admin/logout-button";
import { isAdmin } from "@/lib/admin";
import { getReports } from "@/lib/queries";

export const metadata = { title: "Reportes · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  if (!(await isAdmin())) return <AdminLogin />;

  const reports = await getReports();

  return (
    <div className="mx-auto max-w-5xl min-w-0 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <AdminBackButton />
        <LogoutButton />
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Revisar reportes</h1>
        <p className="text-muted-foreground text-sm">
          Lista privada de ayuda, denuncias, errores y solicitudes sensibles.
        </p>
      </div>
      <AdminReports reports={reports} />
    </div>
  );
}
