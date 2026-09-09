"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";
import type { Foot } from "@/lib/constants";
import { db, players, playerStatHistory, playerSignups } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { computeOverall } from "@/lib/ratings";
import { ageFromBirthDate } from "@/lib/dates";
import { FEET, isPosition, STAT_KEYS } from "@/lib/constants";
import { guard } from "@/lib/errors";
import { optionalText } from "@/lib/text";

/**
Extracts the attribute snapshot (6 stats + overall) from normalized values.
*/
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

/**
 * Lo que llega del formulario.
 *
 * Los campos van opcionales aunque el formulario siempre los mande: esto es una
 * server action, o sea una frontera, y el cliente es manipulable. Declarándolos
 * obligatorios TypeScript daba por muertas las guardas `?.` que en ejecución sí
 * hacen falta —y el linter pedía quitarlas, que es justo el cambio que rompe la
 * acción cuando llega un cuerpo incompleto.
 */
export interface PlayerInput {
  name?: string;
  displayName?: string;
  position?: string;
  position2?: string;
  preferredFoot?: string;
  nationality?: string;
  photoUrl?: string;
  birthDate?: string;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  pace?: number;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
  physical?: number;
}

/**
Rutas que se revalidan al tocar la plantilla.
*/
const NOT_AUTHORIZED = "No autorizado.";
const HOME_PATH = "/";
const PLAYERS_PATH = "/players";
const TEAMS_PATH = "/teams";

type ActionResult = { ok: true; id: number } | { ok: false; error: string };

interface Range {
  min: number;
  max: number;
  fallback: number;
}

function clamp(value: unknown, { min, max, fallback }: Range) {
  const n = Math.round(Number(value));
  if (Number.isNaN(n)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, n));
}

/**
Un atributo va de 1 a 99 y por defecto al centro de la tabla.
*/
const STAT_RANGE: Range = { min: 1, max: 99, fallback: 50 };

const isFoot = (value: unknown): value is Foot =>
  typeof value === "string" && (FEET as readonly string[]).includes(value);

function normalize(input: PlayerInput) {
  const name = input.name?.trim();
  if (name === undefined || name === "") {
    throw new Error("El nombre es obligatorio.");
  }
  if (!isPosition(input.position)) {
    throw new Error("Posición inválida.");
  }
  if (!isFoot(input.preferredFoot)) {
    throw new Error("Pie inválido.");
  }

  const nickname = input.displayName?.trim();
  // El apodo cae al nombre cuando viene vacío, no solo cuando falta: por eso
  // `||` explícito y no `??`.
  const displayName = (
    nickname === undefined || nickname === "" ? name : nickname
  ).toUpperCase();

  // Secondary position is optional; ignore it if empty or equal to the primary.
  const rawPos2 = input.position2?.trim();
  const position2 =
    rawPos2 !== undefined && rawPos2 !== input.position && isPosition(rawPos2)
      ? rawPos2
      : null;

  const stats = {
    pace: clamp(input.pace, STAT_RANGE),
    shooting: clamp(input.shooting, STAT_RANGE),
    passing: clamp(input.passing, STAT_RANGE),
    dribbling: clamp(input.dribbling, STAT_RANGE),
    defending: clamp(input.defending, STAT_RANGE),
    physical: clamp(input.physical, STAT_RANGE),
  };

  const { position } = input;

  // birthDate (YYYY-MM-DD) is the source of truth when present; age is derived
  // from it. Fall back to the raw age input for entries without a birth date.
  const birthDate = optionalText(input.birthDate);
  const derivedAge = ageFromBirthDate(birthDate);
  const nationality = optionalText(input.nationality)?.toLowerCase();

  return {
    name,
    displayName: displayName.slice(0, 60),
    position,
    position2,
    preferredFoot: input.preferredFoot,
    nationality: (nationality ?? "mx").slice(0, 2),
    photoUrl: optionalText(input.photoUrl),
    birthDate,
    age: clamp(Number.isFinite(derivedAge) ? derivedAge : input.age, {
      min: 14,
      max: 60,
      fallback: 25,
    }),
    heightCm: clamp(input.heightCm, { min: 140, max: 220, fallback: 175 }),
    weightKg: clamp(input.weightKg, { min: 40, max: 130, fallback: 75 }),
    ...stats,
    overall: computeOverall(position, stats),
    updatedAt: new Date(),
  };
}

