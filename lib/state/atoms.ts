import type { Player } from "@/lib/db/schema";
import { DEFAULT_TEAM_COUNT, type TeamKey } from "@/lib/teams";
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

/**
 * Custom team names for the matchup, persisted so they survive regenerate/reload.
 * Indexado igual que `TEAM_KEYS`: [0] = equipo A, [1] = B, … Vacío = "Equipo X".
 */
export const teamNamesAtom = atomWithStorage<string[]>("reta:team-names", []);

/**
 * Preferencia: volver a repartir los equipos cada vez que se agrega, edita o
 * quita a alguien después de generar. Apagada por default — el tablero se
 * conserva y quien entra tarde se asigna a un equipo a mano (o automático).
 */
export const resetTeamsOnEditAtom = atomWithStorage(
  "reta:reset-on-edit",
  false,
);

/** Cuántos equipos genera "Armar equipos" (2 por default, hasta MAX_TEAMS). */
export const teamCountAtom = atomWithStorage<number>(
  "reta:team-count",
  DEFAULT_TEAM_COUNT,
);

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
  /** Qué equipos de la reta son el lado A y el lado B de este partido. */
  teamAKey?: TeamKey | null;
  teamBKey?: TeamKey | null;
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
  team: TeamKey;
  playerId: number | null;
  at: number;
};

/**
 * El partido en curso. Con 2 equipos es lo de siempre; con 3+ `teams` lleva a
 * todos, `home`/`away` son los que están en la cancha y `queue` los que
 * esperan turno (ver lib/live-rotation.ts).
 */
export type LiveMatchState = {
  active: boolean;
  teams: { key: TeamKey; name: string }[];
  home: TeamKey;
  away: TeamKey;
  queue: TeamKey[];
  startedAt: number | null;
  goals: LiveGoal[];
};

export const EMPTY_LIVE_MATCH: LiveMatchState = {
  active: false,
  teams: [
    { key: "A", name: "Equipo A" },
    { key: "B", name: "Equipo B" },
  ],
  home: "A",
  away: "B",
  queue: [],
  startedAt: null,
  goals: [],
};

/**
 * The in-progress match. Persisted to localStorage so it survives a reload
 * mid-game; cleared once the match is finalized into the registry.
 * ponytail: clave `-v2` — el estado viejo (teamA/teamB planos) simplemente se
 * ignora en vez de migrarlo; a lo mucho se pierde un marcador a medias.
 */
export const liveMatchAtom = atomWithStorage<LiveMatchState>(
  "reta:live-match-v2",
  EMPTY_LIVE_MATCH,
);
