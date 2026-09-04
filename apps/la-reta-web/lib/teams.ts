/**
 * Identidad de los equipos de una reta. La app soporta N equipos (default 2):
 * cada equipo es una letra ("A", "B", "C", …) que se usa igual en el generador,
 * en el live, en `generated_reta_players.team` y en `match_goals.team`.
 */
export const TEAM_KEYS = ["A", "B", "C", "D", "E", "F"] as const;
export type TeamKey = (typeof TEAM_KEYS)[number];

export const DEFAULT_TEAM_COUNT = 2;
export const MAX_TEAMS = TEAM_KEYS.length;

/** Las primeras `n` letras, acotadas a [2, MAX_TEAMS]. */
export function teamKeys(n: number): TeamKey[] {
  return TEAM_KEYS.slice(0, Math.max(2, Math.min(MAX_TEAMS, Math.floor(n))));
}

export const isTeamKey = (v: unknown): v is TeamKey =>
  typeof v === "string" && (TEAM_KEYS as readonly string[]).includes(v);

export const defaultTeamName = (key: TeamKey) => `Equipo ${key}`;

/** Color por equipo — mismo orden en tablero, lista, live y gráficos. */
export const TEAM_COLORS: Record<TeamKey, string> = {
  A: "#0ea5e9", // sky
  B: "#f43f5e", // rose
  C: "#22c55e", // emerald
  D: "#f59e0b", // amber
  E: "#a855f7", // violet
  F: "#14b8a6", // teal
};

/** Variante clara del color, para textos sobre el fondo azul del tablero. */
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
  for (let i = 0; i < teams.length; i++)
    for (let j = i + 1; j < teams.length; j++) out.push([teams[i], teams[j]]);
  return out;
}

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