/**
Display name for the signed-in Clerk user, or null.
*/
function clerkDisplayName(
  user: Awaited<ReturnType<typeof currentUser>>
): string | null {
  if (!user) {
    return null;
  }
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const email = user.primaryEmailAddress?.emailAddress.split("@", 1)[0];
  // El primero que traiga algo. Con `??` una cadena vacía ganaría y devolvería
  // "" en vez de caer al siguiente, que es lo que hacía el `||` encadenado.
  const candidate = [user.username, full, email].find(
    (value): value is string =>
      value !== null && value !== undefined && value !== ""
  );
  return candidate === undefined ? null : candidate.slice(0, 60);
}

export async function createPlayer(
  input: PlayerInput,
  signupId?: number
): Promise<ActionResult> {
  return await guard(async () => {
    // Alta permitida a admins (cookie PIN) o a cualquier usuario con sesión Clerk.
    const { userId } = await auth();
    if (userId === null && !(await isAdmin())) {
      return {
        ok: false,
        error: "Inicia sesión o entra como admin para crear un jugador.",
      };
    }

    const values = normalize(input);
    const creator = userId === null ? null : await currentUser();
    const rowRows = await db
      .insert(players)
      .values({
        ...values,
        createdById: userId,
        createdByName: clerkDisplayName(creator),
      })
      .returning({ id: players.id });
    const row = rowRows.at(0);
    if (!row) {
      throw new Error("No se pudo crear el jugador.");
    }
    // Record the initial snapshot so the history starts from day one.
    await db
      .insert(playerStatHistory)
      .values({ playerId: row.id, ...snapshotOf(values) });
    // Si el alta vino de una solicitud, márcala como registrada para sacarla
    // del pendiente/aprobado en /admin/registros.
    if (signupId !== undefined && Number.isFinite(signupId)) {
      await db
        .update(playerSignups)
        .set({ status: "registrado", updatedAt: new Date() })
        .where(eq(playerSignups.id, signupId));
      revalidatePath("/admin/registros");
    }
    revalidatePath(HOME_PATH);
    revalidatePath(PLAYERS_PATH);
    revalidatePath(TEAMS_PATH);
    return { ok: true, id: row.id };
  });
}

export async function updatePlayer(
  id: number,
  input: PlayerInput
): Promise<ActionResult> {
  return await guard(async () => {
    // Edición completa (incluye atributos) — solo admin.
    if (!(await isAdmin())) {
      return { ok: false, error: NOT_AUTHORIZED };
    }
    const values = normalize(input);
    // `rows.at(0)` y no `const [existing] =`: con la desestructuración
    // TypeScript da la fila por definida —el proyecto no usa
    // `noUncheckedIndexedAccess`— y marca como muerta la guarda de más abajo,
    // que en ejecución sí salta cuando el SELECT vuelve vacío.
    const existingRows = await db
      .select()
      .from(players)
      .where(eq(players.id, id))
      .limit(1);
    const existing = existingRows.at(0);

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

    revalidatePath(HOME_PATH);
    revalidatePath(PLAYERS_PATH);
    revalidatePath(`${PLAYERS_PATH}/${id}`);
    revalidatePath(TEAMS_PATH);
    return { ok: true, id };
  });
}

/**
 * Info-only edit for the profile owner (or admin). Never touches the 6 stats:
 * they're read from the existing row, so `overall` recomputes from the possibly
 * new position but the attributes stay put. Authorized by ownership OR admin.
 */
