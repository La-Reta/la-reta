"use client";

import {
  createPlayer,
  updatePlayer,
  updatePlayerInfo,
  type PlayerInput,
} from "@/app/actions/players";
import { CountrySelect } from "@/components/features/players/country-select";
import { PlayerPhotoField } from "@/components/features/players/player-photo-field";
import { PlayerPreviewCard } from "@/components/features/players/player-preview-card";
import { PositionSelect } from "@/components/features/players/position-select";
import type { PhotoUpload } from "@/lib/upload-photo";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group";
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
import { FEET, STAT_KEYS, STAT_LABEL, type StatKey } from "@/lib/constants";
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
  prefill?: Partial<FormState>
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

const subscribeNever = () => () => {
  // "Hoy" no cambia dentro de una sesión de formulario: no hay a qué suscribirse.
};
const readToday = () => new Date().toISOString().slice(0, 10);
const readNothing = () => undefined;

export const PlayerForm = ({
  player,
  canManage,
  canEditStats = true,
  prefill,
  signupId,
}: {
  readonly player?: Player;
  readonly canManage: boolean;
  // false → edición info-only del dueño (oculta y no guarda atributos).
  readonly canEditStats?: boolean;
  readonly prefill?: Partial<FormState>;
  // Cuando el alta viene de una solicitud, la marcamos como registrada al crear.
  readonly signupId?: number;
}) => {
  const router = useRouter();
  const isEdit = Boolean(player);
  const [form, setForm] = React.useState<FormState>(() =>
    initialState(player, prefill)
  );
  const [pending, startTransition] = React.useTransition();
  // La subida vive aquí y no dentro del campo de foto: quien la enseña es la
  // carta de la derecha. El campo la empieza, la carta la pinta.
  const [photoUpload, setPhotoUpload] = React.useState<PhotoUpload | null>(
    null
  );

  // El tope del campo de fecha es "hoy", y hoy solo lo sabe el navegador: el
  // servidor puede estar en otra zona horaria o servir HTML de ayer, y esa
  // diferencia rompe la hidratación. `useSyncExternalStore` y no un efecto
  // porque el efecto corre DESPUÉS del primer pintado: se vería un instante sin
  // tope. El servidor no da ninguno, que es más honesto que dar uno equivocado.
  // El snapshot devuelve la misma cadena toda la jornada, así que React no
  // entra en bucle (compara por valor).
  const today = React.useSyncExternalStore(
    subscribeNever,
    readToday,
    readNothing
  );

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
      className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start"
      onSubmit={onSubmit}
    >
      <StaggerGroup className="space-y-6">
        <StaggerItem>
          <IdentitySection
            disabled={pending}
            form={form}
            onPhotoUpload={setPhotoUpload}
            photoUpload={photoUpload}
            set={set}
            signupPhotoUrl={prefill?.photoUrl}
          />
        </StaggerItem>
        <StaggerItem>
          <PhysicalSection age={age} form={form} set={set} today={today} />
        </StaggerItem>
        <StaggerItem>
          {canEditStats ? (
            <AttributesSection form={form} set={set} />
          ) : (
            <StaffOnlyNote />
          )}
        </StaggerItem>
        <StaggerItem>
          <FormActions
            canManage={canManage}
            isEdit={isEdit}
            onCancel={() => router.back()}
            pending={pending}
          />
        </StaggerItem>
      </StaggerGroup>
      <PlayerPreviewCard player={preview} upload={photoUpload} />
    </form>
  );
};

type SetField = <K extends keyof FormState>(
  key: K,
  value: FormState[K]
) => void;

/**
 * Las secciones viven fuera de `PlayerForm` a propósito: el formulario entero
 * pasaba de 300 líneas y decidía qué pintar a partir de dos banderas
 * (`canEditStats`, `canManage`), que es justo lo que hace imposible mirar un
 * trozo sin cargar el resto en la cabeza. `form` y `set` bajan como props: el
 * estado sigue siendo uno solo, arriba.
 */
const IdentitySection = ({
  form,
  set,
  disabled,
  photoUpload,
  onPhotoUpload,
  signupPhotoUrl,
}: {
  readonly form: FormState;
  readonly set: SetField;
  readonly disabled: boolean;
  readonly photoUpload: PhotoUpload | null;
  readonly onPhotoUpload: (upload: PhotoUpload | null) => void;
  /** La foto que traía la solicitud, cuando el alta viene de una. */
  readonly signupPhotoUrl?: string;
}) => {
  return (
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
          <PositionSelect
            onChange={(next) => set("position", next)}
            value={form.position}
          />
        </FormField>
        <FormField label="Posición secundaria (opcional)">
          <PositionSelect
            exclude={form.position}
            onChange={(next) => set("position2", next)}
            placeholder="Ninguna"
            value={form.position2}
          />
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
          <PlayerPhotoField
            disabled={disabled}
            onChange={(url) => set("photoUrl", url)}
            onUploadChange={onPhotoUpload}
            signupPhotoUrl={signupPhotoUrl}
            upload={photoUpload}
            value={form.photoUrl}
          />
        </FormField>
      </div>
    </FormSection>
  );
};

const PhysicalSection = ({
  form,
  set,
  age,
  today,
}: {
  readonly form: FormState;
  readonly set: SetField;
  readonly age: number;
  /** Tope del campo de fecha; `undefined` en el servidor (ver `PlayerForm`). */
  readonly today: string | undefined;
}) => {
  return (
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
            max={today}
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
  );
};

const AttributesSection = ({
  form,
  set,
}: {
  readonly form: FormState;
  readonly set: SetField;
}) => {
  return (
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
  );
};

const StaffOnlyNote = () => {
  return (
    <p className="text-muted-foreground rounded-lg border border-dashed p-3 text-xs">
      Los atributos (PAC, SHO, PAS…) los ajusta el staff. Aquí puedes editar tu
      información: nombre, posición, foto y datos físicos.
    </p>
  );
};

const FormActions = ({
  canManage,
  pending,
  isEdit,
  onCancel,
}: {
  readonly canManage: boolean;
  readonly pending: boolean;
  readonly isEdit: boolean;
  readonly onCancel: () => void;
}) => {
  return (
    <div className="flex items-center justify-between gap-2">
      {canManage ? (
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
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
        <Alert variant="default">
          <InfoIcon />
          <AlertTitle>Necesitas una sesión</AlertTitle>
          <AlertDescription>
            Inicia sesión o entra como administrador para{" "}
            {isEdit ? "editar" : "crear"} jugadores.
          </AlertDescription>
          <AlertAction>
            <SignInButton mode="modal">
              <Button variant="outline">Iniciar sesión</Button>
            </SignInButton>
            <Button render={<Link href="/admin" />}>Acceder a Admin</Button>
          </AlertAction>
        </Alert>
      )}
    </div>
  );
};

const FormSection = ({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}) => {
  return (
    <Card size="sm">
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

const FormField = ({
  label,
  children,
  className,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
  readonly className?: string;
}) => {
  return (
    <Field className={className}>
      <FieldLabel className="text-xs">{label}</FieldLabel>
      {children}
    </Field>
  );
};
