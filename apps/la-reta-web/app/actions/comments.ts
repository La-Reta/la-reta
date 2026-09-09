"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db, playerComments, commentReactions } from "@/lib/db";
import { MAX_DISTINCT_REACTIONS } from "@/lib/constants";
import { isAdmin } from "@/lib/admin";

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
  // Fallback al email (parte local) cuando no hay username ni nombre.
  const email = user.primaryEmailAddress?.emailAddress.split("@", 1)[0];
  // Se busca el primero **no vacío**, no el primero no nulo: Clerk devuelve ""
  // en los campos que el usuario no rellenó, y con `??` esa cadena vacía se
  // daría por buena y el autor saldría en blanco.
  return (
    [user.username, full, email].find((v) => v != null && v !== "") ?? null
  );
}

// Reusar el segmenter (crearlo por llamada es caro).
const graphemes = new Intl.Segmenter();

/**
 * True when `s` is exactly one emoji (incl. ZWJ/modifier sequences). Usa
 * `Intl.Segmenter` (un solo grapheme cluster) + property Unicode — sin depender
 * de `emoji-regex`. ponytail: keycaps tipo "1️⃣" pueden no pasar; los emojis de
 * reacción habituales (👍❤️😂) sí. Ampliar si hace falta soportarlos.
 */
function isSingleEmoji(s: string): boolean {
  if (s === "" || s.length > 16) {
    return false;
  }
  const segments = [...graphemes.segment(s)];
  return segments.length === 1 && /\p{Extended_Pictographic}/u.test(s);
}

export interface ClientInfo {
  language?: string;
  timezone?: string;
  screen?: string;
  platform?: string;
  userAgent?: string;
}

export interface CommentInput {
  body: string;
  rating: number;
  client: ClientInfo;
}

type Result = { ok: true } | { ok: false; error: string };

const UNAUTHORIZED = "No autorizado.";

/**
 * Recorta a `max` y convierte el vacío en `null`. Las columnas de metadatos
 * admiten null, y una cadena vacía guardada ocupa lo mismo que un dato y no
 * dice nada.
 */
function trimmedOrNull(value: string | undefined, max: number): string | null {
  return value === undefined || value === "" ? null : value.slice(0, max);
}

export async function addPlayerComment(
  playerId: number,
  input: CommentInput
): Promise<Result> {
  // Sesión requerida — el autor sale de Clerk, no del cliente (autoritativo).
  const { userId } = await auth();
  if (userId == null) {
    return { ok: false, error: "Inicia sesión para dejar tu reseña." };
  }

  const body = input.body.trim();
  if (body === "") {
    return { ok: false, error: "Escribe un comentario." };
  }
  if (body.length > 500) {
    return { ok: false, error: "Máximo 500 caracteres." };
  }

  const rating =
    input.rating >= 1 && input.rating <= 5 ? Math.round(input.rating) : null;

  const user = await currentUser();

  await db.insert(playerComments).values({
    playerId,
    author: clerkDisplayName(user),
    authorImageUrl: user?.imageUrl ?? null,
    authorId: userId,
    body: body.slice(0, 500),
    rating,
    language: trimmedOrNull(input.client.language, 24),
    timezone: trimmedOrNull(input.client.timezone, 64),
    screen: trimmedOrNull(input.client.screen, 24),
    platform: trimmedOrNull(input.client.platform, 80),
    userAgent: input.client.userAgent ?? null,
  });

  revalidatePath(`/players/${playerId}`);
  return { ok: true };
}

/**
 * Toggle one emoji reaction on a comment for an anonymous reactor. Returns the
 * resulting state so the client stays in sync with the DB (source of truth).
 */
export async function toggleCommentReaction({
  playerId,
  commentId,
  emoji,
  reactorKey,
}: {
  playerId: number;
  commentId: number;
  emoji: string;
  /**
  Id anónimo del navegador que reacciona (localStorage), no una sesión.
  */
  reactorKey: string;
}): Promise<{ ok: true; reacted: boolean } | { ok: false; error: string }> {
  if (!isSingleEmoji(emoji)) {
    return { ok: false, error: "Emoji no permitido." };
  }
  if (reactorKey === "" || reactorKey.length > 64) {
    return { ok: false, error: "Reactor inválido." };
  }

  const where = and(
    eq(commentReactions.commentId, commentId),
    eq(commentReactions.emoji, emoji),
    eq(commentReactions.reactorKey, reactorKey)
  );
  // Un solo viaje a Neon para el caso de quitar la reacción: `RETURNING` dice
  // si había fila que borrar, así que el `SELECT` previo sobraba. Cada viaje
  // cuesta una ida y vuelta completa contra el Postgres serverless, y esto se
  // dispara con cada toque de emoji.
  const removed = await db
    .delete(commentReactions)
    .where(where)
    .returning({ id: commentReactions.id });

  let reacted: boolean;
  if (removed.length > 0) {
    reacted = false;
  } else {
    // Cap distinct emojis per comment; a brand-new emoji beyond the cap is
    // rejected, but reacting to an already-present emoji is always allowed.
    const distinct = await db
      .select({ emoji: commentReactions.emoji })
      .from(commentReactions)
      .where(eq(commentReactions.commentId, commentId))
      .groupBy(commentReactions.emoji);
    const present = new Set(distinct.map((d) => d.emoji));
    if (!present.has(emoji) && present.size >= MAX_DISTINCT_REACTIONS) {
      return {
        ok: false,
        error: `Máximo ${MAX_DISTINCT_REACTIONS} reacciones distintas por comentario.`,
      };
    }

    // onConflictDoNothing guards the race where two clicks land at once.
    await db
      .insert(commentReactions)
      .values({ commentId, emoji, reactorKey })
      .onConflictDoNothing();
    reacted = true;
  }

  revalidatePath(`/players/${playerId}`);
  return { ok: true, reacted };
}

/**
 * Soft-delete one's OWN comment. Same effect as archive (`deleted = true`) but
 * gated on the caller being the Clerk author of the comment, not an admin.
 */
export async function deleteOwnComment(
  playerId: number,
  commentId: number
): Promise<Result> {
  const { userId } = await auth();
  if (userId == null) {
    return { ok: false, error: UNAUTHORIZED };
  }

  const rows = await db
    .select({ authorId: playerComments.authorId })
    .from(playerComments)
    .where(eq(playerComments.id, commentId))
    .limit(1);
  // `rows.at(0)` y no `const [row] =`: con la desestructuración TypeScript da
  // `row` por definido —el proyecto no usa `noUncheckedIndexedAccess`— y el
  // lint marcaba el `!row` como condición muerta, cuando en ejecución el SELECT
  // sí puede volver vacío si el comentario ya no existe.
  if (rows.at(0)?.authorId !== userId) {
    return { ok: false, error: UNAUTHORIZED };
  }

  await db
    .update(playerComments)
    .set({ deleted: true })
    .where(eq(playerComments.id, commentId));

  revalidatePath(`/players/${playerId}`);
  return { ok: true };
}

/**
 * Archive a comment (soft delete). Admin-only; sets `deleted = true` so the
 * record is kept but hidden from the public list.
 */
export async function archivePlayerComment(
  playerId: number,
  commentId: number
): Promise<Result> {
  if (!(await isAdmin())) {
    return { ok: false, error: UNAUTHORIZED };
  }

  await db
    .update(playerComments)
    .set({ deleted: true })
    .where(eq(playerComments.id, commentId));

  revalidatePath(`/players/${playerId}`);
  return { ok: true };
}
