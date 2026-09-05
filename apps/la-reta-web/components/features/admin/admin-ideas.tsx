"use client";

import { deleteIdea, updateIdeaTriage } from "@/app/actions/ideas";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  IDEA_CATEGORY_LABEL,
  IDEA_PRIORITIES,
  IDEA_PRIORITY_CLASS,
  IDEA_PRIORITY_LABEL,
  IDEA_STATUSES,
  IDEA_STATUS_CLASS,
  IDEA_STATUS_DONE,
  IDEA_STATUS_DOT,
  IDEA_STATUS_LABEL,
} from "@/lib/constants";
import { formatCompactDate } from "@/lib/dates";
import type { Idea } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { MonitorSmartphoneIcon, SaveIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

/**
 * La lista se agrupa por estado siguiendo el flujo (nueva → planeada → en
 * progreso → hecha → descartada), con encabezado pegajoso y conteo. Así se ve
 * de un vistazo qué falta y qué ya se hizo, y al cambiar el estado de una idea
 * se ve saltar de grupo — sin filtros que recordar ni nada que se esconda.
 */
export const AdminIdeas = ({ ideas }: { readonly ideas: Idea[] }) => {
  const [selectedId, setSelectedId] = React.useState<number | null>(
    ideas[0]?.id ?? null
  );

  const selected = ideas.find((i) => i.id === selectedId) ?? null;
  const groups = IDEA_STATUSES.flatMap((status) => {
    const items = ideas.filter((i) => i.status === status);
    return items.length > 0 ? [{ status, items }] : [];
  });

  if (ideas.length === 0) {
    return <EmptyNote>Todavía no hay ideas que revisar.</EmptyNote>;
  }

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
      {/* Lista */}
      <div className="bg-card ring-foreground/10 min-w-0 overflow-hidden rounded-xl ring-1 lg:sticky lg:top-16 lg:max-h-[calc(100svh-6rem)] lg:overflow-y-auto">
        {groups.map((group) => (
          <section key={group.status}>
            <h3 className="bg-card/95 text-muted-foreground sticky top-0 z-10 flex items-center gap-2 border-b px-3 py-1.5 text-xs font-semibold tracking-wide uppercase backdrop-blur">
              <span
                aria-hidden="true"
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  IDEA_STATUS_DOT[group.status]
                )}
              />
              {IDEA_STATUS_LABEL[group.status]}
              <span className="ml-auto font-mono tabular-nums">
                {group.items.length}
              </span>
            </h3>
            <div className="divide-border divide-y">
              {group.items.map((idea) => (
                <button
                  key={idea.id}
                  type="button"
                  onClick={() => setSelectedId(idea.id)}
                  className={cn(
                    "flex w-full min-w-0 flex-col gap-1 border-l-2 px-3 py-2.5 text-left transition-colors",
                    idea.id === selectedId
                      ? "bg-muted border-l-primary"
                      : "hover:bg-muted/50 border-l-transparent"
                  )}
                >
                  <span
                    className={cn(
                      "line-clamp-1 text-sm font-medium",
                      // Lo terminado se atenúa para que el trabajo vivo resalte.
                      IDEA_STATUS_DONE[idea.status] && "text-muted-foreground",
                      idea.status === "descartada" && "line-through"
                    )}
                  >
                    {idea.title}
                  </span>
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      {formatCompactDate(idea.createdAt)}
                    </span>
                    {idea.priority ? (
                      <span
                        className={cn(
                          "rounded-sm px-1.5 py-0.5 text-xs font-medium",
                          IDEA_PRIORITY_CLASS[idea.priority]
                        )}
                      >
                        {IDEA_PRIORITY_LABEL[idea.priority]}
                      </span>
                    ) : null}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Editor */}
      {selected ? (
        <IdeaEditor
          key={selected.id}
          idea={selected}
          onDeleted={() => setSelectedId(null)}
        />
      ) : (
        <EmptyNote>Selecciona una idea para revisarla.</EmptyNote>
      )}
    </div>
  );
};

function ideaDraft(idea: Idea) {
  return {
    status: idea.status,
    priority: idea.priority ?? "",
    estimate: idea.estimate ?? "",
    adminNotes: idea.adminNotes ?? "",
  };
}

const IdeaEditor = ({
  idea,
  onDeleted,
}: {
  readonly idea: Idea;
  readonly onDeleted: () => void;
}) => {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const statusId = React.useId();
  const priorityId = React.useId();
  const estimateId = React.useId();
  const notesId = React.useId();
  const [draft, setDraft] = React.useState(() => ideaDraft(idea));

  function save() {
    startTransition(async () => {
      const res = await updateIdeaTriage(idea.id, draft);
      if (res.ok) {
        // Nombrar el estado confirma a dónde se movió en la lista.
        toast.success(
          draft.status === idea.status
            ? "Idea actualizada"
            : `Idea movida a ${IDEA_STATUS_LABEL[draft.status]}`
        );
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await deleteIdea(idea.id);
      if (res.ok) {
        toast.success("Idea eliminada");
        onDeleted();
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Card className="min-w-0">
      <CardContent className="min-w-0 space-y-4">
        <div className="min-w-0">
          {/* El estado actual se ve sin tener que buscar el select de abajo. */}
          <span
            className={cn(
              "mb-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold",
              IDEA_STATUS_CLASS[idea.status]
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "size-1.5 rounded-full",
                IDEA_STATUS_DOT[idea.status]
              )}
            />
            {IDEA_STATUS_LABEL[idea.status]}
          </span>
          <h2 className="text-lg font-bold break-words">{idea.title}</h2>
          <p className="text-muted-foreground mt-1 text-sm break-words">
            {idea.description}
          </p>
          <p className="text-muted-foreground mt-2 text-xs break-words">
            {IDEA_CATEGORY_LABEL[idea.category]} · por{" "}
            {idea.author ?? "Anónimo"} · {formatCompactDate(idea.createdAt)}
          </p>
        </div>

        <div className="bg-muted/30 min-w-0 rounded-lg border p-3">
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold uppercase">
            <MonitorSmartphoneIcon className="size-3.5" />
            Cliente
          </div>
          <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
            <ClientInfo label="Idioma" value={idea.language} />
            <ClientInfo label="Zona" value={idea.timezone} />
            <ClientInfo label="Pantalla" value={idea.screen} />
            <ClientInfo label="Plataforma" value={idea.platform} />
          </div>
          {idea.userAgent ? (
            <p className="text-muted-foreground mt-2 line-clamp-3 text-xs break-all">
              {idea.userAgent}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor={statusId} className="mb-1.5 block text-xs">
              Estado
            </Label>
            <NativeSelect
              className="w-full"
              value={draft.status}
              id={statusId}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  status: e.target.value as Idea["status"],
                }))
              }
            >
              {IDEA_STATUSES.map((s) => (
                <NativeSelectOption key={s} value={s}>
                  {IDEA_STATUS_LABEL[s]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor={priorityId} className="mb-1.5 block text-xs">
              Prioridad
            </Label>
            <NativeSelect
              className="w-full"
              value={draft.priority}
              id={priorityId}
              onChange={(e) =>
                setDraft((d) => ({ ...d, priority: e.target.value }))
              }
            >
              <NativeSelectOption value="">Sin prioridad</NativeSelectOption>
              {IDEA_PRIORITIES.map((p) => (
                <NativeSelectOption key={p} value={p}>
                  {IDEA_PRIORITY_LABEL[p]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor={estimateId} className="mb-1.5 block text-xs">
              Tiempo estimado
            </Label>
            <Input
              value={draft.estimate}
              id={estimateId}
              onChange={(e) =>
                setDraft((d) => ({ ...d, estimate: e.target.value }))
              }
              placeholder="Ej. 2 semanas, 1 jornada…"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor={notesId} className="mb-1.5 block text-xs">
              Notas internas
            </Label>
            <Textarea
              value={draft.adminNotes}
              id={notesId}
              onChange={(e) =>
                setDraft((d) => ({ ...d, adminNotes: e.target.value }))
              }
              rows={3}
              placeholder="Notas del equipo sobre esta idea…"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={save} disabled={pending}>
            <SaveIcon />
            {pending ? "Guardando…" : "Guardar"}
          </Button>
          <ConfirmDialog
            pending={pending}
            onConfirm={remove}
            title="¿Eliminar esta idea?"
            description={`“${idea.title}” se borra del tablero de ideas. No se puede deshacer.`}
            trigger={
              <Button variant="destructive" disabled={pending}>
                <Trash2Icon />
                Eliminar
              </Button>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
};

const EmptyNote = ({ children }: { readonly children: React.ReactNode }) => {
  return (
    <Card size="sm">
      <CardContent className="py-6 text-center">
        <p className="text-muted-foreground text-sm">{children}</p>
      </CardContent>
    </Card>
  );
};

const ClientInfo = ({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string | null;
}) => {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground text-xs uppercase">{label}</p>
      <p className="font-medium break-words">{value ?? "—"}</p>
    </div>
  );
};
