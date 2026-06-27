"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { FifaCard } from "@/components/shared/fifa-card";
import { Button } from "@/components/ui/button";
import { flagEmoji } from "@/lib/format";
import { positionGroup, GROUP_COLOR } from "@/lib/constants";
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

  React.useEffect(() => {
    if (players.length <= 1) return;
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
  }, [players.length, intervalMs]);

  const player = players[index];
  if (!player) return null;

  return (
    <section className="rounded-lg bg-card ring-1 ring-foreground/10">
      <header className="border-b px-4 py-3">
        <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
          Conoce a los jugadores
        </h2>
        <p className="text-[11px] text-muted-foreground">
          La plantilla completa · actualiza cada momento
        </p>
      </header>

      <div
        className="flex items-center gap-4 p-4 transition-all duration-300"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(4px)",
        }}
      >
        <Link
          href={`/players/${player.id}`}
          className="w-28 shrink-0 transition-transform hover:-translate-y-1"
        >
          <FifaCard player={player} size="sm" />
        </Link>
        <div className="min-w-0">
          <p className="font-display text-2xl font-bold uppercase leading-none">
            {player.displayName}
          </p>
          <p className="truncate text-sm text-muted-foreground">
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
            <span className="text-sm">{flagEmoji(player.nationality)}</span>
          </div>
          <p className="mt-1.5 font-mono text-3xl font-black tabular-nums">
            {player.overall}
            <span className="ml-1 text-xs font-medium text-muted-foreground">
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

      {/* dot indicators */}
      <footer className="flex justify-center gap-1 border-t px-4 py-2.5">
        {players.slice(0, 12).map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setVisible(false);
              setTimeout(() => {
                setIndex(i);
                setVisible(true);
              }, 280);
            }}
            className="size-1.5 rounded-full transition-colors"
            style={{
              backgroundColor:
                i === index % 12 ?
                  "hsl(var(--foreground))"
                : "hsl(var(--muted-foreground) / 0.3)",
            }}
            aria-label={`Jugador ${i + 1}`}
          />
        ))}
      </footer>
    </section>
  );
}
