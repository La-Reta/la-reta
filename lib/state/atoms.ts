import type { Player } from "@/lib/db/schema";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

/**
 * Guest ("de última hora") players added on the fly for a team generation.
 * Client-only (never in the DB `players` table), persisted so they survive a
 * reload mid-reta. Negative ids (see lib/guests.ts) keep them apart from roster.
 */
export const guestsAtom = atomWithStorage<Player[]>("reta:guests", []);

/**
 * IDs of players currently picked for the "armar equipos" pool.
 * Persisted to localStorage so the selection survives navigation/reloads.
 */
export const selectedIdsAtom = atomWithStorage<number[]>(
  "reta:selected-players",
  [],
);

/** Custom team names for the matchup, persisted so they survive regenerate/reload. */
export const teamNameAAtom = atomWithStorage("reta:team-name-a", "");
export const teamNameBAtom = atomWithStorage("reta:team-name-b", "");

/**
 * Id of the last generated reta saved to the DB. Persisted so the live flow can
 * link the finalized match back to that generation (goals per generated team).
 */
export const currentGeneratedRetaIdAtom = atomWithStorage<number | null>(
  "reta:current-generated-reta",
  null,
);

/**
 * A past generated reta handed off from /teams/registro to the match form so it
 * can be registered as a real match. MatchForm reads it once on mount (prefilling
 * team names + attendance, guests included) and then clears it — nothing is
 * submitted automatically. Persisted so it survives the navigation to /matches.
 */
export type MatchPrefill = {
  teamAName: string;
  teamBName: string;
  playedAt?: string;
  generatedRetaId?: number | null;
  scorers: {
    playerId: number | null;
    guestName?: string;
    team: "A" | "B" | null;
    goals: number;
  }[];
};
export const matchPrefillAtom = atomWithStorage<MatchPrefill | null>(
  "reta:match-prefill",
  null,
);

/** Convenience writer to toggle a single player in/out of the pool. */
export const toggleSelectedAtom = atom(null, (get, set, id: number) => {
  const current = get(selectedIdsAtom);
  set(
    selectedIdsAtom,
    current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
  );
});

// Live match
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
