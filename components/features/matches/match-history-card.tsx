import { DeleteMatchButton } from "@/components/features/matches/delete-match-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatShortDateOnly } from "@/lib/dates";
import type { MatchWithScorers } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { NotebookTabsIcon, PencilIcon } from "lucide-react";
import Link from "next/link";

function balanceColor(v: number) {
  if (v >= 60) return "bg-emerald-500";
  if (v >= 40) return "bg-amber-500";
  return "bg-rose-500";
}

export function MatchHistoryCard({
  match,
  admin,
}: {
  match: MatchWithScorers;
  admin: boolean;
}) {
  const aWon = match.scoreA > match.scoreB;
  const bWon = match.scoreB > match.scoreA;
  const goleadores = match.scorers.filter((s) => s.goals > 0);
  const asistentes = match.scorers.filter((s) => s.goals === 0);

  return (
    <Card size="sm">
      <CardContent>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground text-xs">
            {formatShortDateOnly(match.playedAt)}
            {match.durationSec
              ? ` · ⏱ ${Math.round(match.durationSec / 60)} min`
              : ""}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              render={<Link href={`/matches/${match.id}/detail`} />}
            >
              <NotebookTabsIcon />
              Ver detalles
            </Button>
            {admin && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Editar partido"
                  render={<Link href={`/matches/${match.id}/edit`} />}
                >
                  <PencilIcon />
                </Button>
                <DeleteMatchButton id={match.id} />
              </>
            )}
          </div>
        </div>

        <div className="mt-1 flex items-center justify-center gap-4 text-center">
          <span
            className={cn(
              "flex-1 text-right text-sm",
              aWon ? "font-bold" : "text-muted-foreground",
            )}
          >
            {match.teamAName}
            {aWon ? <span className="sr-only"> (ganador)</span> : null}
          </span>
          <span
            className="font-mono text-2xl font-black tabular-nums"
            aria-label={`Marcador: ${match.teamAName} ${match.scoreA}, ${match.teamBName} ${match.scoreB}`}
          >
            <span aria-hidden="true">
              {match.scoreA}
              <span className="text-muted-foreground mx-1">-</span>
              {match.scoreB}
            </span>
          </span>
          <span
            className={cn(
              "flex-1 text-left text-sm",
              bWon ? "font-bold" : "text-muted-foreground",
            )}
          >
            {match.teamBName}
            {bWon ? <span className="sr-only"> (ganador)</span> : null}
          </span>
        </div>

        <div className="mx-auto mt-3 flex max-w-xs items-center gap-2">
          <span className="text-muted-foreground text-[10px] uppercase">
            Balance
          </span>
          <div
            className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={match.balance}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Balance ${match.balance} de 100`}
          >
            <div
              className={cn("h-full rounded-full", balanceColor(match.balance))}
              style={{ width: `${match.balance}%` }}
            />
          </div>
          <span className="font-mono text-xs font-bold tabular-nums">
            {match.balance}
          </span>
        </div>

        {(goleadores.length > 0 || asistentes.length > 0) && (
          <div className="mt-3 space-y-2 border-t pt-3">
            {goleadores.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5">
                {goleadores.map((s, gi) => (
                  <span
                    key={s.playerId ?? `guest-${gi}`}
                    className="bg-muted inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px]"
                  >
                    <span aria-hidden="true">⚽</span> {s.displayName}
                    {s.goals > 1 ? (
                      <span className="font-bold">×{s.goals}</span>
                    ) : null}
                  </span>
                ))}
              </div>
            )}
            {asistentes.length > 0 && (
              <p className="text-muted-foreground text-center text-[11px]">
                <span className="font-medium">También jugaron:</span>{" "}
                {asistentes.map((s) => s.displayName).join(", ")}
              </p>
            )}
          </div>
        )}

        {match.notes && (
          <p className="text-muted-foreground mt-2 text-center text-xs italic">
            {match.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
