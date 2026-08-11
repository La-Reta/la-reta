"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Item, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
import { MAX_TEAMS } from "@/lib/teams";
import { cn } from "@/lib/utils";
import {
  ChartNoAxesColumnIcon,
  ListChecksIcon,
  RadioIcon,
  ShuffleIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import { SelectedCountItem } from "./selected-count-item";

export type MatchupView = "board" | "list";

export function ControlBar({
  selectedCount,
  allSelected,
  hasSelection,
  hasResult,
  teamCount,
  maxTeams,
  onTeamCountChange,
  onToggleAll,
  onClear,
  onGenerate,
  generateDisabled,
  onGoLive,
  onRegistro,
}: {
  selectedCount: number;
  allSelected: boolean;
  hasSelection: boolean;
  hasResult: boolean;
  teamCount: number;
  /** Tope real: no puede haber más equipos que convocados. */
  maxTeams: number;
  onTeamCountChange: (count: number) => void;
  onToggleAll: () => void;
  onClear: () => void;
  onGenerate: () => void;
  generateDisabled: boolean;
  onGoLive: () => void;
  onRegistro: () => void;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Info: convocados + acceso al registro */}
        <div className="flex items-center justify-between gap-2 sm:justify-start sm:gap-3">
          <SelectedCountItem count={selectedCount} />
          <Button variant="default" onClick={onRegistro}>
            <ChartNoAxesColumnIcon />
            Registros
          </Button>
        </div>

        {/* Acciones: selección · vista · matchup */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <TeamCountPicker
            value={teamCount}
            max={maxTeams}
            onChange={onTeamCountChange}
          />
          <Button variant="outline" onClick={onToggleAll}>
            <ListChecksIcon />
            {allSelected ? "Quitar todos" : "Todos"}
          </Button>
          {hasSelection && (
            <Button variant="outline" onClick={onClear}>
              <XIcon />
              Limpiar
            </Button>
          )}

          {/* Primary CTA (+ live) — full-width row on mobile, inline on desktop */}
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              className="flex-1 sm:flex-none"
              onClick={onGenerate}
              disabled={generateDisabled}
            >
              <ShuffleIcon />
              {hasResult ? "Regenerar" : "Generar equipos"}
            </Button>
            {hasResult && (
              <Button
                variant="destructive"
                className="flex-1 sm:flex-none"
                onClick={onGoLive}
              >
                <RadioIcon />
                Ir al live
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Cuántos equipos generar. 2 es el default de siempre; 3+ arma una reta con
 * rotación (gana y se queda) que el live entiende.
 */
function TeamCountPicker({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (count: number) => void;
}) {
  const options = Array.from(
    { length: Math.max(2, Math.min(MAX_TEAMS, max)) - 1 },
    (_, i) => i + 2,
  );
  if (options.length < 2) return null;

  return (
    <div
      className="bg-muted inline-flex items-center gap-1 rounded-xl p-0.5"
      role="group"
      aria-label="Número de equipos"
    >
      <UsersIcon className="text-muted-foreground ml-1.5 size-3.5" />
      {options.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-pressed={value === n}
          className={cn(
            "rounded-[10px] px-2.5 py-1 font-mono text-xs font-bold tabular-nums transition-colors",
            value === n
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
