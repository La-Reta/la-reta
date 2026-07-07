import type { GeneratedRetaWithPlayers } from "@/lib/queries";

export type PairStat = { key: string; a: string; b: string; count: number };
export type MatchupStat = {
  retaId: number;
  count: number;
  teamA: string[];
  teamB: string[];
};
export type PlayerStat = { playerId: number; name: string; count: number };
export type DayStat = { date: string; count: number };

export type RetaStats = {
  total: number;
  unique: number;
  repeated: number;
  repetitionRate: number; // 0–100
  avgDiff: number;
  topPairs: PairStat[];
  repeatedMatchups: MatchupStat[];
  topPlayers: PlayerStat[];
  perDay: DayStat[];
};

/** Unordered same-team pairs of one side, keyed by sorted ids. */
function sidePairs(side: { playerId: number; name: string }[]): PairStat[] {
  const sorted = [...side].sort((x, y) => x.playerId - y.playerId);
  const out: PairStat[] = [];
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      out.push({
        key: `${sorted[i].playerId}-${sorted[j].playerId}`,
        a: sorted[i].name,
        b: sorted[j].name,
        count: 1,
      });
    }
  }
  return out;
}

function dayKey(createdAt: Date | string): string {
  return typeof createdAt === "string"
    ? createdAt.slice(0, 10)
    : new Date(createdAt).toISOString().slice(0, 10);
}

/**
 * Aggregates generated retas into the measurements shown on the registro view:
 * repetition of splits, most frequent same-team duos, most convened players and
 * generations over time. Pure — no DB, so it's cheap to unit-check.
 */
export function computeRetaStats(
  retas: GeneratedRetaWithPlayers[],
): RetaStats {
  const total = retas.length;

  const sigCount = new Map<string, number>();
  const pairs = new Map<string, PairStat>();
  const players = new Map<number, PlayerStat>();
  const perDayMap = new Map<string, number>();
  let diffSum = 0;

  for (const reta of retas) {
    sigCount.set(reta.signature, (sigCount.get(reta.signature) ?? 0) + 1);
    diffSum += reta.diff;

    const day = dayKey(reta.createdAt);
    perDayMap.set(day, (perDayMap.get(day) ?? 0) + 1);

    const sideA = reta.players.filter((p) => p.team === "A");
    const sideB = reta.players.filter((p) => p.team === "B");
    for (const p of [...sideA, ...sideB]) {
      const cur = players.get(p.playerId) ?? {
        playerId: p.playerId,
        name: p.name,
        count: 0,
      };
      cur.count += 1;
      players.set(p.playerId, cur);
    }
    for (const p of [...sidePairs(sideA), ...sidePairs(sideB)]) {
      const cur = pairs.get(p.key) ?? { ...p, count: 0 };
      cur.count += 1;
      pairs.set(p.key, cur);
    }
  }

  const unique = sigCount.size;
  const repeated = total - unique;

  const repeatedMatchups: MatchupStat[] = [...sigCount.entries()]
    .filter(([, c]) => c > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([sig, count]) => {
      const sample = retas.find((r) => r.signature === sig)!;
      return {
        retaId: sample.id,
        count,
        teamA: sample.players.filter((p) => p.team === "A").map((p) => p.name),
        teamB: sample.players.filter((p) => p.team === "B").map((p) => p.name),
      };
    });

  return {
    total,
    unique,
    repeated,
    repetitionRate: total ? Math.round((repeated / total) * 100) : 0,
    avgDiff: total ? Math.round((diffSum / total) * 10) / 10 : 0,
    topPairs: [...pairs.values()]
      .filter((p) => p.count > 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    repeatedMatchups,
    topPlayers: [...players.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    perDay: [...perDayMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count })),
  };
}
