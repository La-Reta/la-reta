"use server";

import { revalidatePath } from "next/cache";
import { db, playerComments } from "@/lib/db";

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
