"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { FifaCard } from "@/components/shared/fifa-card";
import { Button } from "@/components/ui/button";
import { flagEmoji } from "@/lib/format";
import { positionGroup, GROUP_COLOR } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Player } from "@/lib/db/schema";

export function RotatingPlayer({
  players,
  intervalMs = 5000,
}: {
  players: Player[];
  intervalMs?: number;
}) {
  const [index, setIndex] = React.useState(0);
  const [visible, setVisible] = React.useState(true);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    if (players.length <= 1 || paused) return;
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    let swap: ReturnType<typeof setTimeout>;
    const tick = setInterval(() => {
      if (reduce) {
        setIndex((i) => (i + 1) % players.length);
        return;
      }
      setVisible(false);
      swap = setTimeout(() => {
        setIndex((i) => (i + 1) % players.length);
        setVisible(true);
      }, 280);
    }, intervalMs);
    return () => {
      clearInterval(tick);
      clearTimeout(swap);
    };
  }, [players.length, intervalMs, paused]);

  function goTo(i: number) {
    setVisible(false);
    setTimeout(() => {
      setIndex(i);
      setVisible(true);
    }, 280);
  }

  const player = players[index];
  if (!player) return null;

  const visibleDots = players.slice(0, 12);
  const activeSlot = index % 12;

  return (
    <section
      className="bg-card ring-foreground/10 rounded-lg ring-1"
      aria-label="Conoce a los jugadores"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <header className="border-b px-4 py-3">
        <h2 className="font-display text-lg font-semibold tracking-wide uppercase">
          Conoce a los jugadores
        </h2>
        <p className="text-muted-foreground text-[11px]">
          La plantilla completa · actualiza cada momento
        </p>
      </header>

      {/* aria-live so screen readers announce player changes */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="flex items-center gap-4 p-4 transition-all duration-300"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(4px)",
        }}
      >
        <Link
          href={`/players/${player.id}`}
          aria-label={`Ver ficha de ${player.displayName}`}
          className="focus-visible:ring-ring w-28 shrink-0 rounded-sm transition-transform hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <FifaCard player={player} size="sm" />
        </Link>
        <div className="min-w-0">
          <p className="font-display text-2xl leading-none font-bold uppercase">
            {player.displayName}
          </p>
          <p className="text-muted-foreground truncate text-sm">
            {player.name}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="inline-flex rounded-sm px-1.5 py-0.5 text-[10px] font-bold text-white"
              style={{
                backgroundColor: GROUP_COLOR[positionGroup(player.position)],
              }}
            >
              {player.position}
            </span>
            <span className="text-sm" aria-hidden="true">
              {flagEmoji(player.nationality)}
            </span>
            <span className="sr-only">{player.nationality}</span>
          </div>
          <p className="mt-1.5 font-mono text-3xl font-black tabular-nums">
            {player.overall}
            <span className="text-muted-foreground ml-1 text-xs font-medium">
              OVR
            </span>
          </p>
          <Button
            variant="outline"
            size="xs"
            className="mt-3"
            render={<Link href={`/players/${player.id}`} />}
          >
            Ver ficha
            <ArrowRightIcon />
          </Button>
        </div>
      </div>

      {/* dot indicators — touch target mínimo 44×44px via padding */}
      <footer
        className="flex flex-wrap justify-center gap-0 border-t px-4"
        role="group"
        aria-label="Seleccionar jugador"
      >
        {visibleDots.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Ver jugador ${i + 1}${i === activeSlot ? " (actual)" : ""}`}
            aria-current={i === activeSlot ? "true" : undefined}
            className={cn(
              // 44×44px táctil, punto visual centrado
              "flex min-h-[44px] min-w-[44px] items-center justify-center",
              "focus-visible:ring-ring rounded-sm focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none",
            )}
          >
            <span
              className={cn(
                "block size-2.5 rounded-full transition-all duration-200",
                i === activeSlot
                  ? "bg-foreground scale-125"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/60",
              )}
            />
          </button>
        ))}
      </footer>
    </section>
  );
}
