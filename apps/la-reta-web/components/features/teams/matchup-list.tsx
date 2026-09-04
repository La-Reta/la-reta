"use client";

import { positionGroup, type PositionGroup } from "@/lib/constants";
import type { TeamSplit } from "@/lib/team-balancer";
import { TEAM_COLORS_LIGHT, teamName, type TeamKey } from "@/lib/teams";
import { cn } from "@/lib/utils";
import * as React from "react";

const ORDER: PositionGroup[] = ["GK", "DEF", "MID", "FWD"];
const LINE_LABEL: Record<PositionGroup, string> = {
  GK: "Portero",
  DEF: "Defensa",
  MID: "Medio",
  FWD: "Ataque",
};
const listColor = (key: string) =>
  TEAM_COLORS_LIGHT[key as TeamKey] ?? TEAM_COLORS_LIGHT.A;

// Clases estáticas (Tailwind no genera nada interpolado en runtime).
const GRID_COLS: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
  5: "sm:grid-cols-3 lg:grid-cols-5",
  6: "sm:grid-cols-3 lg:grid-cols-6",
};

function byLine(lineups: TeamSplit["lineups"]) {
  return ORDER.map((g) => ({
    group: g,
    items: lineups.filter((l) => positionGroup(l.role) === g),
  })).filter((x) => x.items.length > 0);
}

function PlayerRow({
  lineup,
  align,
  color,
}: {
  lineup: TeamSplit["lineups"][number];
  align: "left" | "right";
  color: string;
}) {
  const { player, role } = lineup;
  // Los badges se pegan al divisor central: a la derecha si la columna alinea
  // a la derecha, a la izquierda si no.
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        align === "right" ? "flex-row-reverse text-right" : "text-left",
      )}
    >
      <span
        className="grid h-5 min-w-7 shrink-0 place-items-center rounded px-1 text-[10px] font-bold tracking-wide text-white"
        style={{ backgroundColor: color }}
      >
        {role}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold tracking-wide text-white uppercase">
        {player.displayName}
      </span>
      <span className="w-6 shrink-0 text-center font-mono text-xs font-bold text-white/55 tabular-nums">
        {player.overall}
      </span>
    </div>
  );
}

function TeamColumn({
  team,
  name,
  align,
  /** Con 3+ equipos cada columna lleva su propio encabezado. */
  withHeader,
}: {
  team: TeamSplit;
  name: string;
  align: "left" | "right";
  withHeader: boolean;
}) {
  const color = listColor(team.key);
  return (
    <div className="space-y-3.5">
      {withHeader ? (
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span
            className="font-display min-w-0 flex-1 truncate text-sm font-black uppercase"
            style={{ color }}
          >
            {name}
          </span>
          <span className="font-mono text-[10px] font-semibold text-white/35 tabular-nums">
            OVR {team.rating}
          </span>
        </div>
      ) : null}
      {byLine(team.lineups).map(({ group, items }) => (
        <div key={group} className="space-y-1.5">
          {/* Line label divider, so it's clear where each player lines up. */}
          <div
            className={cn(
              "flex items-center gap-2",
              align === "right" && "flex-row-reverse",
            )}
          >
            <span className="text-[9px] font-bold tracking-[0.18em] text-white/45 uppercase">
              {LINE_LABEL[group]}
            </span>
            <span className="h-px flex-1 bg-white/[0.06]" />
          </div>
          {items.map((l) => (
            <PlayerRow
              key={l.player.id}
              lineup={l}
              align={align}
              color={color}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export const MatchupList = React.forwardRef<
  HTMLDivElement,
  { teams: TeamSplit[]; names: string[] }
>(function MatchupList({ teams, names }, ref) {
  const isDuel = teams.length === 2;
  const label = (i: number) => teamName(names, teams[i].key);

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-xl p-5 text-white sm:p-7"
      style={{
        background:
          "linear-gradient(160deg,#11337a 0%,#0c1f4a 48%,#0a1330 100%)",
      }}
    >
      {/* Chalk pitch markings, faint behind the lineup. */}
      <svg
        viewBox="0 0 1600 1000"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.10]"
        aria-hidden="true"
      >
        <g fill="none" stroke="white" strokeWidth={3}>
          <rect x={20} y={20} width={1560} height={960} />
          <line x1={800} y1={20} x2={800} y2={980} />
          <circle cx={800} cy={500} r={150} />
          <circle cx={800} cy={500} r={6} fill="white" stroke="none" />
          <rect x={20} y={300} width={200} height={400} />
          <rect x={1380} y={300} width={200} height={400} />
        </g>
      </svg>

      <div className="relative">
        {/* Minimal Mexican tricolor emblem */}
        <div className="mx-auto mb-2 flex h-1.5 w-12 overflow-hidden rounded-full ring-1 ring-white/10">
          <span className="flex-1 bg-[#006847]" />
          <span className="flex-1 bg-white" />
          <span className="flex-1 bg-[#ce1126]" />
        </div>

        {/* MATCH DAY banner */}
        <div className="flex items-center justify-center gap-1.5">
          <span className="font-display text-2xl font-black tracking-tight">
            MATCH
          </span>
          <span className="font-display rounded bg-[#006847] px-1.5 text-2xl font-black tracking-tight text-white">
            DAY
          </span>
        </div>
        <p className="font-display text-center text-[11px] font-semibold tracking-[0.3em] text-white/55 uppercase">
          La Reta · Convocatoria
        </p>

        {isDuel ? (
          // Duelo clásico: nombres enfrentados con el VS al centro.
          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="min-w-0 text-right">
              <p
                className="font-display truncate text-xl leading-tight font-black"
                style={{ color: listColor(teams[0].key) }}
              >
                {label(0)}
              </p>
              <p className="font-mono text-[10px] font-semibold tracking-wide text-white/35 tabular-nums">
                OVR {teams[0].rating}
              </p>
            </div>
            <span className="font-display rounded-md border border-white/25 px-3 py-1 text-sm font-black tracking-widest text-white/80">
              VS
            </span>
            <div className="min-w-0 text-left">
              <p
                className="font-display truncate text-xl leading-tight font-black"
                style={{ color: listColor(teams[1].key) }}
              >
                {label(1)}
              </p>
              <p className="font-mono text-[10px] font-semibold tracking-wide text-white/35 tabular-nums">
                OVR {teams[1].rating}
              </p>
            </div>
          </div>
        ) : (
          <p className="font-display mt-3 text-center text-[11px] font-bold tracking-[0.2em] text-white/60 uppercase">
            {teams.length} equipos · rotación
          </p>
        )}

        {isDuel ? (
          <div className="mt-6 grid grid-cols-[1fr_1px_1fr] gap-x-4">
            <TeamColumn
              team={teams[0]}
              name={label(0)}
              align="right"
              withHeader={false}
            />
            <div className="bg-white/[0.08]" />
            <TeamColumn
              team={teams[1]}
              name={label(1)}
              align="left"
              withHeader={false}
            />
          </div>
        ) : (
          <div
            className={cn(
              "mt-6 grid grid-cols-1 gap-x-5 gap-y-7",
              GRID_COLS[teams.length] ?? "sm:grid-cols-2",
            )}
          >
            {teams.map((team, i) => (
              <TeamColumn
                key={team.key}
                team={team}
                name={label(i)}
                align="left"
                withHeader
              />
            ))}
          </div>
        )}

        <p className="font-display mt-6 text-center text-[10px] tracking-[0.25em] text-white/35 uppercase">
          reta fútbol
        </p>
      </div>
    </div>
  );
});
