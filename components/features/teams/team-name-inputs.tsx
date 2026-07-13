"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TeamNameInputs({
  nameA,
  nameB,
  onNameAChange,
  onNameBChange,
}: {
  nameA: string;
  nameB: string;
  onNameAChange: (value: string) => void;
  onNameBChange: (value: string) => void;
}) {
  return (
    // Nombres opcionales — se reflejan en tablero y lista, y se guardan en
    // localStorage (atoms) para la próxima vez.
    <Card size="sm">
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label
            htmlFor="team-name-a"
            className="text-muted-foreground text-xs font-medium"
          >
            Nombre Equipo A
          </Label>
          <Input
            id="team-name-a"
            value={nameA}
            onChange={(e) => onNameAChange(e.target.value)}
            placeholder="Equipo A"
            maxLength={24}
          />
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="team-name-b"
            className="text-muted-foreground text-xs font-medium"
          >
            Nombre Equipo B
          </Label>
          <Input
            id="team-name-b"
            value={nameB}
            onChange={(e) => onNameBChange(e.target.value)}
            placeholder="Equipo B"
            maxLength={24}
          />
        </div>
      </CardContent>
    </Card>
  );
}
