"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { matchPrefillAtom } from "@/lib/state/atoms";
import { useSetAtom } from "jotai";
import { ClipboardListIcon, SendIcon } from "lucide-react";
import { useRouter } from "next/navigation";

/** One past reta, trimmed to what the prefill needs (built server-side). */
export type RetaToMatchItem = {
  id: number;
  teamAName: string;
  teamBName: string;
  ratingA: number;
  ratingB: number;
  dateLabel: string;
  playedAt: string;
  players: {
    playerId: number | null;
    guestName: string | null;
    team: "A" | "B" | null;
    name: string;
  }[];
};

/**
 * Lets the user take a past generated reta straight into the match form
 * (/matches) with team names + attendance prefilled, guests included. Nothing is
 * submitted — the form loads the data so details can be adjusted first. Each row
 * reads as a mini scoreboard so the matchup identity carries the section.
 */
export function RetaToMatchList({ retas }: { retas: RetaToMatchItem[] }) {
  const router = useRouter();
  const setPrefill = useSetAtom(matchPrefillAtom);

  function sendToMatches(reta: RetaToMatchItem) {
    setPrefill({
      teamAName: reta.teamAName,
      teamBName: reta.teamBName,
      playedAt: reta.playedAt,
      generatedRetaId: reta.id,
      scorers: reta.players.map((p) => ({
        playerId: p.playerId,
        guestName: p.playerId == null ? (p.guestName ?? p.name) : undefined,
        team: p.team,
        goals: 0,
      })),
    });
    router.push("/matches");
  }

  if (retas.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-xl">
            <ClipboardListIcon className="size-4" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight">
              Llevar una reta a Partidos
            </h2>
            <p className="text-muted-foreground text-sm">
              Prellena el registro de partidos con los equipos y la asistencia
              de una reta pasada. No se guarda nada hasta que lo confirmes.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        <ul className="space-y-0.5">
          {retas.map((reta) => (
            <li
              key={reta.id}
              className="group hover:bg-muted/60 flex flex-col gap-3 rounded-2xl p-3 transition-colors sm:flex-row sm:items-center sm:gap-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground mb-1 text-center text-[10px] font-semibold tracking-wider uppercase tabular-nums sm:text-left">
                  {reta.dateLabel} · {reta.players.length} jugadores
                </p>
                <div className="flex items-center justify-center gap-2 sm:justify-start sm:gap-3">
                  <span className="font-display min-w-0 flex-1 truncate text-right text-sm font-bold uppercase sm:flex-none sm:text-base">
                    {reta.teamAName}
                  </span>
                  <span className="font-mono text-sm font-bold tabular-nums text-sky-500">
                    {reta.ratingA}
                  </span>
                  <span className="text-muted-foreground font-display text-[11px] font-bold">
                    VS
                  </span>
                  <span className="font-mono text-sm font-bold tabular-nums text-rose-500">
                    {reta.ratingB}
                  </span>
                  <span className="font-display min-w-0 flex-1 truncate text-sm font-bold uppercase sm:flex-none sm:text-base">
                    {reta.teamBName}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full shrink-0 sm:w-auto"
                onClick={() => sendToMatches(reta)}
              >
                <SendIcon className="transition-transform group-hover:translate-x-0.5" />
                Llevar a partidos
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
