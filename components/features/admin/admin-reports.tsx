"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  GlobeIcon,
  MonitorSmartphoneIcon,
  SaveIcon,
  Trash2Icon,
} from "lucide-react";
import { deleteReport, updateReportTriage } from "@/app/actions/reports";
import {
  REPORT_CATEGORY_LABEL,
  REPORT_STATUSES,
  REPORT_STATUS_CLASS,
  REPORT_STATUS_LABEL,
} from "@/lib/constants";
import type { Report } from "@/lib/db/schema";
import { formatCompactDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

export function AdminReports({ reports }: { reports: Report[] }) {
  const [selectedId, setSelectedId] = React.useState<number | null>(
    reports[0]?.id ?? null,
  );
  const selected = reports.find((report) => report.id === selectedId) ?? null;

  if (reports.length === 0) {
    return (
      <p className="bg-card text-muted-foreground ring-foreground/10 rounded-lg p-8 text-center text-sm ring-1">
        Todavía no hay reportes.
      </p>
    );
  }

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
      <div className="divide-border bg-card ring-foreground/10 min-w-0 divide-y overflow-hidden rounded-lg ring-1 lg:sticky lg:top-16 lg:max-h-[calc(100svh-6rem)] lg:overflow-y-auto">
        {reports.map((report) => (
          <button
            key={report.id}
            type="button"
            onClick={() => setSelectedId(report.id)}
            className={cn(
              "flex w-full min-w-0 flex-col gap-1 px-3 py-2.5 text-left transition-colors",
              report.id === selectedId ? "bg-muted" : "hover:bg-muted/50",
            )}
          >
            <span className="line-clamp-1 text-sm font-medium">
              {report.title}
            </span>
            <span className="flex min-w-0 flex-wrap items-center gap-2">
              <Pill className={REPORT_STATUS_CLASS[report.status]}>
                {REPORT_STATUS_LABEL[report.status]}
              </Pill>
              <span className="text-muted-foreground text-[10px]">
                {formatCompactDate(report.createdAt)}
              </span>
            </span>
          </button>
        ))}
      </div>

      {selected ? (
        <ReportEditor
          key={selected.id}
          report={selected}
          onDeleted={() => setSelectedId(null)}
        />
      ) : (
        <p className="bg-card text-muted-foreground ring-foreground/10 rounded-lg p-8 text-center text-sm ring-1">
          Selecciona un reporte para revisarlo.
        </p>
      )}
    </div>
  );
}

function ReportEditor({
  report,
  onDeleted,
}: {
  report: Report;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [draft, setDraft] = React.useState({
    status: report.status,
    adminNotes: report.adminNotes ?? "",
  });

  function save() {
    startTransition(async () => {
      const res = await updateReportTriage(report.id, draft);
      if (res.ok) {
        toast.success("Reporte actualizado");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function remove() {
    if (!confirm(`¿Eliminar el reporte "${report.title}"?`)) return;
    startTransition(async () => {
      const res = await deleteReport(report.id);
      if (res.ok) {
        toast.success("Reporte eliminado");
        onDeleted();
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="bg-card ring-foreground/10 min-w-0 space-y-4 rounded-lg p-4 ring-1">
      <div className="min-w-0">
        <div className="flex flex-wrap gap-2">
          <Pill className={REPORT_STATUS_CLASS[report.status]}>
            {REPORT_STATUS_LABEL[report.status]}
          </Pill>
          <Pill className="bg-muted text-muted-foreground">
            {REPORT_CATEGORY_LABEL[report.category]}
          </Pill>
        </div>
        <h2 className="mt-3 text-lg font-bold break-words">{report.title}</h2>
        <p className="text-muted-foreground mt-1 text-sm break-words">
          {report.description}
        </p>
        <p className="text-muted-foreground mt-2 text-xs break-words">
          {report.reporterName ?? "Anónimo"} ·{" "}
          {report.contact ?? "sin contacto"} ·{" "}
          {formatCompactDate(report.createdAt)}
        </p>
        {report.relatedPath ? (
          <p className="text-muted-foreground mt-1 text-xs break-all">
            Ruta: {report.relatedPath}
          </p>
        ) : null}
      </div>

      <InfoPanel
        icon={MonitorSmartphoneIcon}
        title="Cliente"
        items={[
          ["Idioma", report.language],
          ["Idiomas", report.languages],
          ["Zona", report.timezone],
          ["Pantalla", report.screen],
          ["Viewport", report.viewport],
          ["Pixel ratio", report.pixelRatio],
          ["Plataforma", report.platform],
        ]}
        longValue={report.userAgent}
      />

      <InfoPanel
        icon={GlobeIcon}
        title="Request y ubicación aproximada"
        items={[
          ["IP", report.ipAddress],
          ["País", report.country],
          ["Región", report.region],
          ["Ciudad", report.city],
          ["Latitud", report.latitude],
          ["Longitud", report.longitude],
          ["Accept-Language", report.acceptLanguage],
        ]}
        longValue={report.forwardedFor}
      />

      <div className="grid gap-4">
        <div>
          <Label className="mb-1.5 block text-xs">Estado</Label>
          <NativeSelect
            className="w-full"
            value={draft.status}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                status: event.target.value as Report["status"],
              }))
            }
          >
            {REPORT_STATUSES.map((status) => (
              <NativeSelectOption key={status} value={status}>
                {REPORT_STATUS_LABEL[status]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">Notas internas</Label>
          <Textarea
            value={draft.adminNotes}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                adminNotes: event.target.value,
              }))
            }
            rows={4}
            placeholder="Notas privadas para seguimiento..."
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={save} disabled={pending}>
          <SaveIcon />
          {pending ? "Guardando..." : "Guardar"}
        </Button>
        <Button variant="destructive" onClick={remove} disabled={pending}>
          <Trash2Icon />
          Eliminar
        </Button>
      </div>
    </div>
  );
}

function InfoPanel({
  icon: Icon,
  title,
  items,
  longValue,
}: {
  icon: React.ComponentType<React.ComponentProps<"svg">>;
  title: string;
  items: Array<[string, string | number | null]>;
  longValue?: string | null;
}) {
  return (
    <div className="bg-muted/30 min-w-0 rounded-lg border p-3">
      <div className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold uppercase">
        <Icon className="size-3.5" />
        {title}
      </div>
      <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
        {items.map(([label, value]) => (
          <ClientInfo key={label} label={label} value={value} />
        ))}
      </div>
      {longValue ? (
        <p className="text-muted-foreground mt-2 line-clamp-3 text-[11px] break-all">
          {longValue}
        </p>
      ) : null}
    </div>
  );
}

function ClientInfo({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground text-[10px] uppercase">{label}</p>
      <p className="font-medium break-words">{value ?? "—"}</p>
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
        "inline-flex rounded-sm px-1.5 py-0.5 text-[10px] font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}
