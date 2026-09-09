"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { CommentInput, CommentResult } from "@/lib/comments";
import { isAdmin } from "@/lib/admin";
import {
  clerkDisplayName,
  isSingleEmoji,
  normalizeRating,
  trimmedOrNull,
  UNAUTHORIZED,
  validateBody,
} from "@/lib/comments";
import { MAX_DISTINCT_REACTIONS } from "@/lib/constants";
import { db, matchCommentReactions, matchComments } from "@/lib/db";

/**
 * Reseñas de un partido: la misma máquina que las de jugador, sobre otra tabla.
 *
 * Las reglas se comparten en `lib/comments.ts` en vez de copiarse, porque son
 * las que deciden quién firma una reseña y qué emoji entra: dos copias de eso
 * envejecen por separado y la que se olvide es la que abre el hueco.
 *
 * La única regla que no viaja es la de "nadie se reseña a sí mismo". En un
 * jugador tiene sentido; en un partido no hay dueño a quien proteger — el
 * partido es de todos los que jugaron.
 */

/**
 * Ambas vistas de la web enseñan las reseñas de un partido.
 */
function revalidateMatch(matchId: number): void {
  revalidatePath(`/matches/${matchId}`);
  revalidatePath(`/matches/${matchId}/detail`);
}

export async function addMatchComment(
  matchId: number,
  input: CommentInput
): Promise<CommentResult> {
  // Sesión requerida — el autor sale de Clerk, no del cuerpo (autoritativo).
  const { userId } = await auth();
  if (userId == null) {
    return { ok: false, error: "Inicia sesión para dejar tu reseña." };
  }

  const checked = validateBody(input.body);
  if (!checked.ok) {
    return checked;
  }

  const user = await currentUser();

  await db.insert(matchComments).values({
    matchId,
    author: clerkDisplayName(user),
    authorImageUrl: user?.imageUrl ?? null,
    authorId: userId,
    body: checked.body,
    rating: normalizeRating(input.rating),
    language: trimmedOrNull(input.client.language, 24),
    timezone: trimmedOrNull(input.client.timezone, 64),
    screen: trimmedOrNull(input.client.screen, 24),
    platform: trimmedOrNull(input.client.platform, 80),
    userAgent: input.client.userAgent ?? null,
  });

  revalidateMatch(matchId);
  return { ok: true };
}

/**
 * Corregir la propia reseña.
 *
 * La regla la impone el `UPDATE`: se filtra por id **y** por `author_id` en la
 * misma sentencia en vez de leer primero y escribir después, así que no queda
 * hueco entre comprobar y cambiar. Si no vuelve fila, o no existe o no es suya,
 * y las dos cosas responden lo mismo para no ir diciendo qué reseñas hay.
 *
 * Solo el texto y la nota: el autor, su foto y la fecha son del momento en que
 * se escribió. Una reseña editable de arriba abajo deja de ser el registro de
 * lo que alguien dijo.
 */
export async function editOwnMatchComment(
  matchId: number,
  commentId: number,
  input: { body: string; rating: number }
): Promise<CommentResult> {
  const { userId } = await auth();
  if (userId == null) {
    return { ok: false, error: "Inicia sesión para editar tu reseña." };
  }

  const checked = validateBody(input.body);
  if (!checked.ok) {
    return checked;
  }

  const updated = await db
    .update(matchComments)
    .set({ body: checked.body, rating: normalizeRating(input.rating) })
    .where(
      and(
        eq(matchComments.id, commentId),
        eq(matchComments.matchId, matchId),
        eq(matchComments.authorId, userId),
        eq(matchComments.deleted, false)
      )
    )
    .returning({ id: matchComments.id });

  if (updated.length === 0) {
    return { ok: false, error: "No puedes editar esta reseña." };
  }

  revalidateMatch(matchId);
  return { ok: true };
}

/**
 * Pone o quita una reacción. Devuelve el estado resultante para que el cliente
 * quede sincronizado con la base, que es la que manda.
 */
