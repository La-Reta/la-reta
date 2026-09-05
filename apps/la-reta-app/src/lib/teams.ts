import type { Match, MatchTeam } from "@/lib/types";

/**
 * Identidad de los equipos de una reta, portada de apps/la-reta-web/lib/teams.ts.
 *
 * Cada equipo es una letra y su color es el mismo en los dos clientes: si en la
 * web el equipo C es verde, aquí también, o el mismo partido contado en dos
 * pantallas parecería otro.
 */

export const TEAM_KEYS = ["A", "B", "C", "D", "E", "F"] as const;
export type TeamKey = (typeof TEAM_KEYS)[number];

export const TEAM_COLORS: Record<TeamKey, string> = {
  A: "#0EA5E9",
  B: "#F43F5E",
  C: "#22C55E",
  D: "#F59E0B",
  E: "#A855F7",
  F: "#14B8A6",
};

export function isTeamKey(value: unknown): value is TeamKey {
  return (
    typeof value === "string" &&
    (TEAM_KEYS as readonly string[]).includes(value)
  );
}

export function teamColor(key: string): string {
  return isTeamKey(key) ? TEAM_COLORS[key] : TEAM_COLORS.A;
}

/**
 * Los equipos de un partido, siempre como lista.
 *
 * Una reta de 3+ equipos guarda el marcador completo en `teams`; los partidos
 * de dos lados —la mayoría, y todos los viejos— se reconstruyen de
 * `teamAName`/`scoreA` y su par B. Cualquier vista nueva debe usar esto en vez
 * de leer `scoreA`/`scoreB` a pelo, o se perderá el tercer equipo.
 */
export function matchTeams(match: Match): MatchTeam[] {
  if (match.teams?.length) {
    return match.teams.map((team) => ({
      key: isTeamKey(team.key) ? team.key : "A",
      name: team.name,
      score: team.score,
    }));
  }

  return [
    { key: "A", name: match.teamAName, score: match.scoreA },
    { key: "B", name: match.teamBName, score: match.scoreB },
  ];
}

/** Cómo de pareja estuvo, en palabras. `balance` va de 0 a 100. */
export function balanceLabel(balance: number): string {
  if (balance < 30) return "Paliza";
  if (balance < 55) return "Desigual";
  if (balance < 80) return "Pareja";
  return "Parejísima";
}
