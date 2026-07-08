"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import emojiRegex from "emoji-regex";
import { db, playerComments, commentReactions } from "@/lib/db";
import { MAX_DISTINCT_REACTIONS } from "@/lib/constants";
import { isAdmin } from "@/lib/admin";

/** True when `s` is exactly one emoji (incl. ZWJ/modifier sequences). */
function isSingleEmoji(s: string): boolean {
  if (!s || s.length > 16) return false;
  const matches = [...s.matchAll(emojiRegex())];
  return matches.length === 1 && matches[0][0] === s;
}

export type ClientInfo = {
  language?: string;
  timezone?: string;
  screen?: string;
  platform?: string;
  userAgent?: string;
};

export type CommentInput = {
  author: string;
  body: string;
  rating: number;
  client: ClientInfo;
};

type Result = { ok: true } | { ok: false; error: string };

export async function addPlayerComment(
  playerId: number,
  input: CommentInput,
): Promise<Result> {
  const body = input.body?.trim();
  if (!body) return { ok: false, error: "Escribe un comentario." };
  if (body.length > 500) return { ok: false, error: "Máximo 500 caracteres." };

  const rating =
    input.rating >= 1 && input.rating <= 5 ? Math.round(input.rating) : null;

  await db.insert(playerComments).values({
    playerId,
    author: input.author?.trim() || null,
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
  if (!isSingleEmoji(emoji))
    return { ok: false, error: "Emoji no permitido." };
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
