import { AdminIdeas } from "@/components/features/admin/admin-ideas";
import { AdminLogin } from "@/components/features/admin/admin-login";
import { LogoutButton } from "@/components/features/admin/logout-button";
import { Button } from "@/components/ui/button";
import { isAdmin } from "@/lib/admin";
import { getIdeas } from "@/lib/queries";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Ideas · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminIdeasPage() {
  if (!(await isAdmin())) return <AdminLogin />;

  const ideas = await getIdeas();

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="sm" render={<Link href="/admin" />}>
          <ArrowLeftIcon />
          Admin
        </Button>
        <LogoutButton />
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Revisar ideas</h1>
        <p className="text-muted-foreground text-sm">
          Asigna estado, prioridad y tiempo a cada propuesta.
        </p>
      </div>
      <AdminIdeas ideas={ideas} />
    </div>
  );
}