export async function toggleMatchCommentReaction({
  matchId,
  commentId,
  emoji,
  deviceKey,
}: {
  matchId: number;
  commentId: number;
  emoji: string;
  /**
   * Id del aparato, y **solo se mira sin sesión**. Con sesión manda el `userId`
   * de Clerk: si el cliente pudiera elegir su identidad, cualquiera inflaría un
   * contador mandando claves distintas.
   */
  deviceKey?: string;
}): Promise<{ ok: true; reacted: boolean } | { ok: false; error: string }> {
  if (!isSingleEmoji(emoji)) {
    return { ok: false, error: "Emoji no permitido." };
  }

  const { userId } = await auth();
  const reactorKey = userId ?? (deviceKey ?? "").slice(0, 64);
  if (reactorKey === "") {
    return { ok: false, error: "Falta identificar quién reacciona." };
  }

  const where = and(
    eq(matchCommentReactions.commentId, commentId),
    eq(matchCommentReactions.emoji, emoji),
    eq(matchCommentReactions.reactorKey, reactorKey)
  );
  // Un solo viaje a Neon para quitar la reacción: `RETURNING` dice si había
  // fila que borrar, así que el `SELECT` previo sobra. Cada viaje cuesta una
  // ida y vuelta contra el Postgres serverless, y esto se dispara con cada
  // toque de emoji.
  const removed = await db
    .delete(matchCommentReactions)
    .where(where)
    .returning({ id: matchCommentReactions.id });

  let reacted: boolean;
  if (removed.length > 0) {
    reacted = false;
  } else {
    // Tope de emojis distintos por comentario. Uno nuevo por encima del tope se
    // rechaza, pero sumarse a un emoji que ya está siempre se permite.
    const distinct = await db
      .select({ emoji: matchCommentReactions.emoji })
      .from(matchCommentReactions)
      .where(eq(matchCommentReactions.commentId, commentId))
      .groupBy(matchCommentReactions.emoji);
    const present = new Set(distinct.map((d) => d.emoji));
    if (!present.has(emoji) && present.size >= MAX_DISTINCT_REACTIONS) {
      return {
        ok: false,
        error: `Máximo ${MAX_DISTINCT_REACTIONS} reacciones distintas por comentario.`,
      };
    }

    // onConflictDoNothing cubre la carrera de dos toques a la vez.
    await db
      .insert(matchCommentReactions)
      .values({ commentId, emoji, reactorKey })
      .onConflictDoNothing();
    reacted = true;
  }

  revalidateMatch(matchId);
  return { ok: true, reacted };
}

/**
 * Borrado suave de la propia reseña: `deleted = true`, mismo efecto que
 * archivar, pero permitido por ser su autor y no por ser admin.
 */
export async function deleteOwnMatchComment(
  matchId: number,
  commentId: number
): Promise<CommentResult> {
  const { userId } = await auth();
  if (userId == null) {
    return { ok: false, error: UNAUTHORIZED };
  }

  // Igual que al editar: la pertenencia se comprueba dentro del propio UPDATE.
  const updated = await db
    .update(matchComments)
    .set({ deleted: true })
    .where(
      and(
        eq(matchComments.id, commentId),
        eq(matchComments.matchId, matchId),
        eq(matchComments.authorId, userId)
      )
    )
    .returning({ id: matchComments.id });

  if (updated.length === 0) {
    return { ok: false, error: UNAUTHORIZED };
  }

  revalidateMatch(matchId);
  return { ok: true };
}

/**
 * Archivar una reseña (borrado suave). Solo admin: la fila se conserva y deja
 * de verse.
 */
export async function archiveMatchComment(
  matchId: number,
  commentId: number
): Promise<CommentResult> {
  if (!(await isAdmin())) {
    return { ok: false, error: UNAUTHORIZED };
  }

  await db
    .update(matchComments)
    .set({ deleted: true })
    .where(eq(matchComments.id, commentId));

  revalidateMatch(matchId);
  return { ok: true };
}
