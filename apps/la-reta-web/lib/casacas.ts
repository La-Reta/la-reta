/**
 * Business logic for the "casacas" wheel: who washes the bibs next.
 *
 * Fairness rule: whoever washed the last couple of retas sits out ("en
 * descanso") so nobody gets it two (or three) retas in a row. Among everyone
 * else the pick is uniformly random. Pure + rng-injectable so it can be tested.
 */

/** How many of the most recent distinct winners sit out the next spin. */
export const RESTING_COUNT = 2;

/**
 * Ids eligible to be picked: everyone in `poolIds` except the last
 * `RESTING_COUNT` distinct winners. If that would lock everyone out (tiny pool),
 * the rule relaxes to the full pool so a spin is always possible.
 *
 * @param recentWinnerIds winners newest-first (index 0 = most recent).
 */
export function eligiblePlayerIds(
  poolIds: number[],
  recentWinnerIds: number[],
): number[] {
  const resting = new Set(recentWinnerIds.slice(0, RESTING_COUNT));
  const eligible = poolIds.filter((id) => !resting.has(id));
  return eligible.length > 0 ? eligible : [...poolIds];
}

/** Uniform random pick among eligible ids. Returns null for an empty pool. */
export function pickWinner(
  eligibleIds: number[],
  rng: () => number = Math.random,
): number | null {
  if (eligibleIds.length === 0) return null;
  return eligibleIds[Math.floor(rng() * eligibleIds.length)];
}

/**
 * Extra rotation (deg) to spin so the wheel lands with segment `winnerIndex`
 * centered under the pointer at top. Always spins forward by at least `turns`
 * full revolutions. `currentRotation` is the wheel's present angle.
 *
 * Layout contract (see wheel.tsx): segment i spans [i*seg, (i+1)*seg] measured
 * clockwise from the top, so its center sits at (i + 0.5) * seg.
 */
export function rotationForWinner(
  winnerIndex: number,
  segmentCount: number,
  currentRotation: number,
  turns = 5,
): number {
  const seg = 360 / segmentCount;
  const center = (winnerIndex + 0.5) * seg;
  // Where the winner's center currently sits relative to the top pointer.
  const offset = (((center + currentRotation) % 360) + 360) % 360;
  const delta = (360 - offset) % 360; // bring it up to the pointer
  return currentRotation + turns * 360 + delta;
}

// self-check
export function demo() {
  const assert = (c: boolean, m: string) => {
    if (!c) throw new Error("casacas demo failed: " + m);
  };

  // Resting rule excludes the last 2 winners.
  const pool = [1, 2, 3, 4, 5];
  assert(
    JSON.stringify(eligiblePlayerIds(pool, [5, 4])) ===
      JSON.stringify([1, 2, 3]),
    "should drop last two winners",
  );
  // Relaxes when everyone would be excluded.
  assert(
    eligiblePlayerIds([1, 2], [2, 1]).length === 2,
    "should relax when pool too small",
  );
  // pickWinner stays within eligible and honours a stubbed rng.
  assert(pickWinner([10, 20, 30], () => 0) === 10, "rng=0 → first");
  assert(pickWinner([10, 20, 30], () => 0.99) === 30, "rng≈1 → last");
  assert(pickWinner([]) === null, "empty pool → null");

  // Landing math: after the spin, the winner's center is at the top (mod 360 ≈ 0).
  for (const n of [1, 3, 6, 11]) {
    for (let i = 0; i < n; i++) {
      const start = i * 37.5; // arbitrary current angle
      const r = rotationForWinner(i, n, start);
      const center = (i + 0.5) * (360 / n);
      const atTop = (((center + r) % 360) + 360) % 360;
      assert(
        Math.abs(atTop) < 1e-6 || Math.abs(atTop - 360) < 1e-6,
        `winner ${i}/${n} should land at top (got ${atTop})`,
      );
      assert(r > start, "must spin forward");
    }
  }
  return "ok";
}

if (process.argv[1]?.endsWith("casacas.ts")) console.log(demo());
