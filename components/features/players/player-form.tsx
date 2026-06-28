"use client";

import {
  createPlayer,
  updatePlayer,
  type PlayerInput,
} from "@/app/actions/players";
import { FifaCard } from "@/components/shared/fifa-card";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Slider } from "@/components/ui/slider";
import {
  FEET,
  GROUP_LABEL,
  POSITIONS,
  STAT_KEYS,
  STAT_LABEL,
  positionGroup,
  type StatKey,
} from "@/lib/constants";
import type { Player } from "@/lib/db/schema";
import { computeOverall } from "@/lib/ratings";
import { InfoIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

const FOOT_LABEL: Record<string, string> = {
  left: "Izquierdo",
  right: "Derecho",
};

type FormState = {
  name: string;
  displayName: string;
  position: string;
  position2: string;
  preferredFoot: string;
  nationality: string;
  photoUrl: string;
  age: string;
  heightCm: string;
  weightKg: string;
} & Record<StatKey, number>;

function parseNumberInput(value: string) {
  if (!value.trim()) return Number.NaN;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function initialState(player?: Player): FormState {
  return {
    name: player?.name ?? "",
    displayName: player?.displayName ?? "",
    position: player?.position ?? "ST",
    position2: player?.position2 ?? "",
    preferredFoot: player?.preferredFoot ?? "right",
    nationality: player?.nationality ?? "mx",
    photoUrl: player?.photoUrl ?? "",
    age: String(player?.age ?? 25),
    heightCm: String(player?.heightCm ?? 175),
    weightKg: String(player?.weightKg ?? 75),
    pace: player?.pace ?? 38,
    shooting: player?.shooting ?? 38,
    passing: player?.passing ?? 38,
    dribbling: player?.dribbling ?? 38,
    defending: player?.defending ?? 38,
    physical: player?.physical ?? 38,
  };
}

export function PlayerForm({
  player,
  admin,
}: {
  player?: Player;
  admin: boolean;
}) {
  const router = useRouter();
  const isEdit = Boolean(player);
  const [form, setForm] = React.useState<FormState>(() => initialState(player));
  const [pending, startTransition] = React.useTransition();

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const stats = {
    pace: form.pace,
    shooting: form.shooting,
    passing: form.passing,
    dribbling: form.dribbling,
    defending: form.defending,
    physical: form.physical,
  };
  const overall = computeOverall(form.position as Player["position"], stats);
  const age = parseNumberInput(form.age);
  const heightCm = parseNumberInput(form.heightCm);
  const weightKg = parseNumberInput(form.weightKg);

  const preview: Player = {
    id: player?.id ?? 0,
    displayName: (form.displayName || form.name || "JUGADOR").toUpperCase(),
    name: form.name,
    position: form.position as Player["position"],
    position2:
      form.position2 && form.position2 !== form.position
        ? (form.position2 as Player["position"])
        : null,
    preferredFoot: form.preferredFoot as Player["preferredFoot"],
    nationality: form.nationality,
    photoUrl: form.photoUrl || null,
    age: Number.isFinite(age) ? age : (player?.age ?? 25),
    heightCm: Number.isFinite(heightCm) ? heightCm : (player?.heightCm ?? 175),
    weightKg: Number.isFinite(weightKg) ? weightKg : (player?.weightKg ?? 75),
    ...stats,
    overall,
    createdAt: player?.createdAt ?? new Date(),
    updatedAt: player?.updatedAt ?? new Date(),
  };

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio.");
      return;
    }
    startTransition(async () => {
      const input: PlayerInput = {
        ...form,
        age,
        heightCm,
        weightKg,
      };
      const res = isEdit
        ? await updatePlayer(player!.id, input)
        : await createPlayer(input);
      if (res.ok) {
        toast.success(isEdit ? "Jugador actualizado" : "Jugador creado");
        router.push(`/players/${res.id}`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start"
    >
      <div className="space-y-6">
        <FormSection title="Identidad">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nombre completo">
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Erling Haaland"
                required
              />
            </FormField>
            <FormField label="Nombre en carta">
              <Input
                value={form.displayName}
                onChange={(e) => set("displayName", e.target.value)}
                placeholder="HAALAND"
              />
            </FormField>
            <FormField label="Posición principal">
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
            </FormField>
            <FormField label="Posición secundaria (opcional)">
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
            </FormField>
            <FormField label="Pie preferido">
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
            </FormField>
            <FormField label="País (código ISO, 2 letras)">
              <Input
                value={form.nationality}
                onChange={(e) => set("nationality", e.target.value)}
                placeholder="mx"
                maxLength={2}
              />
            </FormField>
            <FormField label="URL de foto (opcional)" className="sm:col-span-2">
              <Input
                value={form.photoUrl}
                onChange={(e) => set("photoUrl", e.target.value)}
                placeholder="https://..."
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Perfil físico">
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Edad">
              <Input
                type="number"
                value={form.age}
                onChange={(e) => set("age", e.target.value)}
              />
            </FormField>
            <FormField label="Altura (cm)">
              <Input
                type="number"
                value={form.heightCm}
                onChange={(e) => set("heightCm", e.target.value)}
              />
            </FormField>
            <FormField label="Peso (kg)">
              <Input
                type="number"
                value={form.weightKg}
                onChange={(e) => set("weightKg", e.target.value)}
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Atributos">
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {STAT_KEYS.map((key) => (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{STAT_LABEL[key]}</span>
                  <span className="font-mono font-bold tabular-nums">
                    {form[key]}
                  </span>
                </div>
                <Slider
                  min={1}
                  max={99}
                  value={form[key]}
                  onValueChange={(v) =>
                    set(key, Array.isArray(v) ? v[0] : (v as number))
                  }
                />
              </div>
            ))}
          </div>
        </FormSection>

        <div className="flex items-center justify-between gap-2">
          {admin ? (
            <>
              <Button
                type="button"
                variant="destructive"
                onClick={() => router.back()}
                disabled={pending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending
                  ? "Guardando…"
                  : isEdit
                    ? "Guardar cambios"
                    : "Crear jugador"}
              </Button>
            </>
          ) : (
            <Alert variant={"default"}>
              <InfoIcon />
              <AlertTitle>Acceso de administrador</AlertTitle>
              <AlertDescription>
                Para crear un jugador debes ser administrador
              </AlertDescription>
              <AlertAction>
                <Button render={<Link href={"/admin"} />}>
                  Acceder a Admin
                </Button>
              </AlertAction>
            </Alert>
          )}
        </div>
      </div>

      {/* Preview en vivo */}
      <div className="lg:sticky lg:top-16">
        <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
          Vista previa · OVR {overall}
        </p>
        <div className="mx-auto max-w-[240px]">
          <FifaCard player={preview} />
        </div>
      </div>
    </form>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card size="sm">
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function FormField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Field className={className}>
      <FieldLabel className="text-xs">{label}</FieldLabel>
      {children}
    </Field>
  );
}
