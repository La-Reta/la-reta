"use client";

import { Wheel } from "@/components/features/casacas/wheel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CasacaWheel } from "@/hooks/use-casaca-wheel";
import {
  HandIcon,
  RefreshCwIcon,
  ShirtIcon,
  UserPlusIcon,
  XIcon,
} from "lucide-react";
import * as React from "react";

/** Status line under the spin button: why you can't spin, or who's resting. */
function WheelStatus({
  wheel,
}: {
  wheel: Pick<CasacaWheel, "canManage" | "pool" | "restingPlayers">;
}) {
  if (!wheel.canManage) {
    return (
      <p className="text-muted-foreground text-center text-sm">
        Inicia sesión o entra como admin para girar.
      </p>
    );
  }
  if (wheel.pool.length < 2) {
    return (
      <p className="text-muted-foreground text-center text-sm">
        Necesitas al menos 2 jugadores.
      </p>
    );
  }
  if (wheel.restingPlayers.length > 0) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-sm">
        <span className="text-muted-foreground">Descansan:</span>
        {wheel.restingPlayers.map((p) => (
          <Badge key={p.id} variant="secondary">
            {p.displayName}
          </Badge>
        ))}
      </div>
    );
  }
  return null;
}

/** Manually assign the turn to someone who volunteers, from the current pool. */
function ManualAssign({
  wheel,
}: {
  wheel: Pick<CasacaWheel, "canManage" | "spinning" | "pool" | "assignManual">;
}) {
  const [id, setId] = React.useState("");
  if (!wheel.canManage || wheel.pool.length === 0) return null;

  const hasntSelectedValue = !id || wheel.spinning;

  return (
    <div className="w-full border-t pt-4">
      <div className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase">
        <HandIcon className="size-3.5" />
        Asignar manualmente (voluntario)
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={id} onValueChange={(v) => setId(v ?? "")}>
          <SelectTrigger className="min-w-44 flex-1">
            <SelectValue placeholder="Elige jugador" />
          </SelectTrigger>
          <SelectContent
            alignItemWithTrigger={false}
            className="w-auto min-w-52"
          >
            {wheel.pool.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={hasntSelectedValue ? "secondary" : "default"}
          disabled={hasntSelectedValue}
          onClick={() => {
            wheel.assignManual(Number(id));
            setId("");
          }}
        >
          Asignar
        </Button>
      </div>
    </div>
  );
}

export function WheelPanel({ wheel }: { wheel: CasacaWheel }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShirtIcon className="text-primary size-5" />
          Ruleta de casacas
        </CardTitle>
        <CardDescription>
          {wheel.pool.length} jugadores en juego.
          {wheel.selectedCount === 0
            ? " Mostrando todo el roster (no hay selección en Armar equipos)."
            : " Desde la selección de Armar equipos."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <Wheel
          segments={wheel.segments}
          rotation={wheel.rotation}
          spinning={wheel.spinning}
          dimIndexes={wheel.dimIndexes}
          onSpinEnd={wheel.onSpinEnd}
        />

        {/* El botón solo se muestra a admins o usuarios con sesión (Clerk).
            Sin permiso, WheelStatus explica cómo desbloquearlo. */}
        {wheel.canManage ? (
          <Button
            size="lg"
            className="w-full max-w-xs"
            disabled={!wheel.canSpin}
            onClick={wheel.spin}
          >
            <RefreshCwIcon />
            {wheel.spinning ? "Girando…" : "Girar la ruleta"}
          </Button>
        ) : null}

        <WheelStatus wheel={wheel} />

        <ManualAssign wheel={wheel} />

        {wheel.guestPlayers.length > 0 ? (
          <div className="w-full border-t pt-4">
            <div className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase">
              <UserPlusIcon className="size-3.5" />
              Invitados de última hora
            </div>
            <div className="flex flex-wrap gap-1.5">
              {wheel.guestPlayers.map((g) => (
                <span
                  key={g.id}
                  className="bg-muted flex items-center gap-1 rounded-full py-1 pr-1 pl-2.5 text-xs"
                >
                  <span className="font-medium">{g.displayName}</span>
                  {wheel.canManage ? (
                    <button
                      type="button"
                      onClick={() => wheel.removeGuest(g.id)}
                      disabled={wheel.spinning}
                      aria-label={`Quitar a ${g.displayName}`}
                      className="hover:bg-background text-muted-foreground hover:text-foreground flex size-5 items-center justify-center rounded-full transition-colors disabled:opacity-40"
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  ) : null}
                </span>
              ))}
            </div>
            {wheel.canManage ? (
              <p className="text-muted-foreground mt-2 text-[11px]">
                Se comparten con Armar equipos: al quitarlos aquí salen también
                de la reta.
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
