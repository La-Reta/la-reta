import { topScorers } from "@/lib/series";
import { matchGoals } from "@/lib/teams";
import type { Match, Player } from "@/lib/types";

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
    // Por equipo y no por `scoreA + scoreB`: una reta de tres guarda el
    // tercer marcador aparte, y sumando solo el par se perdían sus goles.
    goals: played.reduce((total, match) => total + matchGoals(match), 0),
    // La API ya ordena el roster por overall, así que el primero es el crack.
    best: players?.[0] ?? null,
    // El líder es la primera fila de la tabla de goleadores; calcularlo
    // aparte era recorrer los mismos partidos dos veces con dos criterios de
    // desempate distintos.
    topScorer: topScorers(played, 1)[0] ?? null,
  };
}

function average(players: Player[] | null, pick: (player: Player) => number) {
  if (!players || players.length === 0) return 0;

  const total = players.reduce((sum, player) => sum + pick(player), 0);
  return Math.round(total / players.length);
}
