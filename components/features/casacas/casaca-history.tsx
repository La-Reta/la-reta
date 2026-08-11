"use client";

import { deleteCasacaAssignment } from "@/app/actions/casacas";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { initials } from "@/lib/format";
import type { CasacaAssignmentRow } from "@/lib/queries";
import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

export function CasacaHistory({
  assignments,
  admin = false,
}: {
  assignments: CasacaAssignmentRow[];
  /** Solo el admin puede borrar un turno (no apareció, no aceptó, …). */
  admin?: boolean;
}) {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Historial</CardTitle>
        <CardDescription>
          Últimos turnos de lavado.
          {admin
            ? " Puedes borrar un turno si esa persona no apareció o no aceptó."
            : null}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aún nadie ha lavado. Gira la ruleta.
          </p>
        ) : (
          <ol className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
            {assignments.map((a, i) => (
              <li key={a.id} className="flex items-center gap-3">
                <Avatar>
                  {a.photoUrl ? <AvatarImage src={a.photoUrl} alt="" /> : null}
                  <AvatarFallback>{initials(a.displayName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    <span className="truncate">{a.displayName}</span>
                    {a.isGuest ? (
                      <Badge variant="outline" className="shrink-0">
                        Invitado
                      </Badge>
                    ) : null}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {new Date(a.createdAt).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                    })}
                    {a.spunByName ? ` · por ${a.spunByName}` : null}
                  </p>
                </div>
                {i === 0 ? <Badge>Último</Badge> : null}
                {admin ? <DeleteTurnButton assignment={a} /> : null}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Borra un turno del historial. Al quitarlo, esa persona vuelve al sorteo (la
 * ruleta solo excluye a los dos turnos más recientes que queden).
 */
function DeleteTurnButton({ assignment }: { assignment: CasacaAssignmentRow }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  return (
    <Button
      variant="destructive"
      size="icon-sm"
      className="shrink-0"
      aria-label={`Eliminar el turno de ${assignment.displayName}`}
      disabled={pending}
      onClick={() => {
        if (
          !confirm(
            `¿Eliminar el turno de ${assignment.displayName}? Volverá a entrar al sorteo.`,
          )
        )
          return;
        startTransition(async () => {
          const res = await deleteCasacaAssignment(assignment.id);
          if (res.ok) {
            toast.success("Turno eliminado");
            router.refresh();
          } else {
            toast.error(res.error);
          }
        });
      }}
    >
      <Trash2Icon />
    </Button>
  );
}
