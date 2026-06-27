import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

/**
 * IDs of players currently picked for the "armar equipos" pool.
 * Persisted to localStorage so the selection survives navigation/reloads.
 */
export const selectedIdsAtom = atomWithStorage<number[]>(
  "reta:selected-players",
  [],
);

/** Convenience writer to toggle a single player in/out of the pool. */
export const toggleSelectedAtom = atom(null, (get, set, id: number) => {
  const current = get(selectedIdsAtom);
  set(
    selectedIdsAtom,
    current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id],
  );
});

// ── Live match ─────────────────────────────────────────────────────────────
/** A single goal: which team, who scored (optional), and when (epoch ms). */
export type LiveGoal = {
  id: string;
  team: "A" | "B";
  playerId: number | null;
  at: number;
};

export type LiveMatchState = {
  active: boolean;
  teamA: string;
  teamB: string;
  startedAt: number | null;
  goals: LiveGoal[];
};

export const EMPTY_LIVE_MATCH: LiveMatchState = {
  active: false,
  teamA: "Equipo A",
  teamB: "Equipo B",
  startedAt: null,
  goals: [],
};

/**
 * The in-progress match. Persisted to localStorage so it survives a reload
 * mid-game; cleared once the match is finalized into the registry.
 */
export const liveMatchAtom = atomWithStorage<LiveMatchState>(
  "reta:live-match",
  EMPTY_LIVE_MATCH,
);
