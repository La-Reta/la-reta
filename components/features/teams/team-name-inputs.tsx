"use client";

import { Input } from "@/components/ui/input";

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
    <div className="bg-card ring-foreground/10 grid gap-3 rounded-lg p-3 ring-1 sm:grid-cols-2">
      <label className="space-y-1">
        <span className="text-muted-foreground text-xs font-medium">
          Nombre Equipo A
        </span>
        <Input
          value={nameA}
          onChange={(e) => onNameAChange(e.target.value)}
          placeholder="Equipo A"
          maxLength={24}
        />
      </label>
      <label className="space-y-1">
        <span className="text-muted-foreground text-xs font-medium">
          Nombre Equipo B
        </span>
        <Input
          value={nameB}
          onChange={(e) => onNameBChange(e.target.value)}
          placeholder="Equipo B"
          maxLength={24}
        />
      </label>
    </div>
  );
}
