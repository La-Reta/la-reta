/**
 * Los equipos de una reta, del lado de la web.
 *
 * Las letras, los colores y los duelos viven en `@repo/reta` —la app móvil
 * pinta los mismos—; aquí queda solo lo que necesita la forma de los partidos
 * guardados, que es cosa del esquema de esta app.
 */
export {
  DEFAULT_TEAM_COUNT,
  MAX_TEAMS,
  TEAM_COLORS,
  TEAM_COLORS_LIGHT,
  TEAM_KEYS,
  defaultTeamName,
  isTeamKey,
  pairsOf,
  teamKeys,
  type TeamKey,
} from "@repo/reta/teams";
import {
  TEAM_KEYS,
  defaultTeamName,
  isTeamKey,
  type TeamKey,
} from "@repo/reta/teams";

/** Un equipo dentro de un partido ya registrado, con sus goles. */
export type MatchTeamRow = { key: TeamKey; name: string; score: number };

/**
 * Los equipos de un partido, siempre como lista. Una reta de 3+ equipos guarda
 * el marcador completo en `matches.teams`; los partidos de dos lados (y todos
 * los históricos) se reconstruyen de team_a_name/score_a y su par B.
 */
export function matchTeams(match: {
  teams?: { key: string; name: string; score: number }[] | null;
  teamAName: string;
  teamBName: string;
  scoreA: number;
  scoreB: number;
}): MatchTeamRow[] {
  if (match.teams?.length) {
    return match.teams.map((t) => ({
      key: isTeamKey(t.key) ? t.key : "A",
      name: t.name,
      score: t.score,
    }));
  }
  return [
    { key: "A", name: match.teamAName, score: match.scoreA },
    { key: "B", name: match.teamBName, score: match.scoreB },
  ];
}

/** Nombre efectivo: el que escribió el usuario, o "Equipo X". */
export function teamName(
  names: readonly string[] | undefined,
  key: TeamKey,
): string {
  const idx = TEAM_KEYS.indexOf(key);
  return names?.[idx]?.trim() || defaultTeamName(key);
}
