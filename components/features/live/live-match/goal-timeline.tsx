"use client";

import { Button } from "@/components/ui/button";
import { TEAM_COLORS, type TeamKey } from "@/lib/teams";
import { cn } from "@/lib/utils";
import { MinusIcon, UserIcon, XIcon } from "lucide-react";
import type { LiveSide } from "./live-scoreboard";
import type { LiveGoal } from "./types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function GoalTimeline({
  goals,
  home,
  away,
  getPlayerName,
  formatMinute,
  formatClock,
  onAssign,
  onRemove,
  onRemoveLast,
}: {
  goals: LiveGoal[];
  home: LiveSide;
  away: LiveSide;
  getPlayerName: (id: number | null) => string;
  formatMinute: (at: number) => string;
  formatClock: (at: number) => string;
  onAssign: (id: string) => void;
  onRemove: (id: string) => void;
  onRemoveLast: (team: TeamKey) => void;
}) {
  const scoreHome = goals.filter((goal) => goal.team === home.key).length;
  const scoreAway = goals.filter((goal) => goal.team === away.key).length;
  const sideOf = (key: TeamKey) => (key === home.key ? home : away);

  return (
    <div className="space-y-3">
      <div className="border-foreground/10 bg-card/80 flex flex-col gap-3 rounded-2xl border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-muted-foreground text-sm font-semibold tracking-[0.14em] uppercase">
            Registro de goles
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {goals.length === 0
              ? "Aún no hay goles registrados."
              : `${goals.length} gol${goals.length === 1 ? "" : "es"} capturado${goals.length === 1 ? "" : "s"} durante el partido.`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => onRemoveLast(home.key)}
            disabled={scoreHome === 0}
          >
            <MinusIcon />
            Último de {home.name}
          </Button>
          <Button
            variant="outline"
            onClick={() => onRemoveLast(away.key)}
            disabled={scoreAway === 0}
          >
            <MinusIcon />
            Último de {away.name}
          </Button>
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="border-foreground/12 bg-card/60 text-muted-foreground rounded-2xl border border-dashed px-6 py-10 text-center text-sm">
          Toca &quot;Agregar gol&quot; para empezar a llenar la línea del
          partido.
        </div>
      ) : (
        <ul className="border-foreground/10 bg-card/90 overflow-hidden rounded-2xl border shadow-sm">
          {[...goals].reverse().map((goal) => (
            <li
              key={goal.id}
              className="border-foreground/8 flex items-center gap-3 border-b px-4 py-3 last:border-b-0"
            >
              <span
                className="inline-flex min-w-10 justify-center rounded-md px-2 py-1 text-[10px] font-bold tracking-wide text-white uppercase"
                style={{ backgroundColor: TEAM_COLORS[goal.team] }}
              >
                {sideOf(goal.team).name}
              </span>

              <div className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        onClick={() => onAssign(goal.id)}
                        variant={"secondary"}
                      ></Button>
                    }
                  >
                    <UserIcon className="text-muted-foreground size-3.5 shrink-0" />
                    <span
                      className={cn(
                        "truncate text-sm",
                        goal.playerId == null && "text-muted-foreground",
                      )}
                    >
                      {getPlayerName(goal.playerId)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Asigna el gol a un jugador</TooltipContent>
                </Tooltip>
              </div>

              <span className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
                {formatMinute(goal.at)} · {formatClock(goal.at)}
              </span>

              <Button
                variant="secondary"
                size="icon"
                onClick={() => onRemove(goal.id)}
                aria-label="Eliminar gol"
              >
                <XIcon />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
