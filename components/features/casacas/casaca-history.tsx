"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { initials } from "@/lib/format";
import type { CasacaAssignmentRow } from "@/lib/queries";

export function CasacaHistory({
  assignments,
}: {
  assignments: CasacaAssignmentRow[];
}) {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Historial</CardTitle>
        <CardDescription>Últimos turnos de lavado.</CardDescription>
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
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
