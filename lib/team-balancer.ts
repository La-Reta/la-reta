import {
  positionGroup,
  type Position,
  type PositionGroup,
} from "@/lib/constants";
import type { Player } from "@/lib/db/schema";
import { playerPositions } from "@/lib/format";

/** A player together with the role they were assigned in this generation. */
export type Lineup = { player: Player; role: Position };

export type BalancedTeams = {
  teamA: Lineup[];
  teamB: Lineup[];
  ratingA: number;
  ratingB: number;
  /** Absolute difference between the two team average ratings. */
  diff: number;
};

type OutfieldGroup = "DEF" | "MID" | "FWD";
const OUTFIELD_GROUPS: OutfieldGroup[] = ["DEF", "MID", "FWD"];
// Lines laid out keeper→striker, so "nearest" line = smallest index distance.
const GROUP_INDEX: Record<PositionGroup, number> = {
  GK: 0,
  DEF: 1,
  MID: 2,
  FWD: 3,
};
// Position shown when a player is flexed into a line they don't naturally play.
const GROUP_ANCHOR: Record<OutfieldGroup, Position> = {
  DEF: "CB",
  MID: "CM",
  FWD: "ST",
};

// Slots per line, ordered center-out: a small line fills the tidy central spots
// first and only widens as it grows. Used to give same-line players distinct
// positions — in fútbol 7 the exact spot is loose, so two natural CBs simply
// split into e.g. CB + RB instead of stacking.
const GROUP_SLOTS: Record<OutfieldGroup, Position[]> = {
  DEF: ["CB", "RB", "LB", "RWB", "LWB"],
  MID: ["CM", "CDM", "CAM", "RM", "LM"],
  FWD: ["ST", "CF", "RW", "LW"],
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function average(lineups: Lineup[]): number {
  if (lineups.length === 0) return 0;
  const sum = lineups.reduce((acc, l) => acc + l.player.overall, 0);
  return Math.round((sum / lineups.length) * 10) / 10;
}

const canKeepGoal = (p: Player) =>
  playerPositions(p).some((pos) => positionGroup(pos) === "GK");

/** A player's outfield positions (primary first), falling back to CM for a pure GK. */
function outfieldPositions(p: Player): Position[] {
  const ps = playerPositions(p).filter((pos) => positionGroup(pos) !== "GK");
  return ps.length ? ps : ["CM"];
}

const primaryGroup = (p: Player): OutfieldGroup =>
  positionGroup(outfieldPositions(p)[0]) as OutfieldGroup;

const playsGroup = (p: Player, g: OutfieldGroup) =>
  outfieldPositions(p).some((pos) => positionGroup(pos) === g);

/**
 * Lays out a team's outfielders so the board reads like a real formation:
 *
 *  1. Everyone starts in their primary line, so a natural 3-2-1 stays 3-2-1.
 *  2. Only a line that gets overcrowded sheds players into the nearest line with
 *     room — preferring movers whose secondary already fits there, then the most
 *     versatile. A player's primary line is otherwise never disturbed.
 *
 * Keeps people closest to their real position and only relocates when full.
 */
function assignRoles(outfielders: Player[]): Lineup[] {
  if (outfielders.length === 0) return [];

  const lines: Record<OutfieldGroup, Player[]> = { DEF: [], MID: [], FWD: [] };
  for (const p of outfielders) lines[primaryGroup(p)].push(p);

  // A line may hold a third more than an even share before it looks crowded;
  // this leaves natural shapes (3-2-1) intact but breaks up 5-6 stacks.
  const cap = Math.max(2, Math.ceil(outfielders.length / 3) + 1);

  for (let guard = 0; guard < 100; guard++) {
    const over = OUTFIELD_GROUPS.find((g) => lines[g].length > cap);
    if (!over) break;

    const target = OUTFIELD_GROUPS.filter(
      (g) => g !== over && lines[g].length < cap,
    ).sort(
      (a, b) =>
        Math.abs(GROUP_INDEX[a] - GROUP_INDEX[over]) -
          Math.abs(GROUP_INDEX[b] - GROUP_INDEX[over]) ||
        lines[a].length - lines[b].length,
    )[0];
    if (!target) break; // every other line is full too; leave it.

    // Move the best-fitting player: one who already plays the target line, then
    // the most versatile, then the weakest (keep stronger players in their slot).
    const mover = [...lines[over]].sort((a, b) => {
      const fitA = playsGroup(a, target) ? 0 : 1;
      const fitB = playsGroup(b, target) ? 0 : 1;
      const optsA = new Set(outfieldPositions(a).map(positionGroup)).size;
      const optsB = new Set(outfieldPositions(b).map(positionGroup)).size;
      return fitA - fitB || optsB - optsA || a.overall - b.overall;
    })[0];

    lines[over] = lines[over].filter((p) => p !== mover);
    lines[target].push(mover);
  }

  const result: Lineup[] = [];
  for (const g of OUTFIELD_GROUPS) {
    const slots = GROUP_SLOTS[g];
    const used = new Set<Position>();
    const pending: Player[] = [];

    // Pass 1 (shuffled): let a player keep one of their own positions when it's
    // still free. Shuffling means when two share a position, which one keeps it
    // varies per generation instead of always the same player.
    for (const p of shuffle(lines[g])) {
      const own = outfieldPositions(p).find(
        (pos) => positionGroup(pos) === g && !used.has(pos),
      );
      if (own) {
        used.add(own);
        result.push({ player: p, role: own });
      } else {
        pending.push(p);
      }
    }

    // Pass 2: everyone left (duplicates / pure flexers) takes the next free
    // center-out slot, so no two players in a line share the same spot. If a
    // line somehow outgrows its slots, fall back to the anchor.
    for (const p of pending) {
      const free = slots.find((s) => !used.has(s));
      if (free) used.add(free);
      result.push({ player: p, role: free ?? GROUP_ANCHOR[g] });
    }
  }
  return result;
}

/**
 * Splits the selected players into two teams of similar strength.
 *
 *  1. One goalkeeper per team is picked from the GK-capable players. The pick is
 *     shuffled, so a dual-position player (e.g. GK/CB) lands in goal on some
 *     generations and plays out on others — regenerating gives real variety.
 *  2. Everyone else is sorted strongest-first (ties shuffled) and greedily
 *     assigned to the lighter team, keeping squad sizes and totals even.
 *  3. Each team's outfielders are then spread across the lines by position so
 *     the board reads like a real formation (see `assignRoles`).
 */
/**
 * Label-agnostic fingerprint of a split: each side's player ids sorted and
 * joined with ",", both sides sorted and joined with "|". The same matchup
 * with A/B swapped produces the same signature.
 */
export function splitSignature(aIds: number[], bIds: number[]): string {
  const side = (ids: number[]) => [...ids].sort((x, y) => x - y).join(",");
  return [side(aIds), side(bIds)].sort().join("|");
}

export function lineupSignature(teamA: Lineup[], teamB: Lineup[]): string {
  return splitSignature(
    teamA.map((l) => l.player.id),
    teamB.map((l) => l.player.id),
  );
}

/** Unordered same-team pairs ("3-7") of a side, for overlap scoring. */
function sidePairs(ids: number[]): string[] {
  const sorted = [...ids].sort((x, y) => x - y);
  const out: string[] = [];
  for (let i = 0; i < sorted.length; i++)
    for (let j = i + 1; j < sorted.length; j++)
      out.push(`${sorted[i]}-${sorted[j]}`);
  return out;
}

/** A previously generated split, as stored in `generated_reta_players`. */
export type RecentSplit = { teamAIds: number[]; teamBIds: number[] };

/**
 * Like `balanceTeams`, but among several balanced candidates prefers the one
 * that repeats recent history the least — teams stay parejos without being
 * the same split every time.
 */
export function balanceTeamsVaried(
  selected: Player[],
  recent: RecentSplit[],
  attempts = 12,
): BalancedTeams {
  if (recent.length === 0) return balanceTeams(selected);

  const recentSignatures = new Set(
    recent.map((r) => splitSignature(r.teamAIds, r.teamBIds)),
  );
  const recentPairs = new Set(
    recent.flatMap((r) => [...sidePairs(r.teamAIds), ...sidePairs(r.teamBIds)]),
  );

  let best: BalancedTeams | null = null;
  let bestScore = Infinity;
  for (let i = 0; i < attempts; i++) {
    const candidate = balanceTeams(selected);
    const aIds = candidate.teamA.map((l) => l.player.id);
    const bIds = candidate.teamB.map((l) => l.player.id);
    const pairs = [...sidePairs(aIds), ...sidePairs(bIds)];
    const overlap = pairs.length
      ? pairs.filter((p) => recentPairs.has(p)).length / pairs.length
      : 0;
    // ponytail: heurística lineal — un split idéntico "cuesta" 3 pts de OVR y
    // repetir todas las parejas otros 3; sube los pesos si sigue saliendo igual.
    const score =
      candidate.diff +
      (recentSignatures.has(splitSignature(aIds, bIds)) ? 3 : 0) +
      overlap * 3;
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best ?? balanceTeams(selected);
}

/**
 * Swap two players between their slots by id, keeping each slot's `role` (so the
 * board layout stays put and only the occupants trade places). Ratings are
 * recomputed — a cross-team swap shifts them, a same-team swap leaves them
 * unchanged. No-op if the ids match or either isn't found. Returns a new object
 * (fresh Lineup copies) so React state updates cleanly.
 */
export function swapPlayers(
  teams: BalancedTeams,
  fromId: number,
  toId: number,
): BalancedTeams {
  if (fromId === toId) return teams;
  const teamA = teams.teamA.map((l) => ({ ...l }));
  const teamB = teams.teamB.map((l) => ({ ...l }));
  const from = [...teamA, ...teamB].find((l) => l.player.id === fromId);
  const to = [...teamA, ...teamB].find((l) => l.player.id === toId);
  if (!from || !to) return teams;
  [from.player, to.player] = [to.player, from.player];

  const ratingA = average(teamA);
  const ratingB = average(teamB);
  return {
    teamA,
    teamB,
    ratingA,
    ratingB,
    diff: Math.round(Math.abs(ratingA - ratingB) * 10) / 10,
  };
}

export function balanceTeams(selected: Player[]): BalancedTeams {
  const gkA: Lineup[] = [];
  const gkB: Lineup[] = [];
  const membersA: Player[] = [];
  const membersB: Player[] = [];
  let sumA = 0;
  let sumB = 0;

  const keepers = shuffle(selected.filter(canKeepGoal));
  const assignedAsGK = new Set<number>();
  if (keepers[0]) {
    gkA.push({ player: keepers[0], role: "GK" });
    sumA += keepers[0].overall;
    assignedAsGK.add(keepers[0].id);
  }
  if (keepers[1]) {
    gkB.push({ player: keepers[1], role: "GK" });
    sumB += keepers[1].overall;
    assignedAsGK.add(keepers[1].id);
  }

  const outfield = shuffle(
    selected.filter((p) => !assignedAsGK.has(p.id)),
  ).sort((a, b) => b.overall - a.overall);

  for (const player of outfield) {
    const lenA = membersA.length + gkA.length;
    const lenB = membersB.length + gkB.length;
    const aLighter = lenA < lenB || (lenA === lenB && sumA <= sumB);
    if (aLighter) {
      membersA.push(player);
      sumA += player.overall;
    } else {
      membersB.push(player);
      sumB += player.overall;
    }
  }

  const teamA = [...gkA, ...assignRoles(membersA)];
  const teamB = [...gkB, ...assignRoles(membersB)];

  const ratingA = average(teamA);
  const ratingB = average(teamB);

  return {
    teamA,
    teamB,
    ratingA,
    ratingB,
    diff: Math.round(Math.abs(ratingA - ratingB) * 10) / 10,
  };
}

// self-check (npx tsx lib/team-balancer.ts)
export function demo() {
  const assert = (c: boolean, m: string) => {
    if (!c) throw new Error("team-balancer demo failed: " + m);
  };
  const L = (id: number, overall: number, role: Position): Lineup => ({
    player: { id, overall } as unknown as Player,
    role,
  });
  const teams: BalancedTeams = {
    teamA: [L(1, 40, "GK"), L(2, 50, "CB")],
    teamB: [L(3, 60, "GK"), L(4, 80, "ST")],
    ratingA: 45,
    ratingB: 70,
    diff: 25,
  };

  // Cross-team swap: occupant trades, role stays, ratings recomputed.
  const s = swapPlayers(teams, 2, 4);
  assert(
    s.teamA[1].player.id === 4 && s.teamA[1].role === "CB",
    "occupant swaps, role kept",
  );
  assert(
    s.teamB[1].player.id === 2 && s.teamB[1].role === "ST",
    "other side mirrored",
  );
  assert(s.ratingA === 60 && s.ratingB === 55, "ratings recomputed");
  assert(teams.teamA[1].player.id === 2, "original not mutated");
  // Same-team swap leaves ratings untouched.
  const same = swapPlayers(teams, 1, 2);
  assert(same.ratingA === 45, "same-team swap keeps rating");
  // No-ops.
  assert(swapPlayers(teams, 2, 2) === teams, "same id is no-op");
  assert(swapPlayers(teams, 2, 999) === teams, "missing id is no-op");
  return "ok";
}

if (process.argv[1]?.endsWith("team-balancer.ts")) console.log(demo());
