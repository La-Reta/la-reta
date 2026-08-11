import {
  positionGroup,
  type Position,
  type PositionGroup,
} from "@/lib/constants";
import type { Player } from "@/lib/db/schema";
import { playerPositions } from "@/lib/format";
import { DEFAULT_TEAM_COUNT, teamKeys, type TeamKey } from "@/lib/teams";

/** A player together with the role they were assigned in this generation. */
export type Lineup = { player: Player; role: Position };

/** One generated team: its letter, its lineups and its average OVR. */
export type TeamSplit = { key: TeamKey; lineups: Lineup[]; rating: number };

export type BalancedTeams = {
  teams: TeamSplit[];
  /** Spread between the strongest and the weakest team average. */
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

const meanOverall = (ps: Player[]) =>
  ps.length ? ps.reduce((a, p) => a + p.overall, 0) / ps.length : 0;

/** max − min of the team averages: 0 = todos parejos. */
function spread(groups: Player[][]): number {
  const avgs = groups.map(meanOverall);
  return Math.max(...avgs) - Math.min(...avgs);
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
 * Label-agnostic fingerprint of a split: each side's player ids sorted and
 * joined with ",", the sides themselves sorted and joined with "|". The same
 * matchup with the team letters permuted produces the same signature — y para
 * 2 equipos da exactamente la misma cadena que la versión anterior, así que las
 * firmas ya guardadas en la BD siguen siendo comparables.
 */
export function splitSignature(sides: number[][]): string {
  return sides
    .map((ids) => [...ids].sort((x, y) => x - y).join(","))
    .sort()
    .join("|");
}

export function lineupSignature(teams: TeamSplit[]): string {
  return splitSignature(teams.map((t) => t.lineups.map((l) => l.player.id)));
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
export type RecentSplit = { sides: number[][] };

/**
 * Like `balanceTeams`, but among several balanced candidates prefers the one
 * that repeats recent history the least — teams stay parejos without being
 * the same split every time.
 */
export function balanceTeamsVaried(
  selected: Player[],
  recent: RecentSplit[],
  teamCount = DEFAULT_TEAM_COUNT,
  attempts = 12,
): BalancedTeams {
  if (recent.length === 0) return balanceTeams(selected, teamCount);

  const recentSignatures = new Set(recent.map((r) => splitSignature(r.sides)));
  const recentPairs = new Set(
    recent.flatMap((r) => r.sides.flatMap((ids) => sidePairs(ids))),
  );

  let best: BalancedTeams | null = null;
  let bestScore = Infinity;
  for (let i = 0; i < attempts; i++) {
    const candidate = balanceTeams(selected, teamCount);
    const sides = candidate.teams.map((t) => t.lineups.map((l) => l.player.id));
    const pairs = sides.flatMap((ids) => sidePairs(ids));
    const overlap = pairs.length
      ? pairs.filter((p) => recentPairs.has(p)).length / pairs.length
      : 0;
    // ponytail: heurística lineal — un split idéntico "cuesta" 3 pts de OVR y
    // repetir todas las parejas otros 3; sube los pesos si sigue saliendo igual.
    const score =
      candidate.diff +
      (recentSignatures.has(splitSignature(sides)) ? 3 : 0) +
      overlap * 3;
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best ?? balanceTeams(selected, teamCount);
}

/** Recomputes ratings + diff from the current occupants of each team. */
function withRatings(teams: { key: TeamKey; lineups: Lineup[] }[]) {
  const rated = teams.map((t) => ({ ...t, rating: average(t.lineups) }));
  const ratings = rated.map((t) => t.rating);
  return {
    teams: rated,
    diff:
      Math.round((Math.max(...ratings) - Math.min(...ratings)) * 10) / 10 || 0,
  };
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
  const next = teams.teams.map((t) => ({
    key: t.key,
    lineups: t.lineups.map((l) => ({ ...l })),
  }));
  const all = next.flatMap((t) => t.lineups);
  const from = all.find((l) => l.player.id === fromId);
  const to = all.find((l) => l.player.id === toId);
  if (!from || !to) return teams;
  [from.player, to.player] = [to.player, from.player];
  return withRatings(next);
}

/**
 * Splits the selected players into `teamCount` teams of similar strength.
 *
 *  1. One goalkeeper per team is picked from the GK-capable players. The pick is
 *     shuffled, so a dual-position player (e.g. GK/CB) lands in goal on some
 *     generations and plays out on others — regenerating gives real variety.
 *  2. Everyone else is sorted strongest-first (ties shuffled) and greedily
 *     assigned to the lightest team, keeping squad sizes and totals even.
 *  3. A local-search pass then trades outfielders between the strongest and the
 *     weakest team while that closes the gap (sizes never change, so it can't
 *     unbalance the squads).
 *  4. Each team's outfielders are finally spread across the lines by position so
 *     the board reads like a real formation (see `assignRoles`).
 */
export function balanceTeams(
  selected: Player[],
  teamCount = DEFAULT_TEAM_COUNT,
): BalancedTeams {
  // Never más equipos que jugadores: un equipo vacío no es una reta.
  const keys = teamKeys(Math.min(teamCount, Math.max(2, selected.length)));
  const n = keys.length;

  const gks: (Player | null)[] = Array.from({ length: n }, () => null);
  const members: Player[][] = Array.from({ length: n }, () => []);

  const keepers = shuffle(selected.filter(canKeepGoal));
  const assignedAsGK = new Set<number>();
  keepers.slice(0, n).forEach((keeper, i) => {
    gks[i] = keeper;
    assignedAsGK.add(keeper.id);
  });

  const outfield = shuffle(
    selected.filter((p) => !assignedAsGK.has(p.id)),
  ).sort((a, b) => b.overall - a.overall);

  const size = (i: number) => members[i].length + (gks[i] ? 1 : 0);
  const total = (i: number) =>
    members[i].reduce((a, p) => a + p.overall, 0) + (gks[i]?.overall ?? 0);

  for (const player of outfield) {
    let best = 0;
    for (let i = 1; i < n; i++) {
      if (
        size(i) < size(best) ||
        (size(i) === size(best) && total(i) < total(best))
      )
        best = i;
    }
    members[best].push(player);
  }

  refine(members, gks);

  return withRatings(
    keys.map((key, i) => ({
      key,
      lineups: [
        ...(gks[i] ? [{ player: gks[i]!, role: "GK" as Position }] : []),
        ...assignRoles(members[i]),
      ],
    })),
  );
}

/**
 * Local search: repeatedly trade one outfielder between the strongest and the
 * weakest team when that shrinks the overall spread. Sizes are preserved, so
 * only the averages move. Greedy alone leaves 1–3 pts on the table; this closes
 * most of it in a handful of passes.
 *
 * ponytail: solo mira el par (más fuerte, más débil). Con muchos equipos podría
 * quedar un intercambio útil entre dos equipos intermedios; pasar a todos los
 * pares si algún día importa (es O(T²·P²), sigue siendo barato).
 */
function refine(members: Player[][], gks: (Player | null)[]) {
  const squad = (i: number) =>
    [...members[i], ...(gks[i] ? [gks[i]!] : [])] as Player[];

  for (let pass = 0; pass < 60; pass++) {
    const avgs = members.map((_, i) => meanOverall(squad(i)));
    let hi = 0;
    let lo = 0;
    avgs.forEach((a, i) => {
      if (a > avgs[hi]) hi = i;
      if (a < avgs[lo]) lo = i;
    });
    if (hi === lo) return;

    const base = spread(members.map((_, i) => squad(i)));
    let bestGain = 0;
    let bestSwap: [number, number] | null = null;

    for (let a = 0; a < members[hi].length; a++) {
      for (let b = 0; b < members[lo].length; b++) {
        // Solo tiene sentido mandar al débil a alguien mejor.
        if (members[hi][a].overall <= members[lo][b].overall) continue;
        const swapped = members.map((m, i) =>
          i === hi
            ? m.map((p, k) => (k === a ? members[lo][b] : p))
            : i === lo
              ? m.map((p, k) => (k === b ? members[hi][a] : p))
              : m,
        );
        const gain =
          base -
          spread(swapped.map((m, i) => [...m, ...(gks[i] ? [gks[i]!] : [])]));
        if (gain > bestGain + 1e-9) {
          bestGain = gain;
          bestSwap = [a, b];
        }
      }
    }

    if (!bestSwap) return;
    const [a, b] = bestSwap;
    const tmp = members[hi][a];
    members[hi][a] = members[lo][b];
    members[lo][b] = tmp;
  }
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
    teams: [
      { key: "A", lineups: [L(1, 40, "GK"), L(2, 50, "CB")], rating: 45 },
      { key: "B", lineups: [L(3, 60, "GK"), L(4, 80, "ST")], rating: 70 },
    ],
    diff: 25,
  };

  // Cross-team swap: occupant trades, role stays, ratings recomputed.
  const s = swapPlayers(teams, 2, 4);
  assert(
    s.teams[0].lineups[1].player.id === 4 &&
      s.teams[0].lineups[1].role === "CB",
    "occupant swaps, role kept",
  );
  assert(
    s.teams[1].lineups[1].player.id === 2 &&
      s.teams[1].lineups[1].role === "ST",
    "other side mirrored",
  );
  assert(
    s.teams[0].rating === 60 && s.teams[1].rating === 55,
    "ratings recomputed",
  );
  assert(teams.teams[0].lineups[1].player.id === 2, "original not mutated");
  // Same-team swap leaves ratings untouched.
  assert(
    swapPlayers(teams, 1, 2).teams[0].rating === 45,
    "same-team swap keeps rating",
  );
  // No-ops.
  assert(swapPlayers(teams, 2, 2) === teams, "same id is no-op");
  assert(swapPlayers(teams, 2, 999) === teams, "missing id is no-op");

  // Signature is permutation-agnostic and matches the old 2-side format.
  assert(
    splitSignature([
      [2, 1],
      [4, 3],
    ]) === "1,2|3,4",
    "signature sorted",
  );
  assert(
    splitSignature([
      [3, 4],
      [1, 2],
    ]) ===
      splitSignature([
        [1, 2],
        [3, 4],
      ]),
    "signature ignores team labels",
  );

  // N equipos: reparto parejo en tamaño y nivel.
  const pool: Player[] = Array.from({ length: 18 }, (_, i) => ({
    id: i + 1,
    name: `P${i + 1}`,
    displayName: `P${i + 1}`,
    overall: 50 + ((i * 7) % 40),
    position: i % 6 === 0 ? "GK" : "CM",
    position2: null,
  })) as unknown as Player[];

  for (const count of [2, 3, 4]) {
    const res = balanceTeams(pool, count);
    assert(res.teams.length === count, `${count} equipos generados`);
    const sizes = res.teams.map((t) => t.lineups.length);
    assert(
      Math.max(...sizes) - Math.min(...sizes) <= 1,
      `${count}: tamaños parejos`,
    );
    assert(
      res.teams.flatMap((t) => t.lineups).length === pool.length,
      `${count}: nadie se pierde ni se duplica`,
    );
    assert(res.diff <= 4, `${count}: diff razonable (${res.diff})`);
    const gkTeams = res.teams.filter((t) =>
      t.lineups.some((l) => l.role === "GK"),
    ).length;
    assert(gkTeams === Math.min(count, 3), `${count}: un portero por equipo`);
  }

  // Con menos jugadores que equipos pedidos, nunca deja un equipo vacío.
  assert(
    balanceTeams(pool.slice(0, 3), 6).teams.length === 3,
    "acota por jugadores",
  );

  return "ok";
}

if (process.argv[1]?.endsWith("team-balancer.ts")) console.log(demo());
