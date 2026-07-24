"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db, playerComments, commentReactions } from "@/lib/db";
import { MAX_DISTINCT_REACTIONS } from "@/lib/constants";
import { isAdmin } from "@/lib/admin";

/** Display name for the signed-in Clerk user, or null. */
function clerkDisplayName(
  user: Awaited<ReturnType<typeof currentUser>>,
): string | null {
  if (!user) return null;
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ");
  // Fallback al email (parte local) cuando no hay username ni nombre.
  const email = user.primaryEmailAddress?.emailAddress?.split("@")[0];
  return user.username || full || email || null;
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
  if (!s || s.length > 16) return false;
  const segments = [...graphemes.segment(s)];
  return segments.length === 1 && /\p{Extended_Pictographic}/u.test(s);
}

export type ClientInfo = {
  language?: string;
  timezone?: string;
  screen?: string;
  platform?: string;
  userAgent?: string;
};

export type CommentInput = {
  body: string;
  rating: number;
  client: ClientInfo;
};

type Result = { ok: true } | { ok: false; error: string };

export async function addPlayerComment(
  playerId: number,
  input: CommentInput,
): Promise<Result> {
  // Sesión requerida — el autor sale de Clerk, no del cliente (autoritativo).
  const { userId } = await auth();
  if (!userId)
    return { ok: false, error: "Inicia sesión para dejar tu reseña." };

  const body = input.body?.trim();
  if (!body) return { ok: false, error: "Escribe un comentario." };
  if (body.length > 500) return { ok: false, error: "Máximo 500 caracteres." };

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
    language: input.client?.language?.slice(0, 24) || null,
    timezone: input.client?.timezone?.slice(0, 64) || null,
    screen: input.client?.screen?.slice(0, 24) || null,
    platform: input.client?.platform?.slice(0, 80) || null,
    userAgent: input.client?.userAgent || null,
  });

  revalidatePath(`/players/${playerId}`);
  return { ok: true };
}

/**
 * Toggle one emoji reaction on a comment for an anonymous reactor. Returns the
 * resulting state so the client stays in sync with the DB (source of truth).
 */
export async function toggleCommentReaction(
  playerId: number,
  commentId: number,
  emoji: string,
  reactorKey: string,
): Promise<{ ok: true; reacted: boolean } | { ok: false; error: string }> {
  if (!isSingleEmoji(emoji)) return { ok: false, error: "Emoji no permitido." };
  if (!reactorKey || reactorKey.length > 64)
    return { ok: false, error: "Reactor inválido." };

  const where = and(
    eq(commentReactions.commentId, commentId),
    eq(commentReactions.emoji, emoji),
    eq(commentReactions.reactorKey, reactorKey),
  );
  const existing = await db
    .select({ id: commentReactions.id })
    .from(commentReactions)
    .where(where)
    .limit(1);

  let reacted: boolean;
  if (existing[0]) {
    await db.delete(commentReactions).where(where);
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
    if (!present.has(emoji) && present.size >= MAX_DISTINCT_REACTIONS)
      return {
        ok: false,
        error: `Máximo ${MAX_DISTINCT_REACTIONS} reacciones distintas por comentario.`,
      };

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
  commentId: number,
): Promise<Result> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "No autorizado." };

  const [row] = await db
    .select({ authorId: playerComments.authorId })
    .from(playerComments)
    .where(eq(playerComments.id, commentId))
    .limit(1);
  if (!row || row.authorId !== userId)
    return { ok: false, error: "No autorizado." };

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
  commentId: number,
): Promise<Result> {
  if (!(await isAdmin())) return { ok: false, error: "No autorizado." };

  await db
    .update(playerComments)
    .set({ deleted: true })
    .where(eq(playerComments.id, commentId));

  revalidatePath(`/players/${playerId}`);
  return { ok: true };
}
