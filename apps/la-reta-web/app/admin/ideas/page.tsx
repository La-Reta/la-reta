import { AdminBackButton } from "@/components/features/admin/admin-back-button";
import { AdminIdeas } from "@/components/features/admin/admin-ideas";
import { AdminLogin } from "@/components/features/admin/admin-login";
import { LogoutButton } from "@/components/features/admin/logout-button";
import { PageHeader } from "@/components/shared/page-header";
import { isAdmin } from "@/lib/admin";
import { getIdeas } from "@/lib/queries";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Ideas · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminIdeasPage() {
  if (!(await isAdmin())) return <AdminLogin />;

  const ideas = await getIdeas();

  return (
    <div className="mx-auto max-w-5xl min-w-0 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <AdminBackButton />
        <LogoutButton />
      </div>
      <PageHeader
        title="Revisar ideas"
        description="Asigna estado, prioridad y tiempo a cada propuesta."
      />
      <AdminIdeas ideas={ideas} />
    </div>
  );
}
