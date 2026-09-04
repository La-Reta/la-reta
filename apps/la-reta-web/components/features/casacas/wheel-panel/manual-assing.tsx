import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssignmentState } from "@/hooks/use-assignment-state";
import { CasacaWheel } from "@/hooks/use-casaca-wheel";
import { useGetMatchDaysUntil } from "@/hooks/use-get-match-days-until";
import { CasacaAssignmentRow } from "@/lib/queries";
import { HandIcon } from "lucide-react";
import React from "react";

/** Manually assign the turn to someone who volunteers, from the current pool. */
export function ManualAssign({
  wheel,
  assignments,
}: {
  wheel: Pick<CasacaWheel, "canManage" | "spinning" | "pool" | "assignManual">;
  assignments: CasacaAssignmentRow[];
}) {
  const [id, setId] = React.useState("");

  const daysUntil = useGetMatchDaysUntil();

  if (!wheel.canManage || wheel.pool.length === 0) return null;

  const { isToday, hasAlreadyAssignedToday, todaysAssignedIds, availablePool } =
    useAssignmentState({
      assignments,
      pool: wheel.pool,
      daysUntil,
    });

  const hasntSelectedValue = !id || wheel.spinning;
  const selectedPersonAlreadyAssignedToday =
    id && todaysAssignedIds.has(Number(id));

  const disabledForm = !isToday || wheel.spinning || hasAlreadyAssignedToday;
  const disabledButton = Boolean(
    hasntSelectedValue || wheel.spinning || selectedPersonAlreadyAssignedToday,
  );

  return (
    <div className="w-full border-t pt-4">
      <div className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase">
        <HandIcon className="size-3.5" />
        Asignar manualmente (voluntario)
      </div>

      {!isToday && (
        <p className="text-muted-foreground mb-3 text-sm">
          Solo disponible el día del partido ({daysUntil()} días restantes)
        </p>
      )}

      {hasAlreadyAssignedToday && isToday && (
        <p className="text-muted-foreground mb-3 text-sm">
          Ya se asignó casacas hoy. Próximo: mañana.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={id}
          onValueChange={(v) => setId(v ?? "")}
          disabled={disabledForm || availablePool.length === 0}
        >
          <SelectTrigger className="min-w-44 flex-1">
            <SelectValue
              placeholder={
                availablePool.length === 0
                  ? "Sin jugadores disponibles"
                  : "Elige jugador"
              }
            />
          </SelectTrigger>
          <SelectContent
            alignItemWithTrigger={false}
            className="w-auto min-w-52"
          >
            <SelectGroup>
              <SelectLabel>Jugadores disponibles</SelectLabel>
              {availablePool.length === 0 ? (
                <p className="text-muted-foreground px-2 py-1.5 text-sm">
                  Todos asignados hoy
                </p>
              ) : (
                availablePool.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    <Avatar>
                      <AvatarImage
                        src={p.photoUrl ?? undefined}
                        alt={p.displayName ?? ""}
                      />
                      <AvatarFallback>
                        {p.displayName?.[0] ?? ""}
                      </AvatarFallback>
                    </Avatar>
                    <p>{p.displayName}</p>
                  </SelectItem>
                ))
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button
          disabled={disabledButton}
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
