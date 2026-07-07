"use client";

import { positionGroup, type PositionGroup } from "@/lib/constants";
import type { Lineup } from "@/lib/team-balancer";
import { cn } from "@/lib/utils";
import { StarIcon } from "lucide-react";
import * as React from "react";

const ORDER: PositionGroup[] = ["GK", "DEF", "MID", "FWD"];
const LINE_LABEL: Record<PositionGroup, string> = {
  GK: "Portero",
  DEF: "Defensa",
  MID: "Medio",
  FWD: "Ataque",
};
const TEAM_A = "#38bdf8"; // sky-400
const TEAM_B = "#fb7185"; // rose-400

function byLine(lineups: Lineup[]) {
  return ORDER.map((g) => ({
    group: g,
    items: lineups.filter((l) => positionGroup(l.role) === g),
  })).filter((x) => x.items.length > 0);
}

function PlayerRow({
  lineup,
  side,
  color,
}: {
  lineup: Lineup;
  side: "A" | "B";
  color: string;
}) {
  const { player, role } = lineup;
  // Badges hug the center divider: A puts it on the right, B on the left.
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        side === "A" ? "flex-row-reverse text-right" : "text-left",
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

function TeamColumn({ lineups, side }: { lineups: Lineup[]; side: "A" | "B" }) {
  const color = side === "A" ? TEAM_A : TEAM_B;
  return (
    <div className="space-y-3.5">
      {byLine(lineups).map(({ group, items }) => (
        <div key={group} className="space-y-1.5">
          {/* Line label divider, so it's clear where each player lines up. */}
          <div
            className={cn(
              "flex items-center gap-2",
              side === "A" && "flex-row-reverse",
            )}
          >
            <span className="text-[9px] font-bold tracking-[0.18em] text-white/45 uppercase">
              {LINE_LABEL[group]}
            </span>
            <span className="h-px flex-1 bg-white/[0.06]" />
          </div>
          {items.map((l) => (
            <PlayerRow key={l.player.id} lineup={l} side={side} color={color} />
          ))}
        </div>
      ))}
    </div>
  );
}

function Crest({
  letter,
  color,
  count,
}: {
  letter: string;
  color: string;
  count: number;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <StarIcon
            key={i}
            className="size-2.5 fill-amber-400 text-amber-400"
          />
        ))}
      </div>
      <div
        className="font-display grid size-14 place-items-center rounded-full border-2 text-2xl font-black"
        style={{
          borderColor: color,
          color,
          background: "rgba(255,255,255,0.06)",
        }}
      >
        {letter}
      </div>
      <p className="text-[10px] font-medium text-white/45">
        {count} convocados
      </p>
    </div>
  );
}

export const MatchupList = React.forwardRef<
  HTMLDivElement,
  {
    teamA: Lineup[];
    teamB: Lineup[];
    ratingA: number;
    ratingB: number;
    nameA?: string;
    nameB?: string;
  }
>(function MatchupList({ teamA, teamB, ratingA, ratingB, nameA, nameB }, ref) {
  const teamAName = nameA?.trim() || "Equipo A";
  const teamBName = nameB?.trim() || "Equipo B";
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

        {/* Crests + team names (rating de-emphasized) */}
        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex items-center justify-end gap-3">
            <div className="min-w-0 text-right">
              <p
                className="font-display truncate text-xl leading-tight font-black"
                style={{ color: TEAM_A }}
              >
                {teamAName}
              </p>
              <p className="font-mono text-[10px] font-semibold tracking-wide text-white/35 tabular-nums">
                OVR {ratingA}
              </p>
            </div>
            <Crest letter="A" color={TEAM_A} count={teamA.length} />
          </div>
          <span className="font-display rounded-md border border-white/25 px-3 py-1 text-sm font-black tracking-widest text-white/80">
            VS
          </span>
          <div className="flex items-center gap-3">
            <Crest letter="B" color={TEAM_B} count={teamB.length} />
            <div className="min-w-0 text-left">
              <p
                className="font-display truncate text-xl leading-tight font-black"
                style={{ color: TEAM_B }}
              >
                {teamBName}
              </p>
              <p className="font-mono text-[10px] font-semibold tracking-wide text-white/35 tabular-nums">
                OVR {ratingB}
              </p>
            </div>
          </div>
        </div>

        {/* Two-column lineup with a center divider */}
        <div className="mt-6 grid grid-cols-[1fr_1px_1fr] gap-x-4">
          <TeamColumn lineups={teamA} side="A" />
          <div className="bg-white/[0.08]" />
          <TeamColumn lineups={teamB} side="B" />
        </div>

        <p className="font-display mt-6 text-center text-[10px] tracking-[0.25em] text-white/35 uppercase">
          reta fútbol
        </p>
      </div>
    </div>
  );
});
