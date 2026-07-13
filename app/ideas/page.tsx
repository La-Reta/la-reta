import { IdeaForm } from "@/components/features/ideas/idea-form";
import { IdeasView } from "@/components/features/ideas/ideas-view";
import { PageHeader } from "@/components/shared/page-header";
import { SectionHeading } from "@/components/shared/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { isAdmin } from "@/lib/admin";
import { getIdeas } from "@/lib/queries";
import { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Ideas · Reta Fútbol" };
export const dynamic = "force-dynamic";

export default async function IdeasPage() {
  const [ideas, admin] = await Promise.all([getIdeas(), isAdmin()]);

  // Aprovechamos el estado que ya guardamos: lo abierto queda a la vista y lo
  // resuelto (hecho/descartado) se pliega en colapsables ocultos por defecto.
  const done = ideas.filter((i) => i.status === "hecha");
  const discarded = ideas.filter((i) => i.status === "descartada");
  const pending = ideas.filter(
    (i) => i.status !== "hecha" && i.status !== "descartada",
  );

  return (
    <div className="mx-auto max-w-5xl min-w-0 space-y-6 xl:container">
      <PageHeader
        title="Ideas de la reta"
        description="¿Tienes una propuesta para mejorar la reta? Déjala aquí. El equipo la revisa y le asigna prioridad."
      />

      <IdeaForm />

      {ideas.length === 0 ? (
        <EmptyNote>
          Aún no hay ideas. ¡Sé el primero en proponer algo!
        </EmptyNote>
      ) : (
        <div className="space-y-6">
          {/* Pendientes — siempre a la vista */}
          <section className="space-y-3">
            <SectionHeading title="Pendientes" count={pending.length} />
            {pending.length > 0 ? (
              <IdeasView ideas={pending} admin={admin} />
            ) : (
              <EmptyNote>No hay ideas pendientes. ¡Todo al día! 🎉</EmptyNote>
            )}
          </section>

          {done.length > 0 && (
            <section className="space-y-3">
              <SectionHeading
                title="Hechas"
                count={done.length}
                tone="emerald"
              />
              <IdeasView ideas={done} admin={admin} />
            </section>
          )}

          {discarded.length > 0 && (
            <section className="space-y-3">
              <SectionHeading
                title="Descartadas"
                count={discarded.length}
                tone="muted"
              />
              <IdeasView ideas={discarded} admin={admin} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <Card size="sm">
      <CardContent className="py-6 text-center">
        <p className="text-muted-foreground text-sm">{children}</p>
      </CardContent>
    </Card>
  );
}
