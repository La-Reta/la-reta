"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  defaultTeamName,
  MAX_TEAMS,
  TEAM_COLORS,
  teamKeys,
  type TeamKey,
} from "@/lib/teams";
import { cn } from "@/lib/utils";
import {
  ArrowRightLeftIcon,
  PlayIcon,
  RadioIcon,
  UsersIcon,
} from "lucide-react";

/**
 * Pre-partido: cuántos equipos hay y cómo se llaman. Con 2 es el duelo de
 * siempre; con 3+ arranca la rotación (juegan los dos primeros, el resto espera).
 */
export function StartMatchForm({
  count,
  names,
  onCountChange,
  onNameChange,
  onSwapTeams,
  onStart,
}: {
  count: number;
  /** Indexado como TEAM_KEYS: [0] = A, [1] = B, … */
  names: string[];
  onCountChange: (count: number) => void;
  onNameChange: (index: number, value: string) => void;
  /** Intercambia los dos primeros equipos (quién arranca de local). */
  onSwapTeams: () => void;
  onStart: () => void;
}) {
  const keys = teamKeys(count);
  return (
    <div className="mx-auto max-w-3xl">
      <Card className="ring-foreground/10 overflow-hidden border-none bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_34%),linear-gradient(180deg,var(--color-card),color-mix(in_oklab,var(--color-card)_88%,var(--color-muted)))] shadow-sm ring-1">
        <CardHeader className="border-foreground/8 border-b">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.16em] uppercase">
              <RadioIcon className="size-3.5" />
              Pre-partido
            </span>
          </div>
          <CardTitle className="text-xl sm:text-2xl">
            Configura el marcador antes de arrancar
          </CardTitle>
          <CardDescription className="max-w-2xl text-sm leading-relaxed">
            Define cuántos equipos hay y cómo se llaman. Con 3 o más, el que
            gana se queda y entra el siguiente de la fila.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pt-6">
          <div className="flex items-center justify-center gap-2">
            <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium">
              <UsersIcon className="size-3.5" />
              Equipos
            </span>
            <div className="bg-muted inline-flex rounded-xl p-0.5">
              {Array.from({ length: MAX_TEAMS - 1 }, (_, i) => i + 2).map(
                (n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onCountChange(n)}
                    aria-pressed={count === n}
                    className={cn(
                      "rounded-[10px] px-3 py-1 font-mono text-xs font-bold tabular-nums transition-colors",
                      count === n
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {n}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {keys.map((key, i) => (
              <TeamInput
                key={key}
                teamKey={key}
                value={names[i] ?? ""}
                onChange={(v) => onNameChange(i, v)}
              />
            ))}
          </div>

          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={onSwapTeams}
              aria-label="Intercambiar los dos primeros equipos"
            >
              <ArrowRightLeftIcon className="size-4" />
              Intercambiar {defaultTeamName(keys[0])} y{" "}
              {defaultTeamName(keys[1])}
            </Button>
          </div>

          <Button
            size="lg"
            className="mx-auto flex w-full max-w-xl"
            onClick={onStart}
          >
            <PlayIcon />
            Iniciar partido en vivo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function TeamInput({
  teamKey,
  value,
  onChange,
}: {
  teamKey: TeamKey;
  value: string;
  onChange: (value: string) => void;
}) {
  const color = TEAM_COLORS[teamKey];
  return (
    <div
      className="rounded-xl border p-1"
      style={{ borderColor: `${color}33`, backgroundColor: `${color}0f` }}
    >
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={defaultTeamName(teamKey)}
        aria-label={defaultTeamName(teamKey)}
        className="bg-background/80 placeholder:text-muted-foreground/80 h-11 border-0 shadow-none"
      />
    </div>
  );
}
