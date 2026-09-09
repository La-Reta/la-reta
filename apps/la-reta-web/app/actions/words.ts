"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, retaWords } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { optionalText, safeText } from "@/lib/text";

export interface ClientInfo {
  language?: string;
  timezone?: string;
  screen?: string;
  platform?: string;
  userAgent?: string;
}

/**
 * Lo que llega del cliente. Los campos van opcionales aunque el formulario
 * siempre los mande: esto es una frontera y el cliente es manipulable.
 * Declarándolos obligatorios, TypeScript daba por muertas las guardas `?.` que
 * en ejecución sí hacen falta.
 */
export interface WordInput {
  word?: string;
  author?: string;
  client: ClientInfo;
}

type Result = { ok: true } | { ok: false; error: string };

export async function addRetaWord(input: WordInput): Promise<Result> {
  const word = optionalText(input.word)?.replaceAll(/\s+/gu, " ");
  if (word === undefined) {
    return { ok: false, error: "Escribe una palabra." };
  }
  if (word.length > 40) {
    return { ok: false, error: "Máximo 40 caracteres." };
  }

  await db.insert(retaWords).values({
    word,
    author: optionalText(input.author),
    language: safeText(input.client.language, 24),
    timezone: safeText(input.client.timezone, 64),
    screen: safeText(input.client.screen, 24),
    platform: safeText(input.client.platform, 80),
    userAgent: optionalText(input.client.userAgent),
  });

  revalidatePath("/");
  revalidatePath("/palabras");
  return { ok: true };
}

export async function updateRetaWord(
  id: number,
  rawWord: string,
  rawAuthor: string
): Promise<Result> {
  if (!(await isAdmin())) {
    return { ok: false, error: "No autorizado." };
  }
  const word = optionalText(rawWord)?.replaceAll(/\s+/gu, " ");
  if (word === undefined) {
    return { ok: false, error: "Escribe una palabra." };
  }
  if (word.length > 40) {
    return { ok: false, error: "Máximo 40 caracteres." };
  }
  const author = safeText(rawAuthor, 60);

  await db.update(retaWords).set({ word, author }).where(eq(retaWords.id, id));

  revalidatePath("/");
  revalidatePath("/palabras");
  return { ok: true };
}

export async function deleteRetaWord(id: number): Promise<Result> {
  if (!(await isAdmin())) {
    return { ok: false, error: "No autorizado." };
  }

  await db.delete(retaWords).where(eq(retaWords.id, id));

  revalidatePath("/");
  revalidatePath("/palabras");
  return { ok: true };
}
