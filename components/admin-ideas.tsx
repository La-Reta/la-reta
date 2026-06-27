"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2Icon, SaveIcon } from "lucide-react";
import { updateIdeaTriage, deleteIdea } from "@/app/actions/ideas";
import {
  IDEA_CATEGORY_LABEL,
  IDEA_STATUSES,
  IDEA_STATUS_LABEL,
  IDEA_STATUS_CLASS,
  IDEA_PRIORITIES,
  IDEA_PRIORITY_LABEL,
} from "@/lib/constants";
import type { Idea } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

const fmt = (d: Date | string) =>
  new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  }).format(new Date(d));

export function AdminIdeas({ ideas }: { ideas: Idea[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = React.useState<number | null>(
    ideas[0]?.id ?? null,
  );
  const [pending, startTransition] = React.useTransition();

  const selected = ideas.find((i) => i.id === selectedId) ?? null;

  const [draft, setDraft] = React.useState({
    status: "",
    priority: "",
    estimate: "",
    adminNotes: "",
  });

  // Load the selected idea's triage fields into the editable draft.
  React.useEffect(() => {
    if (selected) {
      setDraft({
        status: selected.status,
        priority: selected.priority ?? "",
        estimate: selected.estimate ?? "",
        adminNotes: selected.adminNotes ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  function save() {
    if (!selected) return;
    startTransition(async () => {
      const res = await updateIdeaTriage(selected.id, draft);
      if (res.ok) {
        toast.success("Idea actualizada");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function remove() {
    if (!selected) return;
    if (!confirm(`¿Eliminar la idea "${selected.title}"?`)) return;
    startTransition(async () => {
      const res = await deleteIdea(selected.id);
      if (res.ok) {
        toast.success("Idea eliminada");
        setSelectedId(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  if (ideas.length === 0) {
    return (
      <p className="bg-card p-8 text-center text-sm text-muted-foreground rounded-lg ring-1 ring-foreground/10">
        Todavía no hay ideas que revisar.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr] md:items-start">
      {/* Lista */}
      <div className="divide-y divide-border bg-card rounded-lg ring-1 ring-foreground/10">
        {ideas.map((idea) => (
          <button
            key={idea.id}
            type="button"
            onClick={() => setSelectedId(idea.id)}
            className={cn(
              "flex w-full flex-col gap-1 px-3 py-2.5 text-left transition-colors",
              idea.id === selectedId ? "bg-muted" : "hover:bg-muted/50",
            )}
          >
            <span className="line-clamp-1 text-sm font-medium">
              {idea.title}
            </span>
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-sm px-1.5 py-0.5 text-[10px] font-medium",
                  IDEA_STATUS_CLASS[idea.status],
                )}
              >
                {IDEA_STATUS_LABEL[idea.status]}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {fmt(idea.createdAt)}
              </span>
            </span>
          </button>
        ))}
      </div>

      {/* Editor */}
      {selected ? (
        <div className="space-y-4 bg-card p-4 rounded-lg ring-1 ring-foreground/10">
          <div>
            <h2 className="text-lg font-bold">{selected.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {selected.description}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {IDEA_CATEGORY_LABEL[selected.category]} · por{" "}
              {selected.author ?? "Anónimo"} · {fmt(selected.createdAt)}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs">Estado</Label>
              <NativeSelect
                className="w-full"
                value={draft.status}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, status: e.target.value }))
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
              <Label className="mb-1.5 block text-xs">Prioridad</Label>
              <NativeSelect
                className="w-full"
                value={draft.priority}
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
              <Label className="mb-1.5 block text-xs">
                Tiempo estimado
              </Label>
              <Input
                value={draft.estimate}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, estimate: e.target.value }))
                }
                placeholder="Ej. 2 semanas, 1 jornada…"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block text-xs">Notas internas</Label>
              <Textarea
                value={draft.adminNotes}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, adminNotes: e.target.value }))
                }
                rows={3}
                placeholder="Notas del equipo sobre esta idea…"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={save} disabled={pending}>
              <SaveIcon />
              {pending ? "Guardando…" : "Guardar"}
            </Button>
            <Button variant="destructive" onClick={remove} disabled={pending}>
              <Trash2Icon />
              Eliminar
            </Button>
          </div>
        </div>
      ) : (
        <p className="bg-card p-8 text-center text-sm text-muted-foreground rounded-lg ring-1 ring-foreground/10">
          Selecciona una idea para revisarla.
        </p>
      )}
    </div>
  );
}
