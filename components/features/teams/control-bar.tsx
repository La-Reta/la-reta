"use client";

import { Button } from "@/components/ui/button";
import { ViewTab } from "@/components/features/teams/view-tab";
import {
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
}) {
  return (
    <div className="bg-card ring-foreground/10 flex flex-wrap items-center justify-between gap-3 rounded-lg p-3 ring-1">
      <div className="flex items-center gap-2 text-sm">
        <UsersIcon className="text-muted-foreground size-4" />
        <span className="font-mono text-lg font-bold tabular-nums">
          {selectedCount}
        </span>
        <span className="text-muted-foreground">convocados</span>
      </div>
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

        <Button onClick={onGenerate} disabled={generateDisabled}>
          <ShuffleIcon />
          {hasResult ? "Regenerar" : "Generar equipos"}
        </Button>

        {hasResult && (
          <Button variant="outline" onClick={onGoLive}>
            <RadioIcon />
            Ir al live
          </Button>
        )}
      </div>
    </div>
  );
}
