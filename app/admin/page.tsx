import Link from "next/link";
import { LightbulbIcon, ArrowRightIcon } from "lucide-react";
import { isAdmin } from "@/lib/admin";
import { getIdeas } from "@/lib/queries";
import { AdminLogin } from "@/components/features/admin/admin-login";
import { LogoutButton } from "@/components/features/admin/logout-button";

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
          <p className="text-muted-foreground text-sm">
            Gestiona la reta. Tienes acceso de admin.
          </p>
        </div>
        <LogoutButton />
      </div>

      <Link
        href="/admin/ideas"
        className="bg-card ring-foreground/10 hover:bg-muted/50 flex items-center gap-4 rounded-lg p-4 ring-1 transition-colors"
      >
        <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-md">
          <LightbulbIcon className="size-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">Ideas</p>
          <p className="text-muted-foreground text-xs">
            {ideas.length} en total
            {pending > 0 ? ` · ${pending} sin revisar` : ""}
          </p>
        </div>
        <ArrowRightIcon className="text-muted-foreground size-4" />
      </Link>
    </div>
  );
}