export async function updatePlayerInfo(
  id: number,
  input: PlayerInput
): Promise<ActionResult> {
  return await guard(async () => {
    const { userId } = await auth();
    // `rows.at(0)` y no `const [existing] =`: con la desestructuración
    // TypeScript da la fila por definida —el proyecto no usa
    // `noUncheckedIndexedAccess`— y marca como muerta la guarda de más abajo,
    // que en ejecución sí salta cuando el SELECT vuelve vacío.
    const existingRows = await db
      .select()
      .from(players)
      .where(eq(players.id, id))
      .limit(1);
    const existing = existingRows.at(0);
    if (!existing) {
      return { ok: false, error: "Jugador no encontrado." };
    }

    const owner = userId !== null && existing.clerkUserId === userId;
    if (!owner && !(await isAdmin())) {
      return { ok: false, error: NOT_AUTHORIZED };
    }

    // Ignora los stats del cliente: usa los existentes (el dueño no los edita).
    const values = normalize({
      ...input,
      pace: existing.pace,
      shooting: existing.shooting,
      passing: existing.passing,
      dribbling: existing.dribbling,
      defending: existing.defending,
      physical: existing.physical,
    });

    // Whitelist explícita de campos de info (atributos quedan intactos).
    await db
      .update(players)
      .set({
        name: values.name,
        displayName: values.displayName,
        position: values.position,
        position2: values.position2,
        preferredFoot: values.preferredFoot,
        nationality: values.nationality,
        photoUrl: values.photoUrl,
        birthDate: values.birthDate,
        age: values.age,
        heightCm: values.heightCm,
        weightKg: values.weightKg,
        overall: values.overall,
        updatedAt: values.updatedAt,
      })
      .where(eq(players.id, id));

    revalidatePath(HOME_PATH);
    revalidatePath(PLAYERS_PATH);
    revalidatePath(`${PLAYERS_PATH}/${id}`);
    revalidatePath(TEAMS_PATH);
    return { ok: true, id };
  });
}

/**
 * Self-claim an unclaimed player profile to the signed-in Clerk account. One
 * account ↔ one player (also enforced by a partial unique index). Admin unlinks.
 */
export async function claimPlayer(id: number): Promise<ActionResult> {
  return await guard(async () => {
    const { userId } = await auth();
    if (userId === null) {
      return { ok: false, error: "Inicia sesión para reclamar tu perfil." };
    }

    const playerRows = await db
      .select({ id: players.id, clerkUserId: players.clerkUserId })
      .from(players)
      .where(eq(players.id, id))
      .limit(1);
    const player = playerRows.at(0);
    if (!player) {
      return { ok: false, error: "Jugador no encontrado." };
    }
    if (player.clerkUserId === userId) {
      return { ok: true, id };
    }
    if (player.clerkUserId !== null && player.clerkUserId !== "") {
      return {
        ok: false,
        error: "Este perfil ya está vinculado a otra cuenta.",
      };
    }

    const mineRows = await db
      .select({ id: players.id })
      .from(players)
      .where(eq(players.clerkUserId, userId))
      .limit(1);
    const mine = mineRows.at(0);
    if (mine) {
      return {
        ok: false,
        error: "Tu cuenta ya está vinculada a otro jugador.",
      };
    }

    await db
      .update(players)
      .set({ clerkUserId: userId })
      .where(eq(players.id, id));
    revalidatePath(PLAYERS_PATH);
    revalidatePath(`${PLAYERS_PATH}/${id}`);
    return { ok: true, id };
  });
}

/**
Unlink a player from its account. Admin only.
*/
export async function unlinkPlayer(id: number): Promise<ActionResult> {
  return await guard(async () => {
    if (!(await isAdmin())) {
      return { ok: false, error: NOT_AUTHORIZED };
    }
    await db
      .update(players)
      .set({ clerkUserId: null })
      .where(eq(players.id, id));
    revalidatePath(PLAYERS_PATH);
    revalidatePath(`${PLAYERS_PATH}/${id}`);
    return { ok: true, id };
  });
}

export async function deletePlayer(id: number): Promise<ActionResult> {
  return await guard(async () => {
    if (!(await isAdmin())) {
      return { ok: false, error: NOT_AUTHORIZED };
    }
    await db.delete(players).where(eq(players.id, id));
    revalidatePath(HOME_PATH);
    revalidatePath(PLAYERS_PATH);
    revalidatePath(TEAMS_PATH);
    return { ok: true, id };
  });
}

export async function deletePlayers(
  ids: number[]
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  return await guard(async () => {
    if (!(await isAdmin())) {
      return { ok: false, error: NOT_AUTHORIZED };
    }
    if (ids.length === 0) {
      return { ok: true, count: 0 };
    }
    await db.delete(players).where(inArray(players.id, ids));
    revalidatePath(HOME_PATH);
    revalidatePath(PLAYERS_PATH);
    revalidatePath(TEAMS_PATH);
    revalidatePath("/positions");
    revalidatePath("/matches");
    return { ok: true, count: ids.length };
  });
}
