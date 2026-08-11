"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultTeamName, TEAM_COLORS, teamKeys } from "@/lib/teams";

/**
 * Un input por equipo. Nombres opcionales — se reflejan en tablero, lista y
 * live, y se guardan en localStorage (atoms) para la próxima vez.
 */
export function TeamNameInputs({
  count,
  names,
  onChange,
}: {
  count: number;
  /** Indexado como TEAM_KEYS: [0] = A, [1] = B, … */
  names: string[];
  onChange: (index: number, value: string) => void;
}) {
  const keys = teamKeys(count);
  return (
    <Card size="sm">
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {keys.map((key, i) => (
          <div key={key} className="space-y-1.5">
            <Label
              htmlFor={`team-name-${key}`}
              className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium"
            >
              <span
                aria-hidden="true"
                className="size-2 rounded-full"
                style={{ backgroundColor: TEAM_COLORS[key] }}
              />
              Nombre {defaultTeamName(key)}
            </Label>
            <Input
              id={`team-name-${key}`}
              value={names[i] ?? ""}
              onChange={(e) => onChange(i, e.target.value)}
              placeholder={defaultTeamName(key)}
              maxLength={24}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
