import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MatchWithScorers, Scorer } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { TrophyIcon } from "lucide-react";

// Team-colored text (sky = A, rose = B) to tie figures/shares to a side.
const TEAM_TEXT = {
  A: "text-sky-600 dark:text-sky-400",
  B: "text-rose-600 dark:text-rose-400",
} as const;

export default function ScorersSection({
  scored,
  match,
}: {
  scored: Scorer[];
  match: MatchWithScorers;
}) {
  const mvp = scored[0] ?? null;
  const mvpTeam = mvp?.team === "A" || mvp?.team === "B" ? mvp.team : null;
  const totalGoals = match.scoreA + match.scoreB;
  const aShare = totalGoals
    ? Math.round((match.scoreA / totalGoals) * 100)
    : 50;

  return (
    <Card className="overflow-hidden">
      <CardContent className="grid gap-5 sm:grid-cols-2 sm:items-center sm:divide-x">
        {/* Figura del partido: máximo goleador entre ambos equipos. */}
        <div className="flex items-center gap-4 sm:pr-5">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400 [&_svg]:size-7">
            <TrophyIcon />
          </span>
          <div className="min-w-0">
            <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
              Goleador del partido
            </p>
            {mvp ? (
              <>
                <div className="flex items-center gap-2">
                  <p className="font-display truncate text-xl font-bold">
                    {mvp.name}
                  </p>
                  {mvp.isGuest ? (
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      invitado
                    </Badge>
                  ) : null}
                </div>
                <p className="text-muted-foreground text-xs">
                  {mvpTeam ? (
                    <span className={cn("font-medium", TEAM_TEXT[mvpTeam])}>
                      {mvpTeam === "A" ? match.teamAName : match.teamBName}
                    </span>
                  ) : (
                    "Sin equipo"
                  )}{" "}
                  · {mvp.goals} gol{mvp.goals === 1 ? "" : "es"}
                  {mvp.assists > 0
                    ? ` · ${mvp.assists} asistencia${mvp.assists === 1 ? "" : "s"}`
                    : ""}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground mt-0.5 text-sm">
                Sin goles registrados
              </p>
            )}
          </div>
        </div>

        {/* Cuota de gol: proporción del marcador por equipo. */}
        <div className="sm:pl-5">
          <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
            <span className={cn("min-w-0 truncate font-medium", TEAM_TEXT.A)}>
              {match.teamAName}
            </span>
            <span className="text-muted-foreground shrink-0 text-[10px] font-semibold tracking-wider uppercase">
              Cuota de gol
            </span>
            <span
              className={cn(
                "min-w-0 truncate text-right font-medium",
                TEAM_TEXT.B,
              )}
            >
              {match.teamBName}
            </span>
          </div>
          <div className="bg-muted flex h-2.5 overflow-hidden rounded-full">
            <div className="bg-sky-500" style={{ width: `${aShare}%` }} />
            <div
              className="bg-rose-500"
              style={{ width: `${100 - aShare}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between font-mono text-sm font-bold tabular-nums">
            <span className={TEAM_TEXT.A}>{match.scoreA}</span>
            <span className={TEAM_TEXT.B}>{match.scoreB}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
