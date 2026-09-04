"use client";

import { POSITION_COORDS, POSITION_NAME, type Position } from "@/lib/constants";
import { flagEmoji } from "@/lib/format";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type MiniPlayer = {
  id: number;
  name: string;
  overall: number;
  nationality: string;
};

/**
 * Transparent hover hotspots aligned to each pitch marker. On hover they show a
 * tooltip listing the players who cover that position. Rendered as an overlay so
 * the shared <Pitch> SVG stays untouched.
 */
export function PositionHotspots({
  byPosition,
}: {
  byPosition: Partial<Record<Position, MiniPlayer[]>>;
}) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {(Object.keys(POSITION_COORDS) as Position[]).map((pos) => {
        const list = byPosition[pos];
        if (!list || list.length === 0) return null;
        const { x, y } = POSITION_COORDS[pos];
        return (
          <Tooltip key={pos}>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  aria-label={`${POSITION_NAME[pos]}: ${list.length} jugador${list.length === 1 ? "" : "es"}`}
                  className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    width: "10%",
                    height: "14%",
                  }}
                />
              }
            />
            <TooltipContent className="min-w-44">
              <p className="font-semibold">
                {POSITION_NAME[pos]} · {pos}
              </p>
              <ul className="mt-1 space-y-0.5">
                {list.map((p) => (
                  <li key={p.id} className="flex items-center gap-1.5">
                    <span>{flagEmoji(p.nationality)}</span>
                    <span className="truncate">{p.name}</span>
                    <span className="ml-auto font-mono font-bold tabular-nums">
                      {p.overall}
                    </span>
                  </li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
