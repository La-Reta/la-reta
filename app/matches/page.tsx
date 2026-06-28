import Link from "next/link";
import { NotebookTabsIcon, PencilIcon } from "lucide-react";
import { getMatches, getTopScorers } from "@/lib/queries";
import { getPlayers } from "@/lib/queries";
import { isAdmin } from "@/lib/admin";
import { MatchForm } from "@/components/features/matches/match-form";
import { DeleteMatchButton } from "@/components/features/matches/delete-match-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { flagEmoji } from "@/lib/format";
import { cn } from "@/lib/utils";
import { formatShortDateOnly } from "@/lib/dates";

function balanceColor(v: number) {
  if (v >= 60) return "bg-emerald-500";
  if (v >= 40) return "bg-amber-500";
  return "bg-rose-500";
}

export const metadata = { title: "Partidos · Reta Fútbol" };
export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const [players, matches, scorers, admin] = await Promise.all([
    getPlayers(),
    getMatches(),
    getTopScorers(),
    isAdmin(),
  ]);

  const formPlayers = [...players]
    .map((p) => ({ id: p.id, name: p.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Partidos</h1>
        <p className="text-muted-foreground text-sm">
          Registra los resultados de la reta y lleva la tabla de goleadores.
        </p>
      </div>

      <MatchForm players={formPlayers} />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
        {/* Historial */}
        <section className="space-y-3">
          <h2 className="text-muted-foreground flex items-center gap-2 text-sm font-semibold uppercase">
            <span className="bg-primary h-4 w-1 rounded-full" />
            Historial · {matches.length}
          </h2>

          {matches.length === 0 ? (
            <p className="bg-card text-muted-foreground ring-foreground/10 rounded-lg p-8 text-center text-sm ring-1">
              Aún no hay partidos registrados.
            </p>
          ) : (
            <div className="space-y-3">
              {matches.map((m) => {
                const aWon = m.scoreA > m.scoreB;
                const bWon = m.scoreB > m.scoreA;
                return (
                  <div
                    key={m.id}
                    className="bg-card ring-foreground/10 rounded-lg p-4 ring-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground text-xs">
                        {formatShortDateOnly(m.playedAt)}
                        {m.durationSec
                          ? ` · ⏱ ${Math.round(m.durationSec / 60)} min`
                          : ""}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={"default"}
                          size={"sm"}
                          aria-label="Ver detalles"
                          render={<Link href={`/matches/${m.id}/detail`} />}
                        >
                          <NotebookTabsIcon />
                          Ver detalles
                        </Button>
                        {admin && (
                          <>
                            <Button
                              variant="outline"
                              size="icon-sm"
                              aria-label="Editar partido"
                              render={<Link href={`/matches/${m.id}/edit`} />}
                            >
                              <PencilIcon />
                            </Button>
                            <DeleteMatchButton id={m.id} />
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
                        {m.teamAName}
                      </span>
                      <span className="font-mono text-2xl font-black tabular-nums">
                        {m.scoreA}
                        <span className="text-muted-foreground mx-1">-</span>
                        {m.scoreB}
                      </span>
                      <span
                        className={cn(
                          "flex-1 text-left text-sm",
                          bWon ? "font-bold" : "text-muted-foreground",
                        )}
                      >
                        {m.teamBName}
                      </span>
                    </div>
                    <div className="mx-auto mt-3 flex max-w-xs items-center gap-2">
                      <span className="text-muted-foreground text-[10px] uppercase">
                        Balance
                      </span>
                      <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            balanceColor(m.balance),
                          )}
                          style={{ width: `${m.balance}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-bold tabular-nums">
                        {m.balance}
                      </span>
                    </div>
                    {m.scorers.length > 0 && (
                      <div className="mt-3 flex flex-wrap justify-center gap-1.5 border-t pt-3">
                        {m.scorers.map((s) => (
                          <span
                            key={s.playerId}
                            className="bg-muted inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px]"
                          >
                            ⚽ {s.displayName}
                            {s.goals > 1 ? (
                              <span className="font-bold">×{s.goals}</span>
                            ) : null}
                          </span>
                        ))}
                      </div>
                    )}
                    {m.notes && (
                      <p className="text-muted-foreground mt-2 text-center text-xs italic">
                        {m.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Goleadores */}
        <Card className="h-fit">
          <CardHeader className="border-b">
            <CardTitle>Goleadores</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {scorers.length === 0 ? (
              <p className="text-muted-foreground p-4 text-xs">
                Aún sin goles registrados.
              </p>
            ) : (
              <ol>
                {scorers.map((s, i) => (
                  <li
                    key={s.playerId}
                    className="flex items-center gap-2 border-b px-3 py-2 text-sm last:border-b-0"
                  >
                    <span className="font-display text-muted-foreground w-4 text-center font-bold tabular-nums">
                      {i + 1}
                    </span>
                    <span>{flagEmoji(s.nationality)}</span>
                    <span className="truncate">{s.name}</span>
                    <span className="text-muted-foreground ml-auto text-[10px]">
                      {s.matches} {s.matches === 1 ? "partido" : "partidos"}
                    </span>
                    <span className="w-6 text-right font-mono font-bold tabular-nums">
                      {s.goals}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
