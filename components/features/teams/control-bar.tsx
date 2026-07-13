"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Item, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
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
