"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, ideas } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import {
  IDEA_CATEGORIES,
  IDEA_STATUSES,
  IDEA_PRIORITIES,
  type IdeaCategory,
  type IdeaStatus,
  type IdeaPriority,
} from "@/lib/constants";

type Result = { ok: true; id?: number } | { ok: false; error: string };

export type IdeaInput = {
  title: string;
  description: string;
  author: string;
  category: string;
};

export async function createIdea(input: IdeaInput): Promise<Result> {
  const title = input.title?.trim();
  const description = input.description?.trim();
  if (!title) return { ok: false, error: "El título es obligatorio." };
  if (!description) return { ok: false, error: "Describe tu idea." };

  const category = IDEA_CATEGORIES.includes(input.category as IdeaCategory)
    ? (input.category as IdeaCategory)
    : "otro";

  const [row] = await db
    .insert(ideas)
    .values({
      title: title.slice(0, 140),
      description,
      author: input.author?.trim() || null,
      category,
    })
    .returning({ id: ideas.id });

  revalidatePath("/ideas");
  revalidatePath("/admin/ideas");
  return { ok: true, id: row.id };
}

export type IdeaTriage = {
  status: string;
  priority: string;
  estimate: string;
  adminNotes: string;
};

export async function updateIdeaTriage(
  id: number,
  t: IdeaTriage,
): Promise<Result> {
  if (!(await isAdmin())) return { ok: false, error: "No autorizado." };

  const status = IDEA_STATUSES.includes(t.status as IdeaStatus)
    ? (t.status as IdeaStatus)
    : "nueva";
  const priority = IDEA_PRIORITIES.includes(t.priority as IdeaPriority)
    ? (t.priority as IdeaPriority)
    : null;

  await db
    .update(ideas)
    .set({
      status,
      priority,
      estimate: t.estimate?.trim() || null,
      adminNotes: t.adminNotes?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(ideas.id, id));

  revalidatePath("/ideas");
  revalidatePath("/admin/ideas");
  return { ok: true, id };
}

/** Quick status change (e.g. mark an idea as done) without the full triage form. */
export async function setIdeaStatus(
  id: number,
  status: string,
): Promise<Result> {
  if (!(await isAdmin())) return { ok: false, error: "No autorizado." };
  const next = IDEA_STATUSES.includes(status as IdeaStatus)
    ? (status as IdeaStatus)
    : "nueva";
  await db
    .update(ideas)
    .set({ status: next, updatedAt: new Date() })
    .where(eq(ideas.id, id));
  revalidatePath("/ideas");
  revalidatePath("/admin/ideas");
  return { ok: true, id };
}

export async function deleteIdea(id: number): Promise<Result> {
  if (!(await isAdmin())) return { ok: false, error: "No autorizado." };
  await db.delete(ideas).where(eq(ideas.id, id));
  revalidatePath("/ideas");
  revalidatePath("/admin/ideas");
  return { ok: true, id };
}
