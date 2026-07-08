"use client";

import { FifaCard } from "@/components/shared/fifa-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GROUP_COLOR, positionGroup } from "@/lib/constants";
import type { Player } from "@/lib/db/schema";
import { flagEmoji } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import * as React from "react";

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
    <Card
      className="pb-0"
      aria-label="Conoce a los jugadores"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <CardHeader className="border-b">
        <CardTitle className="font-display text-lg font-semibold tracking-wide uppercase">
          Conoce a los jugadores
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          La plantilla completa · actualiza cada momento
        </CardDescription>
      </CardHeader>

      {/* aria-live so screen readers announce player changes */}
      <CardContent
        aria-live="polite"
        aria-atomic="true"
        className="flex flex-1 items-center gap-4 p-4 transition-all duration-300"
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
            variant="default"
            className="mt-3"
            render={<Link href={`/players/${player.id}`} />}
          >
            Ver ficha
            <ArrowRightIcon />
          </Button>
        </div>
      </CardContent>

      <CardFooter
        className="justify-center overflow-hidden border-t px-3 pt-2! pb-3!"
        role="group"
        aria-label="Seleccionar jugador"
      >
        <div className="flex max-w-full scrollbar-none items-center justify-center gap-1.5 overflow-x-auto px-1 py-0.5">
          {visibleDots.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ver jugador ${i + 1}: ${p.displayName}${i === activeSlot ? " (actual)" : ""}`}
              aria-current={i === activeSlot ? "true" : undefined}
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full transition-colors",
                "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              )}
            >
              <span
                className={cn(
                  "block h-1.5 rounded-full transition-all duration-200",
                  i === activeSlot
                    ? "bg-primary w-4"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-1.5",
                )}
              />
              <span className="sr-only">{p.displayName}</span>
            </button>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}
