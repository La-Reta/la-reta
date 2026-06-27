"use client";

import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

export function LiveScoreboard({
  teamA,
  teamB,
  scoreA,
  scoreB,
  elapsedSec,
  scorersA,
  scorersB,
}: {
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  elapsedSec: number;
  scorersA: string[];
  scorersB: string[];
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] bg-neutral-950 text-white shadow-lg ring-1 ring-white/10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.03),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-sky-500/16 via-sky-500/5 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-rose-500/16 via-rose-500/5 to-transparent" />

      <div className="relative flex flex-col items-center gap-1 border-b border-white/8 px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-red-500" />
          </span>
          <span className="text-xs font-semibold tracking-[0.24em] text-red-400 uppercase">
            En vivo
          </span>
        </div>
        <span className="font-mono text-2xl font-bold text-white/92 tabular-nums">
          {formatDuration(elapsedSec)}
        </span>
      </div>

      <div
        className="relative grid grid-cols-[1fr_auto_1fr] items-start gap-3 px-4 py-5 sm:px-5"
        role="status"
        aria-live="polite"
        aria-label={`${teamA} ${scoreA}, ${teamB} ${scoreB}`}
      >
        <TeamSide
          team={teamA}
          accent="bg-sky-400"
          text="text-sky-300"
          scorers={scorersA}
        />

        <p className="px-1 font-mono text-5xl leading-none font-black tabular-nums sm:text-6xl">
          {scoreA}
          <span className="mx-1 text-white/28">:</span>
          {scoreB}
        </p>

        <TeamSide
          team={teamB}
          accent="bg-rose-400"
          text="text-rose-300"
          scorers={scorersB}
        />
      </div>
    </div>
  );
}

function TeamSide({
  team,
  scorers,
  accent,
  text,
}: {
  team: string;
  scorers: string[];
  accent: string;
  text: string;
}) {
  return (
    <div className="min-w-0 text-center">
      <p
        className={cn(
          "truncate text-sm font-bold tracking-wide uppercase",
          text,
        )}
      >
        {team}
      </p>
      <span
        className={cn("mx-auto mt-1 block h-0.5 w-8 rounded-full", accent)}
      />
      {scorers.length > 0 ? (
        <p className="mt-1.5 line-clamp-2 text-[10px] leading-snug text-white/58">
          {scorers.join(", ")}
        </p>
      ) : (
        <p className="mt-1.5 line-clamp-2 text-[10px] leading-snug text-white/36">
          Sin goleadores registrados
        </p>
      )}
    </div>
  );
}
