"use client";

import { formatDuration } from "@/lib/format";
import { TEAM_COLORS_LIGHT, type TeamKey } from "@/lib/teams";
import { cn } from "@/lib/utils";

export type LiveSide = { key: TeamKey; name: string };

export function LiveScoreboard({
  home,
  away,
  scoreHome,
  scoreAway,
  elapsedSec,
  scorersHome,
  scorersAway,
  queue,
}: {
  home: LiveSide;
  away: LiveSide;
  scoreHome: number;
  scoreAway: number;
  elapsedSec: number;
  scorersHome: string[];
  scorersAway: string[];
  /** Equipos esperando cancha (vacío en una reta de 2). */
  queue: LiveSide[];
}) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-neutral-950 text-white shadow-lg ring-1 ring-white/10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.03),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))]" />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1/2 opacity-20"
        style={{
          background: `linear-gradient(to right, ${TEAM_COLORS_LIGHT[home.key]}, transparent)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-20"
        style={{
          background: `linear-gradient(to left, ${TEAM_COLORS_LIGHT[away.key]}, transparent)`,
        }}
      />

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
        aria-label={`${home.name} ${scoreHome}, ${away.name} ${scoreAway}`}
      >
        <TeamSide side={home} scorers={scorersHome} />

        <p className="px-1 font-mono text-5xl leading-none font-black tabular-nums sm:text-6xl">
          {scoreHome}
          <span className="mx-1 text-white/28">:</span>
          {scoreAway}
        </p>

        <TeamSide side={away} scorers={scorersAway} />
      </div>

      {queue.length > 0 && (
        <div className="relative flex flex-wrap items-center justify-center gap-2 border-t border-white/8 px-4 py-2.5">
          <span className="text-[10px] font-semibold tracking-[0.2em] text-white/40 uppercase">
            En la fila
          </span>
          {queue.map((team, i) => (
            <span
              key={team.key}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-2.5 py-0.5 text-[11px] font-semibold"
            >
              <span className="font-mono text-white/40 tabular-nums">
                {i + 1}
              </span>
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: TEAM_COLORS_LIGHT[team.key] }}
              />
              <span className="max-w-28 truncate">{team.name}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function TeamSide({ side, scorers }: { side: LiveSide; scorers: string[] }) {
  const color = TEAM_COLORS_LIGHT[side.key];
  return (
    <div className="min-w-0 text-center">
      <p
        className="truncate text-sm font-bold tracking-wide uppercase"
        style={{ color }}
      >
        {side.name}
      </p>
      <span
        className="mx-auto mt-1 block h-0.5 w-8 rounded-full"
        style={{ backgroundColor: color }}
      />
      <p
        className={cn(
          "mt-1.5 line-clamp-2 text-[10px] leading-snug",
          scorers.length > 0 ? "text-white/58" : "text-white/36",
        )}
      >
        {scorers.length > 0 ? scorers.join(", ") : "Sin goleadores registrados"}
      </p>
    </div>
  );
}
