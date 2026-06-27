"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, players, playerStatHistory } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { computeOverall } from "@/lib/ratings";
import {
  POSITIONS,
  FEET,
  STAT_KEYS,
  type Position,
  type Foot,
} from "@/lib/constants";

/** Extracts the attribute snapshot (6 stats + overall) from normalized values. */
function snapshotOf(values: ReturnType<typeof normalize>) {
  return {
    pace: values.pace,
    shooting: values.shooting,
    passing: values.passing,
    dribbling: values.dribbling,
    defending: values.defending,
    physical: values.physical,
    overall: values.overall,
  };
}

export type PlayerInput = {
  name: string;
  displayName: string;
  position: string;
  position2: string;
  preferredFoot: string;
  nationality: string;
  photoUrl: string;
  age: number;
  heightCm: number;
  weightKg: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
};

type ActionResult = { ok: true; id: number } | { ok: false; error: string };

function clamp(value: unknown, min: number, max: number, fallback: number) {
  const n = Math.round(Number(value));
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function normalize(input: PlayerInput) {
  const name = input.name?.trim();
  const displayName = (input.displayName?.trim() || name || "").toUpperCase();

  if (!name) throw new Error("El nombre es obligatorio.");
  if (!POSITIONS.includes(input.position as Position))
    throw new Error("Posición inválida.");
  if (!FEET.includes(input.preferredFoot as Foot))
    throw new Error("Pie inválido.");

  // Secondary position is optional; ignore it if empty or equal to the primary.
  const rawPos2 = input.position2?.trim();
  const position2 =
    rawPos2 && rawPos2 !== input.position && POSITIONS.includes(rawPos2 as Position)
      ? (rawPos2 as Position)
      : null;

  const stats = {
    pace: clamp(input.pace, 1, 99, 50),
    shooting: clamp(input.shooting, 1, 99, 50),
    passing: clamp(input.passing, 1, 99, 50),
    dribbling: clamp(input.dribbling, 1, 99, 50),
    defending: clamp(input.defending, 1, 99, 50),
    physical: clamp(input.physical, 1, 99, 50),
  };

  const position = input.position as Position;

  return {
    name,
    displayName: displayName.slice(0, 60),
    position,
    position2,
    preferredFoot: input.preferredFoot as Foot,
    nationality: (input.nationality?.trim().toLowerCase() || "mx").slice(0, 2),
    photoUrl: input.photoUrl?.trim() || null,
    age: clamp(input.age, 14, 60, 25),
    heightCm: clamp(input.heightCm, 140, 220, 175),
    weightKg: clamp(input.weightKg, 40, 130, 75),
    ...stats,
    overall: computeOverall(position, stats),
    updatedAt: new Date(),
  };
}

export async function createPlayer(input: PlayerInput): Promise<ActionResult> {
  try {
    const values = normalize(input);
    const [row] = await db
      .insert(players)
      .values(values)
      .returning({ id: players.id });
    // Record the initial snapshot so the history starts from day one.
    await db
      .insert(playerStatHistory)
      .values({ playerId: row.id, ...snapshotOf(values) });
    revalidatePath("/");
    revalidatePath("/players");
    revalidatePath("/teams");
    return { ok: true, id: row.id };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function updatePlayer(
  id: number,
  input: PlayerInput,
): Promise<ActionResult> {
  try {
    const values = normalize(input);
    const [existing] = await db
      .select()
      .from(players)
      .where(eq(players.id, id))
      .limit(1);

    await db.update(players).set(values).where(eq(players.id, id));

    // Append a snapshot only when an attribute actually changed.
    const statsChanged =
      !existing ||
      STAT_KEYS.some((k) => existing[k] !== values[k]) ||
      existing.overall !== values.overall;
    if (statsChanged) {
      await db
        .insert(playerStatHistory)
        .values({ playerId: id, ...snapshotOf(values) });
    }

    revalidatePath("/");
    revalidatePath("/players");
    revalidatePath(`/players/${id}`);
    revalidatePath("/teams");
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function deletePlayer(id: number): Promise<ActionResult> {
  try {
    if (!(await isAdmin())) return { ok: false, error: "No autorizado." };
    await db.delete(players).where(eq(players.id, id));
    revalidatePath("/");
    revalidatePath("/players");
    revalidatePath("/teams");
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function deletePlayers(
  ids: number[],
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  try {
    if (!(await isAdmin())) return { ok: false, error: "No autorizado." };
    if (ids.length === 0) return { ok: true, count: 0 };
    await db.delete(players).where(inArray(players.id, ids));
    revalidatePath("/");
    revalidatePath("/players");
    revalidatePath("/teams");
    revalidatePath("/positions");
    revalidatePath("/matches");
    return { ok: true, count: ids.length };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
