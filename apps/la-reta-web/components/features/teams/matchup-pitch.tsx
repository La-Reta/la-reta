"use client";

import * as React from "react";
import { positionGroup, type PositionGroup } from "@/lib/constants";
import { TEAM_COLORS_LIGHT } from "@/lib/teams";
import { initials } from "@/lib/format";
import { isGuest } from "@/lib/guests";
import type { Lineup } from "@/lib/team-balancer";
import { cn } from "@/lib/utils";

// x% of the pitch per line, for each side (B mirrored toward the right goal).
const BANDS_A: Record<PositionGroup, number> = {
  GK: 8,
  DEF: 21,
  MID: 33,
  FWD: 45,
};
const BANDS_B: Record<PositionGroup, number> = {
  GK: 92,
  DEF: 79,
  MID: 67,
  FWD: 55,
};
const ORDER: PositionGroup[] = ["GK", "DEF", "MID", "FWD"];

type Placed = { lineup: Lineup; x: number; y: number };

function place(lineups: Lineup[], side: "A" | "B"): Placed[] {
  const bands = side === "A" ? BANDS_A : BANDS_B;
  const groups: Record<PositionGroup, Lineup[]> = {
    GK: [],
    DEF: [],
    MID: [],
    FWD: [],
  };
  for (const l of lineups) groups[positionGroup(l.role)].push(l);

  const placed: Placed[] = [];
  for (const g of ORDER) {
    const arr = groups[g];
    const n = arr.length;
    // Center small lines and only spread toward the touchlines as a line grows,
    // so a 2- or 3-man line reads as a tidy row instead of hugging the edges.
    const span = Math.min(72, 26 + 14 * (n - 2));
    arr.forEach((lineup, i) => {
      const y = n === 1 ? 50 : 50 - span / 2 + (i * span) / (n - 1);
      placed.push({ lineup, x: bands[g], y });
    });
  }
  return placed;
}

function Token({
  p,
  x,
  y,
  color,
  onSwap,
}: {
  p: Placed;
  x: number;
  y: number;
  color: string;
  onSwap?: (fromId: number, toId: number) => void;
}) {
  const player = p.lineup.player;
  const draggable = Boolean(onSwap);
  const [over, setOver] = React.useState(false);
  return (
    <div
      className={cn(
        "absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1",
        draggable && "cursor-grab active:cursor-grabbing",
      )}
      style={{ left: `${x}%`, top: `${y}%` }}
      draggable={draggable}
      onDragStart={
        draggable
          ? (e) => {
              e.dataTransfer.setData("text/plain", String(player.id));
              e.dataTransfer.effectAllowed = "move";
            }
          : undefined
      }
      onDragOver={
        draggable
          ? (e) => {
              e.preventDefault();
              setOver(true);
            }
          : undefined
      }
      onDragLeave={draggable ? () => setOver(false) : undefined}
      onDrop={
        draggable
          ? (e) => {
              e.preventDefault();
              setOver(false);
              const fromId = Number(e.dataTransfer.getData("text/plain"));
              if (fromId && fromId !== player.id) onSwap!(fromId, player.id);
            }
          : undefined
      }
    >
      <div className="relative">
        <div
          className={cn(
            "size-11 overflow-hidden rounded-full border-2 bg-neutral-900 transition-shadow",
            over && "ring-2 ring-white ring-offset-1 ring-offset-black/40",
          )}
          style={{ borderColor: color }}
        >
          {player.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={player.photoUrl}
              alt=""
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
              {initials(player.name)}
            </span>
          )}
        </div>
        <span
          className="absolute -right-1 -bottom-1 grid min-w-5 place-items-center rounded-full px-1 font-mono text-[9px] font-bold text-white ring-2 ring-black/30"
          style={{ backgroundColor: color }}
        >
          {player.overall}
        </span>
      </div>
      <span
        className={cn(
          "rounded bg-black/55 px-1 text-[10px] leading-tight font-semibold text-white uppercase",
          // Guests keep their full name (no short apodo) so two "hermano de …"
          // stay distinct: wrap to 2 lines instead of truncating it away.
          isGuest(player)
            ? "line-clamp-2 max-w-24 text-center break-words"
            : "max-w-20 truncate",
        )}
      >
        {player.displayName}
      </span>
    </div>
  );
}

export const MatchupPitch = React.forwardRef<
  HTMLDivElement,
  {
    teamA: Lineup[];
    teamB: Lineup[];
    ratingA: number;
    ratingB: number;
    nameA?: string;
    nameB?: string;
    /** Colores del par que se está mostrando (varían con 3+ equipos). */
    colorA?: string;
    colorB?: string;
    /** When set, tokens become draggable and dropping one on another swaps them. */
    onSwap?: (fromId: number, toId: number) => void;
  }
>(function MatchupPitch(
  {
    teamA,
    teamB,
    ratingA,
    ratingB,
    nameA,
    nameB,
    colorA = TEAM_COLORS_LIGHT.A,
    colorB = TEAM_COLORS_LIGHT.B,
    onSwap,
  },
  ref,
) {
  const a = place(teamA, "A");
  const b = place(teamB, "B");
  const teamAName = nameA?.trim() || "Equipo A";
  const teamBName = nameB?.trim() || "Equipo B";

  return (
    <div
      ref={ref}
      className="relative aspect-[16/10] w-full overflow-hidden rounded-xl text-white"
      style={{
        background:
          "linear-gradient(160deg,#11337a 0%,#0c1f4a 48%,#0a1330 100%)",
      }}
    >
      {/* Chalk markings */}
      <svg
        viewBox="0 0 1600 1000"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full opacity-35"
        aria-hidden="true"
      >
        <g fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2}>
          <rect x={20} y={20} width={1560} height={960} />
          <line x1={800} y1={20} x2={800} y2={980} />
          <circle cx={800} cy={500} r={120} />
          <rect x={20} y={310} width={180} height={380} />
          <rect x={1400} y={310} width={180} height={380} />
        </g>
      </svg>

      {/* Header */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-black/25 px-4 py-2.5">
        <div className="min-w-0 text-left leading-none">
          <p
            className="font-display truncate text-2xl font-black tracking-tight uppercase"
            style={{ color: colorA }}
          >
            {teamAName}
          </p>
          <p className="font-mono text-[11px] font-semibold tracking-[0.18em] text-white/70 tabular-nums">
            {ratingA}
          </p>
        </div>
        <p className="font-display shrink-0 text-sm font-bold tracking-[0.25em] text-white/70 uppercase">
          La Reta · VS
        </p>
        <div className="min-w-0 text-right leading-none">
          <p
            className="font-display truncate text-2xl font-black tracking-tight uppercase"
            style={{ color: colorB }}
          >
            {teamBName}
          </p>
          <p className="font-mono text-[11px] font-semibold tracking-[0.18em] text-white/70 tabular-nums">
            {ratingB}
          </p>
        </div>
      </div>

      {/* Players */}
      {a.map((p) => (
        <Token
          key={p.lineup.player.id}
          p={p}
          x={p.x}
          y={p.y}
          color={colorA}
          onSwap={onSwap}
        />
      ))}
      {b.map((p) => (
        <Token
          key={p.lineup.player.id}
          p={p}
          x={p.x}
          y={p.y}
          color={colorB}
          onSwap={onSwap}
        />
      ))}

      <span className="font-display absolute right-3 bottom-1.5 text-[10px] tracking-wider text-white/40 uppercase">
        reta fútbol
      </span>
    </div>
  );
});
