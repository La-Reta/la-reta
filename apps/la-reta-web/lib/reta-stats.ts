import type { GeneratedRetaWithPlayers } from "@/lib/queries";

export interface PairStat {
  key: string;
  a: string;
  b: string;
  count: number;
}
export interface MatchupStat {
  retaId: number;
  count: number;
  /**
  Un arreglo de nombres por equipo (2 … 6 lados).
  */
  sides: string[][];
}
export interface PlayerStat {
  playerId: number;
  name: string;
  count: number;
}
export interface DayStat {
  date: string;
  count: number;
}
/**
Cuántas retas se generaron con 2, 3, 4 … equipos.
*/
export interface FormatStat {
  teams: number;
  count: number;
}
/**
Diferencia (spread de OVR) de cada generación, en orden cronológico.
*/
export interface DiffPoint {
  date: string;
  diff: number;
  teams: number;
}

export interface RetaStats {
  total: number;
  unique: number;
  repeated: number;
  /**
   * 0–100
   */
  repetitionRate: number;
  avgDiff: number;
  topPairs: PairStat[];
  repeatedMatchups: MatchupStat[];
  topPlayers: PlayerStat[];
  perDay: DayStat[];
  byFormat: FormatStat[];
  diffTrend: DiffPoint[];
}

/**
Unordered same-team pairs of one side, keyed by sorted ids.
*/
/**
 * Solo los de plantilla: los invitados no tienen id estable, así que no cuentan
 * para duplas ni para partidos jugados. `flatMap` y no `filter().map()` porque
 * `filter` no estrecha el tipo de `playerId`.
 */
function rosterOnly(
  side: { isGuest: boolean; playerId: number | null; name: string }[]
) {
  return side.flatMap((p) => {
    if (p.isGuest || p.playerId == null) {
      return [];
    }
    return [{ playerId: p.playerId, name: p.name }];
  });
}

function sidePairs(side: { playerId: number; name: string }[]): PairStat[] {
  const sorted = side.toSorted((x, y) => x.playerId - y.playerId);
  const out: PairStat[] = [];
  for (let index = 0; index < sorted.length; index += 1) {
    for (let other = index + 1; other < sorted.length; other += 1) {
      out.push({
        key: `${sorted[index].playerId}-${sorted[other].playerId}`,
        a: sorted[index].name,
        b: sorted[other].name,
        count: 1,
      });
    }
  }
  return out;
}

function dayKey(createdAt: Date | string): string {
  if (typeof createdAt === "string") {
    return createdAt.slice(0, 10);
  }
  // Fuera del `new` a propósito: encadenar sobre la expresión se lee peor y el
  // linter lo marca.
  const asDate = new Date(createdAt);
  return asDate.toISOString().slice(0, 10);
}

/**
Agrupa a los jugadores de una reta por la letra de su equipo, en orden.
*/
function sidesOf(reta: GeneratedRetaWithPlayers) {
  const byTeam = new Map<string, GeneratedRetaWithPlayers["players"]>();
  for (const p of reta.players) {
    byTeam.set(p.team, [...(byTeam.get(p.team) ?? []), p]);
  }
  return [...byTeam]
    .toSorted((a, b) => a[0].localeCompare(b[0]))
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
    // `filter` no estrecha el tipo de `playerId`, así que la conversión va en
    // un solo paso que descarta a quien no lo tenga — en vez de una aserción
    // `!` que promete lo que nadie comprobó.
    const rosterSides = sides.map(rosterOnly);
    for (const p of rosterSides.flat()) {
      const current = players.get(p.playerId) ?? {
        playerId: p.playerId,
        name: p.name,
        count: 0,
      };
      current.count += 1;
      players.set(p.playerId, current);
    }
    for (const p of rosterSides.flatMap(sidePairs)) {
      const current = pairs.get(p.key) ?? { ...p, count: 0 };
      current.count += 1;
      pairs.set(p.key, current);
    }
  }

  const unique = sigCount.size;
  const repeated = total - unique;

  const repeatedMatchups: MatchupStat[] = [...sigCount]
    .filter(([, c]) => c > 1)
    .toSorted((a, b) => b[1] - a[1])
    .slice(0, 6)
    .flatMap(([sig, count]) => {
      const sample = retas.find((r) => r.signature === sig);
      // Sin muestra no hay nada que enseñar. Antes iba con `!`, que prometía
      // que `find` siempre acierta.
      if (!sample) {
        return [];
      }
      return [
        {
          retaId: sample.id,
          count,
          sides: sidesOf(sample).map((side) => side.map((p) => p.name)),
        },
      ];
    });

  return {
    total,
    unique,
    repeated,
    repetitionRate: total ? Math.round((repeated / total) * 100) : 0,
    avgDiff: total ? Math.round((diffSum / total) * 10) / 10 : 0,
    topPairs: pairs
      .values()
      .filter((p) => p.count > 1)
      .toArray()
      .toSorted((a, b) => b.count - a.count)
      .slice(0, 8),
    repeatedMatchups,
    topPlayers: players
      .values()
      .toArray()
      .toSorted((a, b) => b.count - a.count)
      .slice(0, 8),
    perDay: [...perDayMap]
      .toSorted((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count })),
    byFormat: [...formatMap]
      .toSorted((a, b) => a[0] - b[0])
      .map(([teams, count]) => ({ teams, count })),
    // `retas` llega de más nueva a más vieja; el gráfico quiere cronológico.
    diffTrend: diffTrend.toReversed(),
  };
}
