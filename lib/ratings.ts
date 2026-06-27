import {
  positionGroup,
  type Position,
  type PositionGroup,
  type StatKey,
} from "@/lib/constants";

export type Stats = Record<StatKey, number>;

/**
 * Per-group attribute weights used to compute the overall rating.
 * Each row sums to 1. Roughly mirrors how FIFA weights attributes by role.
 */
const WEIGHTS: Record<PositionGroup, Stats> = {
  GK: { pace: 0.1, shooting: 0.05, passing: 0.15, dribbling: 0.1, defending: 0.3, physical: 0.3 },
  DEF: { pace: 0.15, shooting: 0.05, passing: 0.15, dribbling: 0.1, defending: 0.35, physical: 0.2 },
  MID: { pace: 0.12, shooting: 0.15, passing: 0.25, dribbling: 0.23, defending: 0.12, physical: 0.13 },
  FWD: { pace: 0.22, shooting: 0.3, passing: 0.12, dribbling: 0.2, defending: 0.03, physical: 0.13 },
};

/** Position-weighted overall rating, clamped to 1-99. */
export function computeOverall(position: Position, stats: Stats): number {
  const w = WEIGHTS[positionGroup(position)];
  const raw =
    stats.pace * w.pace +
    stats.shooting * w.shooting +
    stats.passing * w.passing +
    stats.dribbling * w.dribbling +
    stats.defending * w.defending +
    stats.physical * w.physical;
  return Math.max(1, Math.min(99, Math.round(raw)));
}

export type CardTier = "special" | "gold" | "silver" | "bronze";

// Thresholds calibrated for an amateur "reta" (lower overall levels), so a
// solid player feels gold instead of everyone looking bronze.
export function cardTier(overall: number): CardTier {
  if (overall >= 57) return "special";
  if (overall >= 40) return "gold";
  if (overall >= 26) return "silver";
  return "bronze";
}

export const TIER_LABEL: Record<CardTier, string> = {
  special: "Especial",
  gold: "Oro",
  silver: "Plata",
  bronze: "Bronce",
};
