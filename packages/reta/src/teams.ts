/**
 * Identidad de los equipos de una reta.
 *
 * Cada equipo es una letra ("A", "B", "C", …) y esa letra es la misma en el
 * generador, en el marcador en vivo, en `generated_reta_players.team` y en
 * `match_goals.team`. El color también: si en la web el equipo C es verde, en
 * la app también, o el mismo partido contado en dos pantallas parecería otro.
 */

export const TEAM_KEYS = ["A", "B", "C", "D", "E", "F"] as const;
export type TeamKey = (typeof TEAM_KEYS)[number];

export const DEFAULT_TEAM_COUNT = 2;
export const MAX_TEAMS = TEAM_KEYS.length;

/**
Las primeras `n` letras, acotadas a [2, MAX_TEAMS].
*/
export function teamKeys(n: number): TeamKey[] {
  return TEAM_KEYS.slice(0, Math.max(2, Math.min(MAX_TEAMS, Math.floor(n))));
}

export const isTeamKey = (value: unknown): value is TeamKey =>
  typeof value === "string" && (TEAM_KEYS as readonly string[]).includes(value);

export const defaultTeamName = (key: TeamKey) => `Equipo ${key}`;

/**
Color por equipo — mismo orden en tablero, lista, live y gráficos.
*/
export const TEAM_COLORS: Record<TeamKey, string> = {
  A: "#0ea5e9", // sky
  B: "#f43f5e", // rose
  C: "#22c55e", // emerald
  D: "#f59e0b", // amber
  E: "#a855f7", // violet
  F: "#14b8a6", // teal
};

/**
Variante clara del color, para textos sobre el fondo azul del tablero.
*/
export const TEAM_COLORS_LIGHT: Record<TeamKey, string> = {
  A: "#38bdf8", // sky-400
  B: "#fb7185", // rose-400
  C: "#4ade80", // green-400
  D: "#fbbf24", // amber-400
  E: "#c084fc", // purple-400
  F: "#2dd4bf", // teal-400
};

/**
 * Todos los duelos posibles entre N equipos (2 → 1 duelo, 3 → 3, 4 → 6). Un
 * partido siempre es de dos lados, así que una reta de 3+ se registra como
 * varios partidos: uno por par.
 */
export function pairsOf<T>(teams: T[]): [T, T][] {
  const out: [T, T][] = [];
  for (let index = 0; index < teams.length; index++) {
    for (let index_ = index + 1; index_ < teams.length; index_++) {
      out.push([teams[index] as T, teams[index_] as T]);
    }
  }
  return out;
}
