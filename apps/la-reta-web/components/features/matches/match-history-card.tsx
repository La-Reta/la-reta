import { DeleteMatchButton } from "@/components/features/matches/delete-match-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatShortDateOnly } from "@/lib/dates";
import type { MatchWithScorers } from "@/lib/queries";
import { matchTeams, TEAM_COLORS } from "@/lib/teams";
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
  const teams = matchTeams(match);
  // Con 3+ equipos no hay "local vs visitante": gana quien más goles metió.
  const best = Math.max(...teams.map((t) => t.score));
  const isWinner = (score: number) =>
    score === best && teams.filter((t) => t.score === best).length === 1;
  const goleadores = match.scorers.filter((s) => s.goals > 0);
  const asistentes = match.scorers.filter((s) => s.goals === 0);
  const matchDetailUrl = `/matches/${match.id}/detail`;

  return (
    <Link href={matchDetailUrl}>
      <Card size="sm" className="hover:bg-muted cursor-pointer transition">
        <CardContent className="relative">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-xs">
              {formatShortDateOnly(match.playedAt)}
              {match.durationSec
                ? ` · ⏱ ${Math.round(match.durationSec / 60)} min`
                : ""}
            </span>
            <div className="absolute right-4 flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                render={<Link href={matchDetailUrl} />}
                className={"hidden md:inline-flex"}
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

          {teams.length === 2 ? (
            <div className="mt-1 flex items-center justify-center gap-4 text-center">
              <span
                className={cn(
                  "flex-1 text-right text-sm",
                  isWinner(teams[0].score)
                    ? "font-bold"
                    : "text-muted-foreground",
                )}
              >
                {teams[0].name}
                {isWinner(teams[0].score) ? (
                  <span className="sr-only"> (ganador)</span>
                ) : null}
              </span>
              <span
                className="font-mono text-2xl font-black tabular-nums"
                aria-label={`Marcador: ${teams[0].name} ${teams[0].score}, ${teams[1].name} ${teams[1].score}`}
              >
                <span aria-hidden="true">
                  {teams[0].score}
                  <span className="text-muted-foreground mx-1">-</span>
                  {teams[1].score}
                </span>
              </span>
              <span
                className={cn(
                  "flex-1 text-left text-sm",
                  isWinner(teams[1].score)
                    ? "font-bold"
                    : "text-muted-foreground",
                )}
              >
                {teams[1].name}
                {isWinner(teams[1].score) ? (
                  <span className="sr-only"> (ganador)</span>
                ) : null}
              </span>
            </div>
          ) : (
            // Reta de 3+ equipos: tabla corta en vez de un "vs" que no existe.
            <div
              className="mt-1 flex flex-wrap items-center justify-center gap-x-5 gap-y-1"
              aria-label={`Marcador: ${teams.map((t) => `${t.name} ${t.score}`).join(", ")}`}
            >
              {teams.map((team) => (
                <span key={team.key} className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full"
                    style={{ backgroundColor: TEAM_COLORS[team.key] }}
                  />
                  <span
                    className={cn(
                      "max-w-32 truncate text-sm",
                      isWinner(team.score)
                        ? "font-bold"
                        : "text-muted-foreground",
                    )}
                  >
                    {team.name}
                  </span>
                  <span className="font-mono text-lg font-black tabular-nums">
                    {team.score}
                  </span>
                </span>
              ))}
            </div>
          )}

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
                className={cn(
                  "h-full rounded-full",
                  balanceColor(match.balance),
                )}
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
    </Link>
  );
}
