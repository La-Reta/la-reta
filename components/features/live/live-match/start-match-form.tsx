"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRightLeftIcon, PlayIcon, RadioIcon } from "lucide-react";

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
      <Card className="ring-foreground/10 overflow-hidden border-none bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_34%),linear-gradient(180deg,var(--color-card),color-mix(in_oklab,var(--color-card)_88%,var(--color-muted)))] shadow-sm ring-1">
        <CardHeader className="border-foreground/8 border-b">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.16em] uppercase">
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
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/6 p-1 dark:bg-sky-500/10">
              <Input
                value={teamA}
                onChange={(e) => onTeamAChange(e.target.value)}
                placeholder="Equipo A"
                aria-label="Equipo A"
                className="bg-background/80 placeholder:text-muted-foreground/80 h-11 border-0 shadow-none ring-1 ring-sky-500/15 ring-inset focus-visible:ring-2 focus-visible:ring-sky-500/35"
              />
            </div>

            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="icon-lg"
                onClick={onSwapTeams}
                aria-label="Intercambiar equipos"
              >
                <ArrowRightLeftIcon className="size-4" />
              </Button>
            </div>

            <div className="rounded-xl border border-rose-500/20 bg-rose-500/6 p-1 dark:bg-rose-500/10">
              <Input
                value={teamB}
                onChange={(e) => onTeamBChange(e.target.value)}
                placeholder="Equipo B"
                aria-label="Equipo B"
                className="bg-background/80 placeholder:text-muted-foreground/80 h-11 border-0 shadow-none ring-1 ring-rose-500/15 ring-inset focus-visible:ring-2 focus-visible:ring-rose-500/35"
              />
            </div>
          </div>

          <Button
            size="lg"
            className="mx-auto flex w-full max-w-xl"
            onClick={onStart}
          >
            <PlayIcon />
            Iniciar partido en vivo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
