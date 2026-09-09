import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { dateParts, formatShortDateOnly } from "@/lib/dates";
import type { PlayerGoalHistoryItem } from "@/lib/queries";
import { matchTeams, TEAM_COLORS } from "@/lib/teams";
import { cn } from "@/lib/utils";
import {
  CalendarCheckIcon,
  CircleDotIcon,
  FlameIcon,
  TargetIcon,
  TrendingUpIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Un color por métrica, para que las cuatro tarjetas se distingan sin leerlas.
 *
 * Las clases van enteras y literales: Tailwind escanea el código fuente, así
 * que `text-${tone}-700` no genera nada. Y el tono del número es el 700 en
 * claro, no el 600, porque sobre la tarjeta casi blanca el ámbar-600 se queda
 * en 3.0:1 —justo en el límite de AA para texto grande—; el 700 deja a los
 * cuatro entre 4.7 y 7.0. En oscuro el 400 es el que ya está pensado para eso.
 */
const STAT_TONES = {
  goals: {
    chip: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    value: "text-emerald-700 dark:text-emerald-400",
  },
  matches: {
    chip: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
    value: "text-sky-700 dark:text-sky-400",
  },
  best: {
    chip: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    value: "text-amber-700 dark:text-amber-400",
  },
  average: {
    chip: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
    value: "text-violet-700 dark:text-violet-400",
  },
} as const;

function plural(value: number, singular: string, pluralText: string) {
  return value === 1 ? singular : pluralText;
}

function goalsLabel(goals: number) {
  return `${goals} ${plural(goals, "gol", "goles")}`;
}

/**
 * Cómo acabó el partido **para este jugador**, no en abstracto: con 3+ equipos
 * gana el de más goles, y lo que interesa aquí es si ese fue el suyo.
 */
function outcome(item: PlayerGoalHistoryItem) {
  const teams = matchTeams(item);
  const best = Math.max(...teams.map((t) => t.score));
  const leaders = teams.filter((t) => t.score === best);
  if (leaders.length > 1) return { label: "Empate", tone: "draw" as const };
  if (item.team && leaders[0].key === item.team) {
    return { label: "Ganó", tone: "win" as const };
  }
  return { label: `Ganó ${leaders[0].name}`, tone: "loss" as const };
}

const OUTCOME_STYLE = {
  win: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  draw: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  loss: "bg-muted text-muted-foreground",
} as const;

export const PlayerGoalHistory = ({
  history,
}: {
  readonly history: PlayerGoalHistoryItem[];
}) => {
  const totalGoals = history.reduce((sum, item) => sum + item.goals, 0);
  const scoringMatches = history.length;
  const bestMatch = history.reduce<PlayerGoalHistoryItem | null>(
    (best, item) => (!best || item.goals > best.goals ? item : best),
    null
  );
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
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CircleDotIcon />
              </EmptyMedia>
              <EmptyTitle>Sin goles registrados</EmptyTitle>
              <EmptyDescription>
                Cuando anote en un partido guardado, su historial aparecerá
                aquí.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <GoalStat
                icon={<TargetIcon />}
                label="Goles"
                tone="goals"
                value={String(totalGoals)}
              />
              <GoalStat
                icon={<CalendarCheckIcon />}
                label="Partidos anotando"
                tone="matches"
                value={String(scoringMatches)}
              />
              <GoalStat
                icon={<FlameIcon />}
                label="Mejor partido"
                tone="best"
                value={bestMatch ? String(bestMatch.goals) : "0"}
              />
              <GoalStat
                icon={<TrendingUpIcon />}
                label="Promedio"
                tone="average"
                value={avgGoals.toFixed(1)}
              />
            </div>

            <ol className="space-y-2">
              {history.map((item, index) => (
                <GoalHistoryRow
                  isLatest={index === 0}
                  item={item}
                  key={item.matchId}
                />
              ))}
            </ol>
          </>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Una fila del historial.
 *
 * Habla el mismo idioma que `MatchHistoryCard`: taco de calendario a la
 * izquierda, marcador con el punto de color de cada equipo y el conteo de goles
 * como la cifra grande. Antes era una línea de texto donde la fecha, el
 * marcador y el resultado pesaban lo mismo, así que veinte partidos se veían
 * idénticos y había que leerlos uno a uno para encontrar el que buscabas.
 */
const GoalHistoryRow = ({
  item,
  isLatest,
}: {
  readonly item: PlayerGoalHistoryItem;
  readonly isLatest: boolean;
}) => {
  const teams = matchTeams(item);
  const when = dateParts(item.playedAt);
  const result = outcome(item);
  const mine = teams.find((t) => t.key === item.team) ?? null;
  const scoreLabel = teams.map((t) => `${t.name} ${t.score}`).join(", ");

  return (
    // Patrón "stretched link": el <li> entero es clicable con un solo enlace
    // estirado. Envolver al botón "Ver" en otro <a> era HTML inválido y rompía
    // la hidratación.
    <li
      className={cn(
        "focus-within:ring-ring relative overflow-hidden rounded-lg border p-3",
        "transition-[transform,background-color,box-shadow] duration-300 ease-out",
        "hover:bg-muted/60 focus-within:ring-2 hover:shadow-sm",
        "motion-safe:focus-within:-translate-y-0.5 motion-safe:hover:-translate-y-0.5"
      )}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="border-border/70 flex w-11 shrink-0 flex-col items-center border-r pr-3 leading-none">
          <span className="text-muted-foreground text-[10px] font-medium tracking-widest uppercase">
            {when.weekday}
          </span>
          <span className="font-display mt-0.5 text-2xl font-bold tabular-nums">
            {when.day}
          </span>
          <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
            {when.month}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div
            aria-label={`Marcador: ${scoreLabel}`}
            className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1"
          >
            {teams.map((team) => {
              const isMine = team.key === item.team;
              return (
                <span className="flex items-baseline gap-1.5" key={team.key}>
                  <span
                    aria-hidden="true"
                    className="size-2 shrink-0 translate-y-[-1px] rounded-full"
                    style={{ backgroundColor: TEAM_COLORS[team.key] }}
                  />
                  <span
                    className={cn(
                      "font-display max-w-32 truncate text-sm tracking-wide uppercase",
                      isMine
                        ? "text-foreground font-bold"
                        : "text-muted-foreground font-medium"
                    )}
                  >
                    {team.name}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-lg leading-none font-black tabular-nums",
                      isMine ? "" : "text-muted-foreground"
                    )}
                  >
                    {team.score}
                  </span>
                </span>
              );
            })}
          </div>

          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span
              className={cn(
                "rounded-sm px-1.5 py-0.5 font-medium",
                OUTCOME_STYLE[result.tone]
              )}
            >
              {result.label}
            </span>
            {mine ? (
              <span className="text-muted-foreground">Jugó en {mine.name}</span>
            ) : null}
            {item.durationSec ? (
              <span className="text-muted-foreground tabular-nums">
                {Math.round(item.durationSec / 60)} min
              </span>
            ) : null}
            {isLatest ? (
              <span className="text-muted-foreground/80 border-muted-foreground/30 rounded-sm border px-1.5 py-0.5 text-[10px] tracking-wide uppercase">
                Último
              </span>
            ) : null}
          </p>
        </div>

        {/* La cifra grande de la fila: es lo que se busca al escanear el
            historial, así que va en el color de texto normal. Teñirla del color
            del equipo era tentador, pero el sky sobre la tarjeta blanca se
            queda en 2.6:1 —por debajo del 3:1 que pide AA hasta para texto
            grande— y el equipo ya lo dicen el punto, el nombre en negrita y la
            línea de "Jugó en". */}
        <div className="flex shrink-0 flex-col items-center leading-none">
          <span className="font-mono text-3xl font-black tabular-nums">
            {item.goals}
          </span>
          <span className="text-muted-foreground mt-1 text-[10px] font-semibold tracking-wide uppercase">
            {plural(item.goals, "gol", "goles")}
          </span>
        </div>
      </div>

      <Link
        className="absolute inset-0 rounded-lg focus-visible:outline-none"
        href={`/matches/${item.matchId}/detail`}
        transitionTypes={["nav-forward"]}
      >
        <span className="sr-only">
          Ver el partido del {formatShortDateOnly(item.playedAt)} ·{" "}
          {goalsLabel(item.goals)}
        </span>
      </Link>
    </li>
  );
};

