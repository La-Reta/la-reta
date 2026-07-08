"use client";

import { deleteSignup, updateSignupStatus } from "@/app/actions/player-signups";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  GROUP_LABEL,
  SIGNUP_STATUSES,
  SIGNUP_STATUS_CLASS,
  SIGNUP_STATUS_LABEL,
  positionGroup,
} from "@/lib/constants";
import { ageFromBirthDate, formatCompactDate } from "@/lib/dates";
import type { PlayerSignup } from "@/lib/db/schema";
import { flagEmoji, playerPositions } from "@/lib/format";
import { cn } from "@/lib/utils";
import { GlobeIcon, Trash2Icon, UserRoundPlusIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

export function AdminSignups({ signups }: { signups: PlayerSignup[] }) {
  if (signups.length === 0) {
    return (
      <p className="bg-card text-muted-foreground ring-foreground/10 rounded-lg p-8 text-center text-sm ring-1">
        Todavía no hay solicitudes para unirse.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {signups.map((signup) => (
        <SignupCard key={signup.id} signup={signup} />
      ))}
    </div>
  );
}

function SignupCard({ signup }: { signup: PlayerSignup }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const positions = playerPositions(signup);
  const age = signup.birthDate ? ageFromBirthDate(signup.birthDate) : null;

  function changeStatus(status: string) {
    startTransition(async () => {
      const res = await updateSignupStatus(signup.id, status);
      if (res.ok) {
        toast.success("Estado actualizado");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function remove() {
    if (!confirm(`¿Eliminar la solicitud de ${signup.name}?`)) return;
    startTransition(async () => {
      const res = await deleteSignup(signup.id);
      if (res.ok) {
        toast.success("Solicitud eliminada");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Card size="sm" className="flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold">{signup.name}</p>
            {signup.displayName ? (
              <p className="text-muted-foreground truncate text-xs">
                “{signup.displayName}”
              </p>
            ) : null}
          </div>
          <span
            className={cn(
              "shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-medium",
              SIGNUP_STATUS_CLASS[signup.status],
            )}
          >
            {SIGNUP_STATUS_LABEL[signup.status]}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-lg leading-none">
            {flagEmoji(signup.nationality)}
          </span>
          {positions.map((p) => (
            <Badge key={p} variant="outline">
              {p} · {GROUP_LABEL[positionGroup(p)]}
            </Badge>
          ))}
        </div>

        <dl className="text-muted-foreground grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          <Info label="Edad" value={age ? `${age} años` : "—"} />
          <Info label="Pie" value={FOOT_LABEL[signup.preferredFoot]} />
          <Info
            label="Altura"
            value={signup.heightCm ? `${signup.heightCm} cm` : "—"}
          />
          <Info
            label="Peso"
            value={signup.weightKg ? `${signup.weightKg} kg` : "—"}
          />
          <Info label="Contacto" value={signup.contact ?? "—"} full />
        </dl>

        {signup.note ? (
          <p className="bg-muted/40 text-muted-foreground rounded-md border p-2 text-xs leading-relaxed">
            {signup.note}
          </p>
        ) : null}

        {/* Contexto de cliente, compacto */}
        <p className="text-muted-foreground/80 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px]">
          <GlobeIcon className="size-3" />
          {[
            signup.country?.toUpperCase(),
            signup.city,
            signup.platform,
            signup.ipAddress,
          ]
            .filter(Boolean)
            .join(" · ") || "sin datos de cliente"}
          <span className="ml-auto">{formatCompactDate(signup.createdAt)}</span>
        </p>

        {/* Acciones */}
        <div className="mt-auto flex items-center gap-2 pt-1">
          <Button
            className="flex-1"
            disabled={pending}
            render={<Link href={`/players/new?signup=${signup.id}`} />}
          >
            <UserRoundPlusIcon />
            Registrar
          </Button>
          <NativeSelect
            aria-label="Estado"
            className="h-9 w-auto text-xs"
            value={signup.status}
            disabled={pending}
            onChange={(e) => changeStatus(e.target.value)}
          >
            {SIGNUP_STATUSES.map((status) => (
              <NativeSelectOption key={status} value={status}>
                {SIGNUP_STATUS_LABEL[status]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive shrink-0"
            disabled={pending}
            onClick={remove}
            aria-label="Eliminar solicitud"
          >
            <Trash2Icon />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const FOOT_LABEL: Record<string, string> = {
  left: "Izquierdo",
  right: "Derecho",
  both: "Ambos",
};

function Info({
  label,
  value,
  full,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={cn("min-w-0", full && "col-span-2")}>
      <dt className="text-[10px] uppercase">{label}</dt>
      <dd className="text-foreground truncate font-medium">{value}</dd>
    </div>
  );
}
