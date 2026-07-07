"use client";

import { ViewTab } from "@/components/features/teams/view-tab";
import { Button } from "@/components/ui/button";
import {
  ChartNoAxesColumnIcon,
  LayoutGridIcon,
  ListChecksIcon,
  ListIcon,
  RadioIcon,
  ShuffleIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";

export type MatchupView = "board" | "list";

export function ControlBar({
  selectedCount,
  allSelected,
  hasSelection,
  hasResult,
  view,
  onViewChange,
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
  view: MatchupView;
  onViewChange: (view: MatchupView) => void;
  onToggleAll: () => void;
  onClear: () => void;
  onGenerate: () => void;
  generateDisabled: boolean;
  onGoLive: () => void;
  onRegistro: () => void;
}) {
  return (
    <div className="bg-card ring-foreground/10 flex flex-col gap-3 rounded-lg p-3 ring-1 sm:flex-row sm:items-center sm:justify-between">
      {/* Info: convocados + acceso al registro */}
      <div className="flex items-center justify-between gap-2 sm:justify-start sm:gap-3">
        <div className="flex items-center gap-2.5">
          <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-md">
            <UsersIcon className="size-4.5" />
          </span>
          <div className="leading-none">
            <p className="font-mono text-xl font-bold tabular-nums">
              {selectedCount}
            </p>
            <p className="text-muted-foreground text-[11px]">convocados</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRegistro}
          className="text-muted-foreground"
        >
          <ChartNoAxesColumnIcon />
          Registros
        </Button>
      </div>

      {/* Acciones: selección · vista · matchup */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onToggleAll}>
          <ListChecksIcon />
          {allSelected ? "Quitar todos" : "Todos"}
        </Button>
        {hasSelection && (
          <Button variant="outline" size="sm" onClick={onClear}>
            <XIcon />
            Limpiar
          </Button>
        )}

        {/* View switch: changes presentation of the SAME teams, no reshuffle. */}
        {hasResult && (
          <div
            className="bg-muted inline-flex rounded-md p-0.5"
            role="group"
            aria-label="Vista"
          >
            <ViewTab
              active={view === "board"}
              onClick={() => onViewChange("board")}
              icon={<LayoutGridIcon className="size-3.5" />}
              label="Tablero"
            />
            <ViewTab
              active={view === "list"}
              onClick={() => onViewChange("list")}
              icon={<ListIcon className="size-3.5" />}
              label="Lista"
            />
          </div>
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
              variant="secondary"
              className="flex-1 sm:flex-none"
              onClick={onGoLive}
            >
              <RadioIcon />
              Ir al live
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
