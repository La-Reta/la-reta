"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import type { CommentInput, CommentResult } from "@/lib/comments";
import { db, playerComments, commentReactions } from "@/lib/db";
import {
  clerkDisplayName,
  isSingleEmoji,
  normalizeRating,
  trimmedOrNull,
  UNAUTHORIZED,
  validateBody,
} from "@/lib/comments";
import { MAX_DISTINCT_REACTIONS } from "@/lib/constants";
import { isAdmin } from "@/lib/admin";

/**
 * Las reglas de una reseña —quién la firma, qué emoji entra, cuánto texto cabe—
 * viven en `lib/comments.ts` y las comparten las reseñas de jugador y las de
 * partido. Estaban aquí dentro, privadas de este módulo, hasta que apareció el
 * segundo tipo: dos copias de esas validaciones envejecen por separado, y la
 * que se quede atrás es la que abre el hueco.
 */

type Result = CommentResult;

export async function addPlayerComment(
  playerId: number,
  input: CommentInput
): Promise<Result> {
  // Sesión requerida — el autor sale de Clerk, no del cliente (autoritativo).
  const { userId } = await auth();
  if (userId == null) {
    return { ok: false, error: "Inicia sesión para dejar tu reseña." };
  }

  const checked = validateBody(input.body);
  if (!checked.ok) {
    return checked;
  }
  const { body } = checked;
  const rating = normalizeRating(input.rating);

  const user = await currentUser();

  await db.insert(playerComments).values({
    playerId,
    author: clerkDisplayName(user),
    authorImageUrl: user?.imageUrl ?? null,
    authorId: userId,
    body,
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

export { type CommentInput, type ClientInfo } from "@/lib/comments";
