"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { matchPrefillAtom } from "@/lib/state/atoms";
import { pairsOf, TEAM_COLORS, type TeamKey } from "@/lib/teams";
import { useSetAtom } from "jotai";
import { ClipboardListIcon, SendIcon } from "lucide-react";
import { useRouter } from "next/navigation";

/** One past reta, trimmed to what the prefill needs (built server-side). */
export type RetaToMatchItem = {
  id: number;
  dateLabel: string;
  playedAt: string;
  teams: { key: TeamKey; name: string; rating: number }[];
  players: {
    playerId: number | null;
    guestName: string | null;
    /** Letra del equipo dentro de la reta ("A", "B", "C" …). */
    team: TeamKey | null;
    name: string;
  }[];
};

/**
 * Lets the user take a past generated reta straight into the match form
 * (/matches) with team names + attendance prefilled, guests included. Nothing is
 * submitted — the form loads the data so details can be adjusted first. Con 3+
 * equipos hay un botón por duelo posible, porque un partido siempre es de dos.
 */
export function RetaToMatchList({ retas }: { retas: RetaToMatchItem[] }) {
  const router = useRouter();
  const setPrefill = useSetAtom(matchPrefillAtom);

  function sendToMatches(reta: RetaToMatchItem, aKey: TeamKey, bKey: TeamKey) {
    const teamOf = (key: TeamKey) => reta.teams.find((t) => t.key === key);
    setPrefill({
      teamAName: teamOf(aKey)?.name ?? `Equipo ${aKey}`,
      teamBName: teamOf(bKey)?.name ?? `Equipo ${bKey}`,
      playedAt: reta.playedAt,
      generatedRetaId: reta.id,
      teamAKey: aKey,
      teamBKey: bKey,
      // Solo los dos equipos que juegan; su letra se traduce a lado A/B.
      scorers: reta.players
        .filter((p) => p.team === aKey || p.team === bKey)
        .map((p) => ({
          playerId: p.playerId,
          guestName: p.playerId == null ? (p.guestName ?? p.name) : undefined,
          team: p.team === aKey ? ("A" as const) : ("B" as const),
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
                  {reta.dateLabel} · {reta.teams.length} equipos ·{" "}
                  {reta.players.length} jugadores
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:justify-start">
                  {reta.teams.map((team, i) => (
                    <span key={team.key} className="flex items-center gap-2">
                      {i > 0 && (
                        <span className="text-muted-foreground font-display text-[11px] font-bold">
                          VS
                        </span>
                      )}
                      <span className="font-display max-w-36 truncate text-sm font-bold uppercase sm:text-base">
                        {team.name}
                      </span>
                      <span
                        className="font-mono text-sm font-bold tabular-nums"
                        style={{ color: TEAM_COLORS[team.key] }}
                      >
                        {team.rating}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap justify-center gap-2">
                {pairsOf(reta.teams).map(([a, b]) => (
                  <Button
                    key={`${a.key}${b.key}`}
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => sendToMatches(reta, a.key, b.key)}
                  >
                    <SendIcon className="transition-transform group-hover:translate-x-0.5" />
                    {reta.teams.length === 2
                      ? "Llevar a partidos"
                      : `${a.name} vs ${b.name}`}
                  </Button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
