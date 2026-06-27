import { positionGroup, type PositionGroup } from "@/lib/constants";
import { playerPositions } from "@/lib/format";
import type { Player } from "@/lib/db/schema";

export type LineupSlot = {
  id: string;
  /** Position label shown on the board, e.g. "CB". */
  label: string;
  group: PositionGroup;
  /** Coordinates as % of the board: x along the length, y across the width. */
  x: number;
  y: number;
  player: Player | null;
};

// A 4-3-3 — the most legible shape for a quick "once ideal".
const FORMATION: Omit<LineupSlot, "player">[] = [
  { id: "gk", label: "POR", group: "GK", x: 8, y: 50 },
  { id: "lb", label: "LD", group: "DEF", x: 24, y: 84 },
  { id: "lcb", label: "DFC", group: "DEF", x: 18, y: 62 },
  { id: "rcb", label: "DFC", group: "DEF", x: 18, y: 38 },
  { id: "rb", label: "LI", group: "DEF", x: 24, y: 16 },
  { id: "lcm", label: "MC", group: "MID", x: 46, y: 72 },
  { id: "cm", label: "MCD", group: "MID", x: 40, y: 50 },
  { id: "rcm", label: "MC", group: "MID", x: 46, y: 28 },
  { id: "lw", label: "EI", group: "FWD", x: 74, y: 82 },
  { id: "st", label: "DC", group: "FWD", x: 90, y: 50 },
  { id: "rw", label: "ED", group: "FWD", x: 74, y: 18 },
];

/**
 * Builds the strongest available 4-3-3. Each slot takes the best unused player
 * who can play that line (primary or secondary position); any slot left empty
 * because a line ran short is filled with the best remaining player.
 */
export function bestEleven(players: Player[]): LineupSlot[] {
  const pool = [...players].sort((a, b) => b.overall - a.overall);
  const used = new Set<number>();
  const slots: LineupSlot[] = FORMATION.map((s) => ({ ...s, player: null }));

  for (const slot of slots) {
    const pick = pool.find(
      (p) =>
        !used.has(p.id) &&
        playerPositions(p).some((pos) => positionGroup(pos) === slot.group),
    );
    if (pick) {
      slot.player = pick;
      used.add(pick.id);
    }
  }

  for (const slot of slots) {
    if (slot.player) continue;
    const pick = pool.find((p) => !used.has(p.id));
    if (pick) {
      slot.player = pick;
      used.add(pick.id);
    }
  }

  return slots;
}
