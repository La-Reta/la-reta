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
/**
 * Color por equipo — mismo orden en tablero, lista, live y gráficos.
 *
 * En nombres de Tailwind: A sky, B rose, C emerald, D amber, E violet, F teal.
 */
export const TEAM_COLORS: Record<TeamKey, string> = {
  A: "#0ea5e9",
  B: "#f43f5e",
  C: "#22c55e",
  D: "#f59e0b",
  E: "#a855f7",
  F: "#14b8a6",
};

/**
Variante clara del color, para textos sobre el fondo azul del tablero.
*/
/**
 * Variante clara del color, para textos sobre el fondo azul del tablero.
 *
 * Es el escalón 400 de los mismos tonos: sky, rose, green, amber, purple, teal.
 */
export const TEAM_COLORS_LIGHT: Record<TeamKey, string> = {
  A: "#38bdf8",
  B: "#fb7185",
  C: "#4ade80",
  D: "#fbbf24",
  E: "#c084fc",
  F: "#2dd4bf",
};

/**
 * Todos los duelos posibles entre N equipos (2 → 1 duelo, 3 → 3, 4 → 6). Un
 * partido siempre es de dos lados, así que una reta de 3+ se registra como
 * varios partidos: uno por par.
 */
export function pairsOf<T>(teams: T[]): [T, T][] {
  // `flatMap` sobre las entradas evita los índices y sus aserciones: cada
  // pareja sale de dos valores que el propio recorrido ya garantiza.
  return teams.flatMap((home, index) =>
    teams.slice(index + 1).map((away): [T, T] => [home, away])
  );
}
