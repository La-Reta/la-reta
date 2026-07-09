"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GROUP_COLOR,
  GROUP_LABEL,
  positionGroup,
  type PositionGroup,
} from "@/lib/constants";
import type { Player } from "@/lib/db/schema";
import { flagEmoji, playerPositions } from "@/lib/format";
import { isGuest } from "@/lib/guests";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";
import * as React from "react";
import { SelectedCountItem } from "./selected-count-item";

const GROUPS: PositionGroup[] = ["GK", "DEF", "MID", "FWD"];

export function Convocatoria({
  players,
  selected,
  onToggle,
  selectedCount,
}: {
  players: Player[];
  selected: number[];
  onToggle: (id: number) => void;
  selectedCount: number;
}) {
  const selectedSet = React.useMemo(() => new Set(selected), [selected]);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center justify-between">
          <span>Convocatoria</span>
          <div className="flex flex-wrap-reverse items-center justify-end gap-2">
            <Badge variant={"outline"}>Toca para convocar</Badge>
            <SelectedCountItem count={selectedCount} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {GROUPS.map((g) => {
          const groupPlayers = players.filter(
            (p) => positionGroup(p.position) === g,
          );
          if (groupPlayers.length === 0) return null;
          const picked = groupPlayers.filter((p) =>
            selectedSet.has(p.id),
          ).length;
          return (
            <div key={g} className="space-y-2">
              <p className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold uppercase">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: GROUP_COLOR[g] }}
                />
                {GROUP_LABEL[g]}
                <span className="text-muted-foreground/60">
                  · {picked}/{groupPlayers.length}
                </span>
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {groupPlayers.map((p) => {
                  const isSel = selectedSet.has(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onToggle(p.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-md border px-2.5 py-2 text-left text-xs transition-colors",
                        isSel
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-muted",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-sm border",
                          isSel
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/40",
                        )}
                      >
                        {isSel && <CheckIcon className="size-3.5" />}
                      </span>
                      <span className="w-9 shrink-0 font-mono font-bold tabular-nums">
                        {p.overall}
                      </span>
                      <span className="truncate font-medium">{p.name}</span>
                      {isGuest(p) ? (
                        <Badge variant="secondary" className="shrink-0">
                          invitado
                        </Badge>
                      ) : null}
                      <span className="ml-auto shrink-0">
                        {flagEmoji(p.nationality)}
                      </span>
                      <Badge variant="outline" className="shrink-0">
                        {playerPositions(p).join("/")}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
