import type { Position } from "@/lib/constants";
import type { Player } from "@/lib/db/schema";

/** Guests use negative ids so they never collide with roster players (serial ≥ 1). */
export const isGuest = (p: { id: number }) => p.id < 0;

/**
 * Builds a full `Player` for a last-minute ("de última hora") guest so it flows
 * through the balancer and board like anyone else — never persisted to `players`.
 * The negative id (one below the current min) marks it as a guest.
 */
export function makeGuestPlayer(
  input: { name: string; overall: number; position: Position },
  existing: Player[],
): Player {
  const id = Math.min(0, ...existing.map((g) => g.id)) - 1;
  const now = new Date();
  const ovr = Math.max(1, Math.min(99, Math.round(input.overall)));
  return {
    id,
    name: input.name.trim(),
    // Guests use their full name (uppercased) as displayName — a real player's
    // one-word apodo doesn't apply, and "hermano de Luis"/"hermano de Pedro"
    // must stay distinguishable on the board.
    displayName: input.name.trim().toUpperCase().slice(0, 60),
    position: input.position,
    position2: null,
    preferredFoot: "right",
    nationality: "mx",
    photoUrl: null,
    age: 25,
    birthDate: null,
    heightCm: 175,
    weightKg: 70,
    pace: ovr,
    shooting: ovr,
    passing: ovr,
    dribbling: ovr,
    defending: ovr,
    physical: ovr,
    overall: ovr,
    createdAt: now,
    updatedAt: now,
  };
}
