import Link from "next/link";
import { LightbulbIcon, ArrowRightIcon } from "lucide-react";
import { isAdmin } from "@/lib/admin";
import { getIdeas } from "@/lib/queries";
import { AdminLogin } from "@/components/admin-login";
import { LogoutButton } from "@/components/logout-button";

export const metadata = { title: "Admin · Reta Fútbol" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) return <AdminLogin />;

  const ideas = await getIdeas();
  const pending = ideas.filter((i) => i.status === "nueva").length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Administración</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona la reta. Tienes acceso de admin.
          </p>
        </div>
        <LogoutButton />
      </div>

      <Link
        href="/admin/ideas"
        className="flex items-center gap-4 bg-card p-4 rounded-lg ring-1 ring-foreground/10 transition-colors hover:bg-muted/50"
      >
        <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          <LightbulbIcon className="size-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">Ideas</p>
          <p className="text-xs text-muted-foreground">
            {ideas.length} en total
            {pending > 0 ? ` · ${pending} sin revisar` : ""}
          </p>
        </div>
        <ArrowRightIcon className="size-4 text-muted-foreground" />
      </Link>
    </div>
  );
}
