import type { PlayerComment } from "@/lib/db/schema";
import type { Position, PositionGroup, StatKey } from "@/lib/constants";
import { positionGroup } from "@/lib/constants";

export type Stats = Record<StatKey, number>;

/**
 * Per-group attribute weights used to compute the overall rating.
 * Each row sums to 1. Roughly mirrors how FIFA weights attributes by role.
 */
const WEIGHTS: Record<PositionGroup, Stats> = {
  GK: {
    pace: 0.1,
    shooting: 0.05,
    passing: 0.15,
    dribbling: 0.1,
    defending: 0.3,
    physical: 0.3,
  },
  DEF: {
    pace: 0.15,
    shooting: 0.05,
    passing: 0.15,
    dribbling: 0.1,
    defending: 0.35,
    physical: 0.2,
  },
  MID: {
    pace: 0.12,
    shooting: 0.15,
    passing: 0.25,
    dribbling: 0.23,
    defending: 0.12,
    physical: 0.13,
  },
  FWD: {
    pace: 0.22,
    shooting: 0.3,
    passing: 0.12,
    dribbling: 0.2,
    defending: 0.03,
    physical: 0.13,
  },
};

/**
 * El overall que daría un jugador **en esa línea**, con los pesos de la línea.
 *
 * Existe aparte de `computeOverall` porque los pesos son por línea, no por
 * posición: un mismo jugador puntúa igual de lateral que de central, y pedirlo
 * por línea deja eso a la vista en vez de obligar a elegir una posición
 * cualquiera como representante. Es lo que usa el mapa de posiciones para
 * contestar "¿cómo rendiría este delantero de defensa?".
 */
export function overallForLine(line: PositionGroup, stats: Stats): number {
  const w = WEIGHTS[line];
  const raw =
    stats.pace * w.pace +
    stats.shooting * w.shooting +
    stats.passing * w.passing +
    stats.dribbling * w.dribbling +
    stats.defending * w.defending +
    stats.physical * w.physical;
  return Math.max(1, Math.min(99, Math.round(raw)));
}

/**
Position-weighted overall rating, clamped to 1-99.
*/
export function computeOverall(position: Position, stats: Stats): number {
  return overallForLine(positionGroup(position), stats);
}

export type CardTier = "special" | "gold" | "silver" | "bronze";

// Thresholds calibrated for an amateur "reta" (lower overall levels), so a
// solid player feels gold instead of everyone looking bronze.
export function cardTier(overall: number): CardTier {
  if (overall >= 57) {
    return "special";
  }
  if (overall >= 40) {
    return "gold";
  }
  if (overall >= 26) {
    return "silver";
  }
  return "bronze";
}

export const TIER_LABEL: Record<CardTier, string> = {
  special: "Especial",
  gold: "Oro",
  silver: "Plata",
  bronze: "Bronce",
};

/**
 * Nota media de las reseñas de un jugador, o `null` si nadie ha calificado.
 *
 * Un comentario sin estrellas (`rating` nulo) no entra en el promedio: dejar
 * opinión sin puntuar es válido, y contarlo como un cero hundía la media de
 * quien solo recibió comentarios de texto.
 */
export function averageRating(comments: readonly PlayerComment[]) {
  const rated = comments.filter((c) => c.rating != null);
  if (rated.length === 0) {
    return null;
  }
  const total = rated.reduce((sum, c) => sum + (c.rating ?? 0), 0);
  return { avg: total / rated.length, count: rated.length };
}
