import type { Match, Player, Scorer } from "@/lib/types";

/**
 * Las cifras de portada, derivadas de lo que ya devuelve la API.
 *
 * Se calculan en el cliente a propósito: son cuatro sumas sobre listas que la
 * app ya tiene descargadas, y un endpoint nuevo solo para esto sería una pieza
 * más que mantener sincronizada con la web.
 */

export interface RetaSummary {
  squad: number;
  avgOverall: number;
  avgAge: number;
  matchesPlayed: number;
  goals: number;
  best: Player | null;
  topScorer: { name: string; goals: number } | null;
}

export function summarize(
  players: Player[] | null,
  matches: Match[] | null
): RetaSummary {
  const squad = players?.length ?? 0;
  const played = matches ?? [];

  return {
    squad,
    avgOverall: average(players, (player) => player.overall),
    avgAge: average(players, (player) => player.age),
    matchesPlayed: played.length,
    goals: played.reduce(
      (total, match) => total + match.scoreA + match.scoreB,
      0
    ),
    // La API ya ordena el roster por overall, así que el primero es el crack.
    best: players?.[0] ?? null,
    topScorer: topScorer(played),
  };
}

function average(players: Player[] | null, pick: (player: Player) => number) {
  if (!players || players.length === 0) return 0;

  const total = players.reduce((sum, player) => sum + pick(player), 0);
  return Math.round(total / players.length);
}

function topScorer(matches: Match[]): RetaSummary["topScorer"] {
  const tally = new Map<string, { name: string; goals: number }>();

  for (const match of matches) {
    for (const scorer of match.scorers) {
      const key = keyOf(scorer);
      const current = tally.get(key);
      if (current) {
        current.goals += scorer.goals;
      } else {
        tally.set(key, { name: scorer.displayName, goals: scorer.goals });
      }
    }
  }

  let leader: { name: string; goals: number } | null = null;
  for (const entry of tally.values()) {
    if (entry.goals > 0 && (leader === null || entry.goals > leader.goals)) {
      leader = entry;
    }
  }

  return leader;
}

/** Los invitados no tienen id, así que se agrupan por nombre. */
function keyOf(scorer: Scorer): string {
  return scorer.playerId === null
    ? `guest:${scorer.displayName}`
    : `player:${scorer.playerId}`;
}
