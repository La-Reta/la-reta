import { IdeaForm } from "@/components/features/ideas/idea-form";
import { IdeasView } from "@/components/features/ideas/ideas-view";
import { isAdmin } from "@/lib/admin";
import { getIdeas } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { Metadata } from "next";

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ideas de la reta</h1>
        <p className="text-muted-foreground text-sm">
          ¿Tienes una propuesta para mejorar la reta? Déjala aquí. El equipo la
          revisa y le asigna prioridad.
        </p>
      </div>

      <IdeaForm />

      {ideas.length === 0 ? (
        <p className="bg-card text-muted-foreground ring-foreground/10 rounded-lg p-8 text-center text-sm ring-1">
          Aún no hay ideas. ¡Sé el primero en proponer algo!
        </p>
      ) : (
        <div className="space-y-6">
          {/* Pendientes — siempre a la vista */}
          <section className="space-y-3">
            <GroupHeading title="Pendientes" count={pending.length} />
            {pending.length > 0 ? (
              <IdeasView ideas={pending} admin={admin} />
            ) : (
              <p className="bg-card text-muted-foreground ring-foreground/10 rounded-lg p-6 text-center text-sm ring-1">
                No hay ideas pendientes. ¡Todo al día! 🎉
              </p>
            )}
          </section>

          {done.length > 0 && (
            <section className="space-y-3">
              <GroupHeading
                title="Hechas"
                count={done.length}
                toneClassName="bg-emerald-500"
              />
              <IdeasView ideas={done} admin={admin} />
            </section>
          )}

          {discarded.length > 0 && (
            <section className="space-y-3">
              <GroupHeading
                title="Descartadas"
                count={discarded.length}
                toneClassName="bg-muted-foreground"
              />
              <IdeasView ideas={discarded} admin={admin} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function GroupHeading({
  title,
  count,
  toneClassName,
}: {
  title: string;
  count: number;
  toneClassName?: string;
}) {
  return (
    <h2 className="text-muted-foreground flex items-center gap-2 text-sm font-semibold uppercase">
      <span
        className={cn("h-4 w-1 rounded-full", toneClassName ?? "bg-primary")}
      />
      {title}
      <span className="text-muted-foreground/70 font-normal normal-case">
        · {count}
      </span>
    </h2>
  );
}
