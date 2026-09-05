import { DeleteMatchButton } from "@/components/features/matches/delete-match-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatShortDateOnly } from "@/lib/dates";
import type { MatchWithScorers } from "@/lib/queries";
import { matchTeams, TEAM_COLORS } from "@/lib/teams";
import { cn } from "@/lib/utils";
import { NotebookTabsIcon, PencilIcon } from "lucide-react";
import Link from "next/link";

/** Color del relleno del <progress>, por pseudo-elemento de cada motor. */
function balanceProgressColor(v: number) {
  if (v >= 60) {
    return "[&::-webkit-progress-value]:bg-emerald-500 [&::-moz-progress-bar]:bg-emerald-500";
  }
  if (v >= 40) {
    return "[&::-webkit-progress-value]:bg-amber-500 [&::-moz-progress-bar]:bg-amber-500";
  }
  return "[&::-webkit-progress-value]:bg-rose-500 [&::-moz-progress-bar]:bg-rose-500";
}

export const MatchHistoryCard = ({
  match,
  admin,
}: {
  readonly match: MatchWithScorers;
  readonly admin: boolean;
}) => {
  const teams = matchTeams(match);
  // Con 3+ equipos no hay "local vs visitante": gana quien más goles metió.
  const best = Math.max(...teams.map((t) => t.score));
  const isWinner = (score: number) =>
    score === best && teams.filter((t) => t.score === best).length === 1;
  const goleadores = match.scorers.filter((s) => s.goals > 0);
  const asistentes = match.scorers.filter((s) => s.goals === 0);
  const matchDetailUrl = `/matches/${match.id}/detail`;
  const scoreLabel = teams.map((t) => `${t.name} ${t.score}`).join(", ");

  return (
    // Patrón "stretched link": la tarjeta NO envuelve a sus botones en un <a>
    // (eso anidaba <a> dentro de <a>, HTML inválido que rompía la hidratación y
    // hacía que "Editar" también navegara al detalle). En su lugar un único
    // enlace se estira sobre la tarjeta y las acciones se quedan encima con z-10.
    <Card
      size="sm"
      className="hover:bg-muted focus-within:ring-ring relative transition-colors focus-within:ring-2"
    >
      <CardContent className="relative">
        <div className="flex items-start justify-between gap-2">
          <span className="text-muted-foreground text-xs">
            {formatShortDateOnly(match.playedAt)}
            {match.durationSec
              ? ` · ⏱ ${Math.round(match.durationSec / 60)} min`
              : ""}
          </span>
          <div className="relative z-10 flex shrink-0 items-center gap-2">
            {/* Afordancia visual, no un enlace: toda la tarjeta ya lleva al
                detalle, así que duplicarlo solo añadiría una parada de teclado
                de más al mismo destino. */}
            <span
              aria-hidden="true"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "pointer-events-none hidden md:inline-flex"
              )}
            >
              <NotebookTabsIcon />
              Ver detalles
            </span>
            {admin ? (
              <>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label={`Editar partido del ${formatShortDateOnly(match.playedAt)}`}
                  render={<Link href={`/matches/${match.id}/edit`} />}
                >
                  <PencilIcon />
                </Button>
                <DeleteMatchButton id={match.id} />
              </>
            ) : null}
          </div>
        </div>

        {teams.length === 2 ? (
          <div className="mt-1 flex items-center justify-center gap-4 text-center">
            <span
              className={cn(
                "flex-1 text-right text-sm",
                isWinner(teams[0].score) ? "font-bold" : "text-muted-foreground"
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
                isWinner(teams[1].score) ? "font-bold" : "text-muted-foreground"
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
                    isWinner(team.score) ? "font-bold" : "text-muted-foreground"
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
          <span className="text-muted-foreground text-xs uppercase">
            Balance
          </span>
          {/* <progress> nativo: trae rol, valor y lectura por voz de fábrica.
              El color de la barra se pinta con los pseudo-elementos de cada
              motor porque `background` no llega al relleno. */}
          <progress
            value={match.balance}
            max={100}
            aria-label={`Balance ${match.balance} de 100`}
            className={cn(
              "bg-muted h-1.5 flex-1 appearance-none overflow-hidden rounded-full",
              "[&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-bar]:rounded-full",
              "[&::-moz-progress-bar]:rounded-full [&::-webkit-progress-value]:rounded-full",
              balanceProgressColor(match.balance)
            )}
          />
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
                    className="bg-muted inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs"
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
              <p className="text-muted-foreground text-center text-xs">
                <span className="font-medium">También jugaron:</span>{" "}
                {asistentes.map((s) => s.displayName).join(", ")}
              </p>
            )}
          </div>
        )}

        {match.notes ? (
          <p className="text-muted-foreground mt-2 text-center text-xs italic">
            {match.notes}
          </p>
        ) : null}
      </CardContent>

      {/* Último hijo y posicionado: queda por encima del contenido para el
          clic, y por debajo de las acciones (z-10). Es la única parada de
          teclado de la tarjeta, con el marcador como nombre accesible. */}
      <Link
        href={matchDetailUrl}
        transitionTypes={["nav-forward"]}
        className="absolute inset-0 rounded-xl focus-visible:outline-none"
      >
        <span className="sr-only">
          Ver detalles del partido del {formatShortDateOnly(match.playedAt)} ·{" "}
          {scoreLabel}
        </span>
      </Link>
    </Card>
  );
};
