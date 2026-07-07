"use client";

import { createPlayerSignup } from "@/app/actions/player-signups";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { FEET, GROUP_LABEL, POSITIONS, positionGroup } from "@/lib/constants";
import {
  CheckCircle2Icon,
  ChevronLeftIcon,
  SendIcon,
  UserRoundPlusIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

const FOOT_LABEL: Record<string, string> = {
  left: "Izquierdo",
  right: "Derecho",
  both: "Ambos",
};

const EMPTY = {
  name: "",
  displayName: "",
  position: "ST",
  position2: "",
  preferredFoot: "right",
  nationality: "mx",
  photoUrl: "",
  birthDate: "",
  heightCm: "",
  weightKg: "",
  contact: "",
  note: "",
};

export function PlayerSignupForm() {
  const router = useRouter();
  const [form, setForm] = React.useState(EMPTY);
  const [sent, setSent] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Escribe tu nombre.");
      return;
    }
    startTransition(async () => {
      const res = await createPlayerSignup({
        ...form,
        client: collectClientInfo(),
      });
      if (res.ok) {
        toast.success("¡Solicitud enviada! Te avisaremos.");
        setForm(EMPTY);
        setSent(true);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  if (sent) return <SignupSent onReset={() => setSent(false)} />;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
            <UserRoundPlusIcon className="size-5" />
          </div>
          <div>
            <CardTitle>Regístrate como jugador</CardTitle>
            <p className="text-muted-foreground text-sm">
              Deja tus datos y un admin te dará de alta en la plantilla.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <SignupField label="Nombre completo" className="sm:col-span-2">
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Erling Haaland"
                maxLength={120}
                required
              />
            </SignupField>
            <SignupField label="¿Cómo te dicen? (opcional)">
              <Input
                value={form.displayName}
                onChange={(e) => set("displayName", e.target.value)}
                placeholder="HAALAND"
                maxLength={60}
              />
            </SignupField>
            <SignupField label="País (código ISO, 2 letras)">
              <Input
                value={form.nationality}
                onChange={(e) => set("nationality", e.target.value)}
                placeholder="mx"
                maxLength={2}
              />
            </SignupField>
            <SignupField label="Posición principal">
              <NativeSelect
                className="w-full"
                value={form.position}
                onChange={(e) => set("position", e.target.value)}
              >
                {POSITIONS.map((p) => (
                  <NativeSelectOption key={p} value={p}>
                    {p} · {GROUP_LABEL[positionGroup(p)]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </SignupField>
            <SignupField label="Posición secundaria (opcional)">
              <NativeSelect
                className="w-full"
                value={form.position2}
                onChange={(e) => set("position2", e.target.value)}
              >
                <NativeSelectOption value="">— ninguna —</NativeSelectOption>
                {POSITIONS.filter((p) => p !== form.position).map((p) => (
                  <NativeSelectOption key={p} value={p}>
                    {p} · {GROUP_LABEL[positionGroup(p)]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </SignupField>
            <SignupField label="Pie preferido">
              <NativeSelect
                className="w-full"
                value={form.preferredFoot}
                onChange={(e) => set("preferredFoot", e.target.value)}
              >
                {FEET.map((f) => (
                  <NativeSelectOption key={f} value={f}>
                    {FOOT_LABEL[f]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </SignupField>
            <SignupField label="Fecha de nacimiento (opcional)">
              <Input
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={form.birthDate}
                onChange={(e) => set("birthDate", e.target.value)}
              />
            </SignupField>
            <SignupField label="Altura cm (opcional)">
              <Input
                type="number"
                value={form.heightCm}
                onChange={(e) => set("heightCm", e.target.value)}
                placeholder="175"
              />
            </SignupField>
            <SignupField label="Peso kg (opcional)">
              <Input
                type="number"
                value={form.weightKg}
                onChange={(e) => set("weightKg", e.target.value)}
                placeholder="75"
              />
            </SignupField>
            <SignupField label="Contacto (opcional)" className="sm:col-span-2">
              <Input
                value={form.contact}
                onChange={(e) => set("contact", e.target.value)}
                placeholder="WhatsApp, correo o @usuario"
                maxLength={160}
              />
            </SignupField>
            <SignupField label="Algo más (opcional)" className="sm:col-span-2">
              <Textarea
                value={form.note}
                onChange={(e) => set("note", e.target.value)}
                placeholder="Cuéntanos tu estilo de juego, disponibilidad, etc."
                rows={3}
              />
            </SignupField>
          </div>

          <div className="bg-muted/40 text-muted-foreground rounded-lg border p-3 text-xs leading-relaxed">
            Al enviar guardamos información técnica básica del navegador para
            evitar abuso. Un administrador definirá tus atributos al darte de
            alta.
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              render={<Link href="/players" />}
            >
              <ChevronLeftIcon />
              Volver a jugadores
            </Button>
            <Button type="submit" disabled={pending} className="sm:w-fit">
              <SendIcon />
              {pending ? "Enviando…" : "Enviar solicitud"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SignupField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Field className={className}>
      <FieldLabel className="text-xs">{label}</FieldLabel>
      {children}
    </Field>
  );
}

function SignupSent({ onReset }: { onReset: () => void }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2Icon className="size-6" />
        </div>
        <div className="max-w-md">
          <h2 className="text-xl font-semibold tracking-tight">
            Solicitud enviada
          </h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Un administrador la revisará y te dará de alta en la plantilla con
            tus atributos. ¡Nos vemos en la cancha!
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="secondary" onClick={onReset}>
            Enviar otra
          </Button>
          <Button variant="outline" render={<Link href="/players" />}>
            Ver jugadores
          </Button>
        </div>
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
