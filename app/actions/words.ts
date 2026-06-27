"use server";

import { revalidatePath } from "next/cache";
import { db, retaWords } from "@/lib/db";

export type ClientInfo = {
  language?: string;
  timezone?: string;
  screen?: string;
  platform?: string;
  userAgent?: string;
};

export type WordInput = {
  word: string;
  author: string;
  client: ClientInfo;
};

type Result = { ok: true } | { ok: false; error: string };

export async function addRetaWord(input: WordInput): Promise<Result> {
  const word = input.word?.trim().replace(/\s+/g, " ");
  if (!word) return { ok: false, error: "Escribe una palabra." };
  if (word.length > 40) return { ok: false, error: "Máximo 40 caracteres." };

  await db.insert(retaWords).values({
    word,
    author: input.author?.trim() || null,
    language: input.client?.language?.slice(0, 24) || null,
    timezone: input.client?.timezone?.slice(0, 64) || null,
    screen: input.client?.screen?.slice(0, 24) || null,
    platform: input.client?.platform?.slice(0, 80) || null,
    userAgent: input.client?.userAgent || null,
  });

  revalidatePath("/");
  revalidatePath("/palabras");
  return { ok: true };
}
