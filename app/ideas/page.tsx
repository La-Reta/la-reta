import { getIdeas } from "@/lib/queries";
import { isAdmin } from "@/lib/admin";
import { IdeaForm } from "@/components/idea-form";
import { IdeaRowActions } from "@/components/idea-row-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  IDEA_CATEGORY_LABEL,
  IDEA_STATUS_LABEL,
  IDEA_STATUS_CLASS,
  IDEA_PRIORITY_LABEL,
  IDEA_PRIORITY_CLASS,
} from "@/lib/constants";

export const metadata = { title: "Ideas · Reta Fútbol" };
export const dynamic = "force-dynamic";

const fmt = (d: Date | string) =>
  new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short" }).format(
    new Date(d),
  );

export default async function IdeasPage() {
  const [ideas, admin] = await Promise.all([getIdeas(), isAdmin()]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ideas de la reta</h1>
        <p className="text-sm text-muted-foreground">
          ¿Tienes una propuesta para mejorar la reta? Déjala aquí. El equipo la
          revisa y le asigna prioridad.
        </p>
      </div>

      <IdeaForm />

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground">
          <span className="h-4 w-1 rounded-full bg-primary" />
          {ideas.length} idea{ideas.length === 1 ? "" : "s"}
        </h2>

        {ideas.length === 0 ? (
          <p className="bg-card p-8 text-center text-sm text-muted-foreground rounded-lg ring-1 ring-foreground/10">
            Aún no hay ideas. ¡Sé el primero en proponer algo!
          </p>
        ) : (
          <div className="overflow-x-auto bg-card rounded-lg ring-1 ring-foreground/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-64">Idea</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Tiempo</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead className="text-right">Fecha</TableHead>
                  {admin ? <TableHead className="w-10" /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ideas.map((idea) => (
                  <TableRow key={idea.id}>
                    <TableCell>
                      <p className="font-medium">{idea.title}</p>
                      <p className="line-clamp-2 max-w-md text-xs text-muted-foreground">
                        {idea.description}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {IDEA_CATEGORY_LABEL[idea.category]}
                    </TableCell>
                    <TableCell>
                      <Pill className={IDEA_STATUS_CLASS[idea.status]}>
                        {IDEA_STATUS_LABEL[idea.status]}
                      </Pill>
                    </TableCell>
                    <TableCell>
                      {idea.priority ? (
                        <Pill className={IDEA_PRIORITY_CLASS[idea.priority]}>
                          {IDEA_PRIORITY_LABEL[idea.priority]}
                        </Pill>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {idea.estimate ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {idea.author ?? "Anónimo"}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {fmt(idea.createdAt)}
                    </TableCell>
                    {admin ? (
                      <TableCell className="text-right">
                        <IdeaRowActions id={idea.id} status={idea.status} />
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}

function Pill({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-sm px-1.5 py-0.5 text-[11px] font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}
