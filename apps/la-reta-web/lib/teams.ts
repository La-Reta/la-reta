/**
 * Los equipos de una reta, del lado de la web.
 *
 * Las letras, los colores y los duelos viven en `@repo/reta` —la app móvil
 * pinta los mismos—; aquí queda solo lo que necesita la forma de los partidos
 * guardados, que es cosa del esquema de esta app.
 */
import { TEAM_KEYS, defaultTeamName, isTeamKey } from "@repo/reta/teams";
import type { TeamKey } from "@repo/reta/teams";

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

/**
Un equipo dentro de un partido ya registrado, con sus goles.
*/
export interface MatchTeamRow {
  key: TeamKey;
  name: string;
  score: number;
}

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
  const teams = match.teams ?? [];
  if (teams.length > 0) {
    return teams.map((team) => {
      const key = isTeamKey(team.key) ? team.key : "A";

      return { key, name: team.name, score: team.score };
    });
  }

  return [
    { key: "A", name: match.teamAName, score: match.scoreA },
    { key: "B", name: match.teamBName, score: match.scoreB },
  ];
}

/**
Nombre efectivo: el que escribió el usuario, o "Equipo X".
*/
export function teamName(
  names: readonly string[] | undefined,
  key: TeamKey
): string {
  const index = TEAM_KEYS.indexOf(key);
  const name = names?.[index]?.trim();

  // Un nombre en blanco es como no haberlo puesto, así que `??` no basta aquí.
  return name === undefined || name.length === 0 ? defaultTeamName(key) : name;
}
