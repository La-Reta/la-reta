"use client";

import * as React from "react";
import { Spotlight } from "@/components/app/spotlight";
import type { Player } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export type ScorerEntry = { player: Player; goals: number; matches: number };

/**
 * "El goleador" spotlight. When several players are tied for the most goals it
 * cycles through them (fading between); with a single leader it just renders
 * the spotlight statically.
 */
export function RotatingScorer({
  scorers,
  intervalMs = 4500,
}: {
  scorers: ScorerEntry[];
  intervalMs?: number;
}) {
  const [index, setIndex] = React.useState(0);
  const [visible, setVisible] = React.useState(true);
  const multiple = scorers.length > 1;

  React.useEffect(() => {
    if (!multiple) return;
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    let swap: ReturnType<typeof setTimeout>;
    const tick = setInterval(() => {
      if (reduce) {
        setIndex((i) => (i + 1) % scorers.length);
        return;
      }
      setVisible(false);
      swap = setTimeout(() => {
        setIndex((i) => (i + 1) % scorers.length);
        setVisible(true);
      }, 280);
    }, intervalMs);
    return () => {
      clearInterval(tick);
      clearTimeout(swap);
    };
  }, [multiple, scorers.length, intervalMs]);

  function goTo(i: number) {
    setVisible(false);
    setTimeout(() => {
      setIndex(i);
      setVisible(true);
    }, 280);
  }

  const active = index % scorers.length;
  const s = scorers[active];
  if (!s) return null;

  const games = `${s.matches} ${s.matches === 1 ? "partido" : "partidos"}`;
  const note = multiple
    ? `en ${games} · ${active + 1}/${scorers.length} empatados`
    : `en ${games}`;

  const dots = multiple ? (
    <div className="flex max-w-full scrollbar-none items-center justify-center gap-1.5 overflow-x-auto px-1 py-0.5">
      {scorers.map((entry, i) => (
        <button
          key={entry.player.id}
          type="button"
          onClick={() => goTo(i)}
          aria-label={`Ver goleador ${i + 1}: ${entry.player.displayName}${i === active ? " (actual)" : ""}`}
          aria-current={i === active ? "true" : undefined}
          className="focus-visible:ring-ring flex size-5 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <span
            className={cn(
              "block h-1.5 rounded-full transition-all duration-200",
              i === active
                ? "bg-primary w-4"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-1.5",
            )}
          />
          <span className="sr-only">{entry.player.displayName}</span>
        </button>
      ))}
    </div>
  ) : undefined;

  return (
    <div>
      <Spotlight
        title="El goleador"
        subtitle={
          multiple
            ? `${scorers.length} empatados en la cima`
            : "Máximo anotador de la reta"
        }
        player={s.player}
        statValue={s.goals}
        statLabel="GOLES"
        note={note}
        footer={dots}
        // Animate only the body — header and dots stay put, so it reads as the
        // content changing, not the whole card reloading.
        contentClassName="transition-all duration-300"
        contentStyle={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(4px)",
        }}
      />
    </div>
  );
}
