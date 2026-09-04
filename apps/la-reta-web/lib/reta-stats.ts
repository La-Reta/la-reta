import type { GeneratedRetaWithPlayers } from "@/lib/queries";

export type PairStat = { key: string; a: string; b: string; count: number };
export type MatchupStat = {
  retaId: number;
  count: number;
  /** Un arreglo de nombres por equipo (2 … 6 lados). */
  sides: string[][];
};
export type PlayerStat = { playerId: number; name: string; count: number };
export type DayStat = { date: string; count: number };
/** Cuántas retas se generaron con 2, 3, 4 … equipos. */
export type FormatStat = { teams: number; count: number };
/** Diferencia (spread de OVR) de cada generación, en orden cronológico. */
export type DiffPoint = { date: string; diff: number; teams: number };

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
  byFormat: FormatStat[];
  diffTrend: DiffPoint[];
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

/** Agrupa a los jugadores de una reta por la letra de su equipo, en orden. */
function sidesOf(reta: GeneratedRetaWithPlayers) {
  const byTeam = new Map<string, GeneratedRetaWithPlayers["players"]>();
  for (const p of reta.players) {
    byTeam.set(p.team, [...(byTeam.get(p.team) ?? []), p]);
  }
  return [...byTeam.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, list]) => list);
}

/**
 * Aggregates generated retas into the measurements shown on the registro view:
 * repetition of splits, most frequent same-team duos, most convened players,
 * generations over time, formato (2 / 3 / 4 equipos) y qué tan parejas salen.
 * Pure — no DB, so it's cheap to unit-check. Funciona igual con 2 o N equipos.
 */
export function computeRetaStats(retas: GeneratedRetaWithPlayers[]): RetaStats {
  const total = retas.length;

  const sigCount = new Map<string, number>();
  const pairs = new Map<string, PairStat>();
  const players = new Map<number, PlayerStat>();
  const perDayMap = new Map<string, number>();
  const formatMap = new Map<number, number>();
  const diffTrend: DiffPoint[] = [];
  let diffSum = 0;

  for (const reta of retas) {
    sigCount.set(reta.signature, (sigCount.get(reta.signature) ?? 0) + 1);
    diffSum += reta.diff;

    const day = dayKey(reta.createdAt);
    perDayMap.set(day, (perDayMap.get(day) ?? 0) + 1);

    const sides = sidesOf(reta);
    const teamCount = Math.max(2, sides.length);
    formatMap.set(teamCount, (formatMap.get(teamCount) ?? 0) + 1);
    diffTrend.push({ date: day, diff: reta.diff, teams: teamCount });

    // Guests (occasional, no stable id) don't count toward duos / play-counts.
    const rosterSides = sides.map((side) =>
      side
        .filter((p) => !p.isGuest)
        .map((p) => ({ playerId: p.playerId as number, name: p.name })),
    );
    for (const p of rosterSides.flat()) {
      const cur = players.get(p.playerId) ?? {
        playerId: p.playerId,
        name: p.name,
        count: 0,
      };
      cur.count += 1;
      players.set(p.playerId, cur);
    }
    for (const p of rosterSides.flatMap(sidePairs)) {
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
        sides: sidesOf(sample).map((side) => side.map((p) => p.name)),
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
    byFormat: [...formatMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([teams, count]) => ({ teams, count })),
    // `retas` llega de más nueva a más vieja; el gráfico quiere cronológico.
    diffTrend: diffTrend.reverse(),
  };
}
