import { positionGroup, type Position } from "@/lib/constants";
import { playerPositions } from "@/lib/format";
import type { Player } from "@/lib/db/schema";

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

/** When fielded outfield, prefer a non-GK position over the GK one. */
const outfieldRole = (p: Player): Position =>
  playerPositions(p).find((pos) => positionGroup(pos) !== "GK") ?? p.position;

/**
 * Splits the selected players into two teams of similar strength.
 *
 *  1. One goalkeeper per team is picked from the GK-capable players. The pick is
 *     shuffled, so a dual-position player (e.g. GK/CB) lands in goal on some
 *     generations and plays out on others — regenerating gives real variety.
 *  2. Everyone else is sorted strongest-first (ties shuffled) and greedily
 *     assigned to the lighter team, keeping squad sizes and totals even.
 *
 * Each player carries the `role` they were given so the UI can show whether a
 * flexible player ended up as keeper or outfielder this time.
 */
export function balanceTeams(selected: Player[]): BalancedTeams {
  const teamA: Lineup[] = [];
  const teamB: Lineup[] = [];
  let sumA = 0;
  let sumB = 0;

  const keepers = shuffle(selected.filter(canKeepGoal));
  const assignedAsGK = new Set<number>();
  if (keepers[0]) {
    teamA.push({ player: keepers[0], role: "GK" });
    sumA += keepers[0].overall;
    assignedAsGK.add(keepers[0].id);
  }
  if (keepers[1]) {
    teamB.push({ player: keepers[1], role: "GK" });
    sumB += keepers[1].overall;
    assignedAsGK.add(keepers[1].id);
  }

  const outfield = shuffle(
    selected.filter((p) => !assignedAsGK.has(p.id)),
  ).sort((a, b) => b.overall - a.overall);

  for (const player of outfield) {
    const aLighter =
      teamA.length < teamB.length ||
      (teamA.length === teamB.length && sumA <= sumB);
    const lineup: Lineup = { player, role: outfieldRole(player) };
    if (aLighter) {
      teamA.push(lineup);
      sumA += player.overall;
    } else {
      teamB.push(lineup);
      sumB += player.overall;
    }
  }

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
