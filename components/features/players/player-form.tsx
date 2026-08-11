"use client";

import {
  createPlayer,
  updatePlayer,
  updatePlayerInfo,
  type PlayerInput,
} from "@/app/actions/players";
import { uploadImage } from "@/app/actions/uploads";
import { CountrySelect } from "@/components/features/players/country-select";
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
  POSITION_NAME,
  POSITIONS,
  STAT_KEYS,
  STAT_LABEL,
  type StatKey,
} from "@/lib/constants";
import { ageFromBirthDate } from "@/lib/dates";
import type { Player } from "@/lib/db/schema";
import { computeOverall } from "@/lib/ratings";
import { SignInButton } from "@clerk/nextjs";
import { ChevronLeftIcon, InfoIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

const FOOT_LABEL: Record<string, string> = {
  left: "Izquierdo",
  right: "Derecho",
  both: "Ambos",
};

type FormState = {
  name: string;
  displayName: string;
  position: string;
  position2: string;
  preferredFoot: string;
  nationality: string;
  photoUrl: string;
  birthDate: string;
  heightCm: string;
  weightKg: string;
} & Record<StatKey, number>;

/** Identity/physical fields that can be prefilled on a new player (e.g. from a signup). */
export type PlayerFormPrefill = Partial<FormState>;

function parseNumberInput(value: string) {
  if (!value.trim()) return Number.NaN;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function initialState(
  player?: Player,
  prefill?: Partial<FormState>,
): FormState {
  const base: FormState = {
    name: player?.name ?? "",
    displayName: player?.displayName ?? "",
    position: player?.position ?? "ST",
    position2: player?.position2 ?? "",
    preferredFoot: player?.preferredFoot ?? "right",
    nationality: player?.nationality ?? "mx",
    photoUrl: player?.photoUrl ?? "",
    // Prefer the stored birth date; for legacy players without one, approximate
    // from the stored age so the field and preview stay populated.
    birthDate:
      player?.birthDate ??
      (player ? `${new Date().getFullYear() - player.age}-01-01` : ""),
    heightCm: String(player?.heightCm ?? 175),
    weightKg: String(player?.weightKg ?? 75),
    pace: player?.pace ?? 38,
    shooting: player?.shooting ?? 38,
    passing: player?.passing ?? 38,
    dribbling: player?.dribbling ?? 38,
    defending: player?.defending ?? 38,
    physical: player?.physical ?? 38,
  };
  // Prefill only applies to new players (from a signup request), never on edit.
  return player ? base : { ...base, ...prefill };
}

export function PlayerForm({
  player,
  canManage,
  canEditStats = true,
  prefill,
  signupId,
}: {
  player?: Player;
  canManage: boolean;
  // false → edición info-only del dueño (oculta y no guarda atributos).
  canEditStats?: boolean;
  prefill?: Partial<FormState>;
  // Cuando el alta viene de una solicitud, la marcamos como registrada al crear.
  signupId?: number;
}) {
  const router = useRouter();
  const isEdit = Boolean(player);
  const [form, setForm] = React.useState<FormState>(() =>
    initialState(player, prefill),
  );
  const [pending, startTransition] = React.useTransition();
  const [uploading, setUploading] = React.useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite re-subir el mismo archivo
    if (!file) return;
    setUploading(true);
    const data = new FormData();
    data.set("file", file);
    const res = await uploadImage(data);
    setUploading(false);
    if (res.ok) {
      set("photoUrl", res.url);
      toast.success("Imagen subida");
    } else {
      toast.error(res.error);
    }
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
  const age = ageFromBirthDate(form.birthDate);
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
    birthDate: form.birthDate || null,
    age: Number.isFinite(age) ? age : (player?.age ?? 25),
    heightCm: Number.isFinite(heightCm) ? heightCm : (player?.heightCm ?? 175),
    weightKg: Number.isFinite(weightKg) ? weightKg : (player?.weightKg ?? 75),
    ...stats,
    overall,
    createdById: player?.createdById ?? null,
    createdByName: player?.createdByName ?? null,
    clerkUserId: player?.clerkUserId ?? null,
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
        ? canEditStats
          ? await updatePlayer(player!.id, input)
          : await updatePlayerInfo(player!.id, input)
        : await createPlayer(input, signupId);
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
                    {p} · {POSITION_NAME[p]}
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
                    {p} · {POSITION_NAME[p]}
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
            <FormField label="País">
              <CountrySelect
                value={form.nationality}
                onChange={(code) => set("nationality", code)}
              />
            </FormField>
            <FormField label="Foto (opcional)" className="sm:col-span-2">
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={onPickPhoto}
                  disabled={uploading}
                />
                <Input
                  value={form.photoUrl}
                  onChange={(e) => set("photoUrl", e.target.value)}
                  placeholder={
                    uploading ? "Subiendo…" : "…o pega una URL: https://..."
                  }
                  disabled={uploading}
                />
              </div>
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Perfil físico">
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              label={
                Number.isFinite(age)
                  ? `Fecha de nacimiento · ${age} años`
                  : "Fecha de nacimiento"
              }
            >
              <Input
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={form.birthDate}
                onChange={(e) => set("birthDate", e.target.value)}
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

        {canEditStats ? (
          <FormSection title="Atributos">
            <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {STAT_KEYS.map((key) => (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{STAT_LABEL[key]}</span>
                    <Input
                      type="number"
                      min={1}
                      max={99}
                      value={form[key]}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (Number.isNaN(n)) return;
                        set(key, Math.max(1, Math.min(99, n)));
                      }}
                      className="h-7 w-16 font-mono font-bold tabular-nums"
                    />
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
        ) : (
          <p className="text-muted-foreground rounded-lg border border-dashed p-3 text-xs">
            Los atributos (PAC, SHO, PAS…) los ajusta el staff. Aquí puedes
            editar tu información: nombre, posición, foto y datos físicos.
          </p>
        )}

        <div className="flex items-center justify-between gap-2">
          {canManage ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={pending}
              >
                <ChevronLeftIcon />
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
              <AlertTitle>Necesitas una sesión</AlertTitle>
              <AlertDescription>
                Inicia sesión o entra como administrador para{" "}
                {isEdit ? "editar" : "crear"} jugadores.
              </AlertDescription>
              <AlertAction className="flex gap-2">
                <SignInButton mode="modal">
                  <Button variant="outline">Iniciar sesión</Button>
                </SignInButton>
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
