"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2Icon, LifeBuoyIcon, SendIcon } from "lucide-react";
import { createReport } from "@/app/actions/reports";
import { REPORT_CATEGORIES, REPORT_CATEGORY_LABEL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

const EMPTY = {
  title: "",
  description: "",
  category: "ayuda",
  reporterName: "",
  contact: "",
  relatedPath: "",
};

export function ReportForm() {
  const router = useRouter();
  const [form, setForm] = React.useState(EMPTY);
  const [sent, setSent] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Agrega un título y describe el reporte.");
      return;
    }

    startTransition(async () => {
      const res = await createReport({ ...form, client: collectClientInfo() });

      if (res.ok) {
        toast.success("Reporte enviado. Gracias por avisar.");
        setForm(EMPTY);
        setSent(true);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  if (sent) {
    return <ReportSent onReset={() => setSent(false)} />;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
            <LifeBuoyIcon className="size-5" />
          </div>
          <div>
            <CardTitle>Enviar reporte</CardTitle>
            <p className="text-muted-foreground text-sm">
              Cuéntanos qué pasó para revisarlo de forma privada.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block text-xs">Título</Label>
              <Input
                value={form.title}
                onChange={(event) => set("title", event.target.value)}
                placeholder="Ej. Necesito reportar un problema con mi perfil"
                maxLength={140}
                required
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Tipo de reporte</Label>
              <NativeSelect
                className="w-full"
                value={form.category}
                onChange={(event) => set("category", event.target.value)}
              >
                {REPORT_CATEGORIES.map((category) => (
                  <NativeSelectOption key={category} value={category}>
                    {REPORT_CATEGORY_LABEL[category]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">
                Ruta relacionada (opcional)
              </Label>
              <Input
                value={form.relatedPath}
                onChange={(event) => set("relatedPath", event.target.value)}
                placeholder="/players/3, /ideas..."
                maxLength={240}
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block text-xs">Descripción</Label>
              <Textarea
                value={form.description}
                onChange={(event) => set("description", event.target.value)}
                placeholder="Describe con el mayor contexto posible. Si es algo sensible, evita compartir datos innecesarios."
                rows={5}
                required
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">
                Tu nombre (opcional)
              </Label>
              <Input
                value={form.reporterName}
                onChange={(event) => set("reporterName", event.target.value)}
                placeholder="Puedes dejarlo anónimo"
                maxLength={80}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">
                Contacto (opcional)
              </Label>
              <Input
                value={form.contact}
                onChange={(event) => set("contact", event.target.value)}
                placeholder="WhatsApp, correo o usuario"
                maxLength={160}
              />
            </div>
          </div>

          <div className="bg-muted/40 text-muted-foreground rounded-lg border p-3 text-xs leading-relaxed">
            Al enviar, guardaremos información técnica básica del navegador y
            request, como idioma, pantalla, plataforma, user agent, IP y
            ubicación aproximada si el proveedor la informa. Esto ayuda a
            investigar errores, abuso o solicitudes sensibles.
          </div>

          <Button type="submit" disabled={pending} className="w-full sm:w-fit">
            <SendIcon />
            {pending ? "Enviando..." : "Enviar reporte"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ReportSent({ onReset }: { onReset: () => void }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2Icon className="size-6" />
        </div>
        <div className="max-w-md">
          <h2 className="text-xl font-semibold tracking-tight">
            Reporte enviado
          </h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Revisaremos tu solicitud lo antes posible. Gracias por ayudarnos a
            corregir errores, cuidar la privacidad y mejorar la experiencia de
            la reta.
          </p>
        </div>
        <Button variant="secondary" onClick={onReset}>
          Enviar otro reporte
        </Button>
      </CardContent>
    </Card>
  );
}

function collectClientInfo() {
  const uaData = (
    navigator as unknown as { userAgentData?: { platform?: string } }
  ).userAgentData;

  return {
    language: navigator.language,
    languages: navigator.languages?.join(","),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    screen:
      typeof screen !== "undefined"
        ? `${screen.width}x${screen.height}`
        : undefined,
    viewport:
      typeof window !== "undefined"
        ? `${window.innerWidth}x${window.innerHeight}`
        : undefined,
    pixelRatio:
      typeof window !== "undefined"
        ? String(window.devicePixelRatio)
        : undefined,
    platform: uaData?.platform ?? navigator.platform,
    userAgent: navigator.userAgent,
  };
}
