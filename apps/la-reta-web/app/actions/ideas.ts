"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, ideas } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import {
  IDEA_CATEGORIES,
  IDEA_STATUSES,
  IDEA_PRIORITIES,
} from "@/lib/constants";
import { optionalText, safeText } from "@/lib/text";
import { inList } from "@/lib/guards";

type Result = { ok: true; id?: number } | { ok: false; error: string };

/**
 * Lo que llega del cliente. Los campos van opcionales aunque el formulario
 * siempre los mande: esto es una frontera y el cliente es manipulable.
 * Declarándolos obligatorios, TypeScript daba por muertas las guardas `?.` que
 * en ejecución sí hacen falta.
 */
export interface IdeaInput {
  title?: string;
  description?: string;
  author?: string;
  category?: string;
  client?: {
    language?: string;
    timezone?: string;
    screen?: string;
    platform?: string;
    userAgent?: string;
  };
}

const IDEAS_PATH = "/ideas";
const ADMIN_IDEAS_PATH = "/admin/ideas";
const NOT_AUTHORIZED = "No autorizado.";

export async function createIdea(input: IdeaInput): Promise<Result> {
  const title = optionalText(input.title);
  if (title === null) {
    return { ok: false, error: "El título es obligatorio." };
  }
  const description = optionalText(input.description);
  if (description === null) {
    return { ok: false, error: "Describe tu idea." };
  }

  const category = inList(IDEA_CATEGORIES, input.category)
    ? input.category
    : "otro";

  const [row] = await db
    .insert(ideas)
    .values({
      title: title.slice(0, 140),
      description,
      author: optionalText(input.author),
      category,
      language: safeText(input.client?.language, 24),
      timezone: safeText(input.client?.timezone, 64),
      screen: safeText(input.client?.screen, 24),
      platform: safeText(input.client?.platform, 80),
      userAgent: optionalText(input.client?.userAgent),
    })
    .returning({ id: ideas.id });

  revalidatePath(IDEAS_PATH);
  revalidatePath(ADMIN_IDEAS_PATH);
  return { ok: true, id: row.id };
}

export interface IdeaTriage {
  status: string;
  priority: string;
  estimate: string;
  adminNotes: string;
}

export async function updateIdeaTriage(
  id: number,
  t: IdeaTriage
): Promise<Result> {
  if (!(await isAdmin())) {
    return { ok: false, error: NOT_AUTHORIZED };
  }

  const status = inList(IDEA_STATUSES, t.status) ? t.status : "nueva";
  const priority = inList(IDEA_PRIORITIES, t.priority) ? t.priority : null;

  await db
    .update(ideas)
    .set({
      status,
      priority,
      estimate: optionalText(t.estimate),
      adminNotes: optionalText(t.adminNotes),
      updatedAt: new Date(),
    })
    .where(eq(ideas.id, id));

  revalidatePath(IDEAS_PATH);
  revalidatePath(ADMIN_IDEAS_PATH);
  return { ok: true, id };
}

/**
Quick status change (e.g. mark an idea as done) without the full triage form.
*/
export async function setIdeaStatus(
  id: number,
  status: string
): Promise<Result> {
  if (!(await isAdmin())) {
    return { ok: false, error: NOT_AUTHORIZED };
  }
  const next = inList(IDEA_STATUSES, status) ? status : "nueva";
  await db
    .update(ideas)
    .set({ status: next, updatedAt: new Date() })
    .where(eq(ideas.id, id));
  revalidatePath(IDEAS_PATH);
  revalidatePath(ADMIN_IDEAS_PATH);
  return { ok: true, id };
}

export async function deleteIdea(id: number): Promise<Result> {
  if (!(await isAdmin())) {
    return { ok: false, error: NOT_AUTHORIZED };
  }
  await db.delete(ideas).where(eq(ideas.id, id));
  revalidatePath(IDEAS_PATH);
  revalidatePath(ADMIN_IDEAS_PATH);
  return { ok: true, id };
}
