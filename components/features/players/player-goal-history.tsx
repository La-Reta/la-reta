import Link from "next/link";
import type { ReactNode } from "react";
import {
  CalendarDaysIcon,
  CircleDotIcon,
  FlameIcon,
  TargetIcon,
  TrophyIcon,
} from "lucide-react";
import type { PlayerGoalHistoryItem } from "@/lib/queries";
import { formatShortDateOnly } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function plural(value: number, singular: string, pluralText: string) {
  return value === 1 ? singular : pluralText;
}

function goalsLabel(goals: number) {
  return `${goals} ${plural(goals, "gol", "goles")}`;
}

function resultLabel(item: PlayerGoalHistoryItem) {
  if (item.scoreA === item.scoreB) return "Empate";
  return item.scoreA > item.scoreB
    ? `Ganó ${item.teamAName}`
    : `Ganó ${item.teamBName}`;
}

function playerTeamName(item: PlayerGoalHistoryItem) {
  if (item.team === "A") return item.teamAName;
  if (item.team === "B") return item.teamBName;
  return null;
}

export function PlayerGoalHistory({
  history,
}: {
  history: PlayerGoalHistoryItem[];
}) {
  const totalGoals = history.reduce((sum, item) => sum + item.goals, 0);
  const scoringMatches = history.length;
  const bestMatch = history.reduce<PlayerGoalHistoryItem | null>(
    (best, item) => (!best || item.goals > best.goals ? item : best),
    null,
  );
  const latest = history[0] ?? null;
  const maxGoals = Math.max(1, ...history.map((item) => item.goals));
  const avgGoals = scoringMatches ? totalGoals / scoringMatches : 0;

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Historial de goles</CardTitle>
          {totalGoals > 0 ? (
            <Badge variant="secondary">{goalsLabel(totalGoals)}</Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {history.length === 0 ? (
          <div className="bg-muted/40 rounded-lg px-4 py-8 text-center">
            <CircleDotIcon className="text-muted-foreground mx-auto size-8" />
            <p className="mt-3 text-sm font-medium">Sin goles registrados</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Cuando anote en un partido guardado, su historial aparecerá aquí.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-4">
              <GoalStat
                icon={<TargetIcon />}
                label="Goles"
                value={String(totalGoals)}
              />
              <GoalStat
                icon={<TrophyIcon />}
                label="Partidos anotando"
                value={String(scoringMatches)}
              />
              <GoalStat
                icon={<FlameIcon />}
                label="Mejor partido"
                value={bestMatch ? String(bestMatch.goals) : "0"}
              />
              <GoalStat
                icon={<CalendarDaysIcon />}
                label="Promedio"
                value={avgGoals.toFixed(1)}
              />
            </div>

            {latest ? (
              <div className="bg-muted/30 rounded-lg border p-3">
                <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                  Último registro
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <span className="font-semibold">
                    {goalsLabel(latest.goals)}
                  </span>
                  <span className="text-muted-foreground">
                    {formatShortDateOnly(latest.playedAt)}
                  </span>
                  <span className="text-muted-foreground">
                    {latest.teamAName} {latest.scoreA}-{latest.scoreB}{" "}
                    {latest.teamBName}
                  </span>
                </div>
              </div>
            ) : null}

            <ol className="space-y-2">
              {history.map((item) => (
                <li
                  key={item.matchId}
                  className="hover:bg-muted/35 rounded-lg border p-3 transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {item.teamAName}{" "}
                        <span className="font-mono tabular-nums">
                          {item.scoreA}-{item.scoreB}
                        </span>{" "}
                        {item.teamBName}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {formatShortDateOnly(item.playedAt)} ·{" "}
                        {resultLabel(item)}
                        {playerTeamName(item)
                          ? ` · ${playerTeamName(item)}`
                          : ""}
                        {item.durationSec
                          ? ` · ${Math.round(item.durationSec / 60)} min`
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>{goalsLabel(item.goals)}</Badge>
                      <Button
                        size="xs"
                        variant="outline"
                        render={
                          <Link href={`/matches/${item.matchId}/detail`} />
                        }
                      >
                        Ver
                      </Button>
                    </div>
                  </div>
                  <div className="bg-muted mt-3 h-1.5 overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${(item.goals / maxGoals) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function GoalStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-muted/30 rounded-lg border p-3">
      <div className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold uppercase">
        <span className="[&_svg]:size-3.5">{icon}</span>
        {label}
      </div>
      <p className="mt-2 font-mono text-2xl font-black tabular-nums">{value}</p>
    </div>
  );
}
