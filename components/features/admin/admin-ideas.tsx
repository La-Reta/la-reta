"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MonitorSmartphoneIcon, SaveIcon, Trash2Icon } from "lucide-react";
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
import { formatCompactDate } from "@/lib/dates";

export function AdminIdeas({ ideas }: { ideas: Idea[] }) {
  const [selectedId, setSelectedId] = React.useState<number | null>(
    ideas[0]?.id ?? null,
  );

  const selected = ideas.find((i) => i.id === selectedId) ?? null;

  if (ideas.length === 0) {
    return (
      <p className="bg-card text-muted-foreground ring-foreground/10 rounded-lg p-8 text-center text-sm ring-1">
        Todavía no hay ideas que revisar.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr] md:items-start">
      {/* Lista */}
      <div className="divide-border bg-card ring-foreground/10 divide-y rounded-lg ring-1">
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
              <span className="text-muted-foreground text-[10px]">
                {formatCompactDate(idea.createdAt)}
              </span>
            </span>
          </button>
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
        <p className="bg-card text-muted-foreground ring-foreground/10 rounded-lg p-8 text-center text-sm ring-1">
          Selecciona una idea para revisarla.
        </p>
      )}
    </div>
  );
}

function ideaDraft(idea: Idea) {
  return {
    status: idea.status,
    priority: idea.priority ?? "",
    estimate: idea.estimate ?? "",
    adminNotes: idea.adminNotes ?? "",
  };
}

function IdeaEditor({
  idea,
  onDeleted,
}: {
  idea: Idea;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [draft, setDraft] = React.useState(() => ideaDraft(idea));

  function save() {
    startTransition(async () => {
      const res = await updateIdeaTriage(idea.id, draft);
      if (res.ok) {
        toast.success("Idea actualizada");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function remove() {
    if (!confirm(`¿Eliminar la idea "${idea.title}"?`)) return;
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
    <div className="bg-card ring-foreground/10 space-y-4 rounded-lg p-4 ring-1">
      <div>
        <h2 className="text-lg font-bold">{idea.title}</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {idea.description}
        </p>
        <p className="text-muted-foreground mt-2 text-xs">
          {IDEA_CATEGORY_LABEL[idea.category]} · por{" "}
          {idea.author ?? "Anónimo"} · {formatCompactDate(idea.createdAt)}
        </p>
      </div>

      <div className="rounded-lg border bg-muted/30 p-3">
        <div className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold uppercase">
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
          <p className="text-muted-foreground mt-2 line-clamp-2 text-[11px]">
            {idea.userAgent}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 block text-xs">Estado</Label>
          <NativeSelect
            className="w-full"
            value={draft.status}
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
          <Label className="mb-1.5 block text-xs">Tiempo estimado</Label>
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
  );
}

function ClientInfo({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <p className="text-muted-foreground text-[10px] uppercase">{label}</p>
      <p className="truncate font-medium">{value ?? "—"}</p>
    </div>
  );
}
