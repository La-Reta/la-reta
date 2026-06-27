"use client";

import { ArrowRightLeftIcon, PlayIcon, RadioIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function StartMatchForm({
  teamA,
  teamB,
  onTeamAChange,
  onTeamBChange,
  onSwapTeams,
  onStart,
}: {
  teamA: string;
  teamB: string;
  onTeamAChange: (value: string) => void;
  onTeamBChange: (value: string) => void;
  onSwapTeams: () => void;
  onStart: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <Card className="overflow-hidden border-none bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_34%),linear-gradient(180deg,var(--color-card),color-mix(in_oklab,var(--color-card)_88%,var(--color-muted)))] shadow-sm ring-1 ring-foreground/10">
        <CardHeader className="border-b border-foreground/8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              <RadioIcon className="size-3.5" />
              Pre-partido
            </span>
          </div>
          <CardTitle className="text-xl sm:text-2xl">
            Configura el marcador antes de arrancar
          </CardTitle>
          <CardDescription className="max-w-2xl text-sm leading-relaxed">
            Define los nombres de los equipos y deja listo el tablero para
            empezar a registrar goles, tiempo de juego y goleadores durante la
            reta.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pt-6">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/6 p-3 dark:bg-sky-500/10">
              <Input
                value={teamA}
                onChange={(e) => onTeamAChange(e.target.value)}
                placeholder="Equipo A"
                aria-label="Equipo A"
                className="h-11 rounded-xl border-0 bg-background/80 shadow-none ring-1 ring-inset ring-sky-500/15 placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-sky-500/35"
              />
            </div>

            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-11 rounded-full border-foreground/10 bg-background/70 shadow-sm"
                onClick={onSwapTeams}
                aria-label="Intercambiar equipos"
              >
                <ArrowRightLeftIcon className="size-4" />
              </Button>
            </div>

            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/6 p-3 dark:bg-rose-500/10">
              <Input
                value={teamB}
                onChange={(e) => onTeamBChange(e.target.value)}
                placeholder="Equipo B"
                aria-label="Equipo B"
                className="h-11 rounded-xl border-0 bg-background/80 shadow-none ring-1 ring-inset ring-rose-500/15 placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-rose-500/35"
              />
            </div>
          </div>

          <Button size="lg" className="w-full sm:w-auto" onClick={onStart}>
            <PlayIcon />
            Iniciar partido en vivo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
