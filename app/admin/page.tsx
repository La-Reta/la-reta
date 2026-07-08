import Link from "next/link";
import {
  LifeBuoyIcon,
  LightbulbIcon,
  ArrowRightIcon,
  ClipboardListIcon,
} from "lucide-react";
import { isAdmin } from "@/lib/admin";
import { getIdeas, getPendingSignupCount, getReports } from "@/lib/queries";
import { AdminLogin } from "@/components/features/admin/admin-login";
import { LogoutButton } from "@/components/features/admin/logout-button";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Admin · Reta Fútbol" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) return <AdminLogin />;

  const [ideas, reports, pendingSignups] = await Promise.all([
    getIdeas(),
    getReports(),
    getPendingSignupCount(),
  ]);
  const pending = ideas.filter((i) => i.status === "nueva").length;
  const pendingReports = reports.filter(
    (report) => report.status === "nuevo",
  ).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Administración</h1>
          <p className="text-muted-foreground text-sm">
            Gestiona la reta. Tienes acceso de admin.
          </p>
        </div>
        <LogoutButton />
      </div>

      <div className="grid gap-3">
        <AdminLink
          href="/admin/ideas"
          icon={LightbulbIcon}
          title="Ideas"
          description={`${ideas.length} en total${pending > 0 ? ` · ${pending} sin revisar` : ""}`}
        />
        <AdminLink
          href="/admin/reportes"
          icon={LifeBuoyIcon}
          title="Reportes"
          description={`${reports.length} en total${pendingReports > 0 ? ` · ${pendingReports} nuevos` : ""}`}
        />
        <AdminLink
          href="/admin/registros"
          icon={ClipboardListIcon}
          title="Solicitudes de jugadores"
          description={
            pendingSignups > 0
              ? `${pendingSignups} en espera de darse de alta`
              : "Sin solicitudes pendientes"
          }
        />
      </div>
    </div>
  );
}

function AdminLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ComponentType<React.ComponentProps<"svg">>;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="bg-card ring-foreground/10 hover:bg-muted/50 flex items-center gap-4 rounded-lg p-4 ring-1 transition-colors"
    >
      <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-md">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
      <ArrowRightIcon className="text-muted-foreground size-4" />
    </Link>
  );
}