const GoalStat = ({
  icon,
  label,
  value,
  tone,
}: {
  readonly icon: ReactNode;
  readonly label: string;
  readonly value: string;
  readonly tone: keyof typeof STAT_TONES;
}) => {
  const t = STAT_TONES[tone];
  return (
    // `flex-col` + `mt-auto` en la cifra: "Partidos anotando" parte en dos
    // líneas y las otras tres no, así que con el flujo normal su número caía un
    // renglón más abajo y las cuatro cifras dejaban de estar a plomo. Las
    // celdas de la rejilla ya se estiran a la misma altura; solo faltaba
    // anclar el número al fondo.
    <div className="bg-muted/30 flex h-full flex-col gap-1.5 rounded-lg border p-3">
      {/* El chip va en su propia línea, no al lado del rótulo: con cuatro
          tarjetas en fila el hueco baja a ~90 px, y un rótulo de una sola
          palabra larga («PROMEDIO») no tiene por dónde partirse, así que se
          salía del relleno. En vertical el texto dispone del ancho entero. */}
      <span
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-md [&_svg]:size-4",
          t.chip
        )}
      >
        {icon}
      </span>
      <span className="text-muted-foreground text-xs font-semibold uppercase">
        {label}
      </span>
      <p
        className={cn(
          "mt-auto font-mono text-2xl font-black tabular-nums",
          t.value
        )}
      >
        {value}
      </p>
    </div>
  );
};
