"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { isAdmin } from "@/lib/admin";
import { db, reports } from "@/lib/db";
import {
  REPORT_CATEGORIES,
  REPORT_STATUSES,
  type ReportCategory,
  type ReportStatus,
} from "@/lib/constants";

type Result = { ok: true; id?: number } | { ok: false; error: string };

export type ReportClientInfo = {
  language?: string;
  languages?: string;
  timezone?: string;
  timezoneOffset?: number;
  screen?: string;
  viewport?: string;
  pixelRatio?: string;
  platform?: string;
  userAgent?: string;
};

export type ReportInput = {
  title: string;
  description: string;
  category: string;
  reporterName?: string;
  contact?: string;
  relatedPath?: string;
  client?: ReportClientInfo;
};

export async function createReport(input: ReportInput): Promise<Result> {
  const title = input.title?.trim();
  const description = input.description?.trim();

  if (!title) return { ok: false, error: "El título es obligatorio." };
  if (!description) return { ok: false, error: "Describe qué está pasando." };

  const category = REPORT_CATEGORIES.includes(input.category as ReportCategory)
    ? (input.category as ReportCategory)
    : "ayuda";

  const requestInfo = await collectRequestInfo();

  const [row] = await db
    .insert(reports)
    .values({
      title: title.slice(0, 140),
      description,
      category,
      reporterName: input.reporterName?.trim().slice(0, 80) || null,
      contact: input.contact?.trim().slice(0, 160) || null,
      relatedPath: input.relatedPath?.trim().slice(0, 240) || null,
      language: safeText(input.client?.language, 24),
      languages: safeText(input.client?.languages, 240),
      timezone: safeText(input.client?.timezone, 64),
      timezoneOffset:
        typeof input.client?.timezoneOffset === "number"
          ? input.client.timezoneOffset
          : null,
      screen: safeText(input.client?.screen, 32),
      viewport: safeText(input.client?.viewport, 32),
      pixelRatio: safeText(input.client?.pixelRatio, 16),
      platform: safeText(input.client?.platform, 80),
      userAgent: input.client?.userAgent || null,
      ...requestInfo,
    })
    .returning({ id: reports.id });

  revalidatePath("/admin/reportes");
  return { ok: true, id: row.id };
}

export type ReportTriage = {
  status: string;
  adminNotes: string;
};

export async function updateReportTriage(
  id: number,
  triage: ReportTriage,
): Promise<Result> {
  if (!(await isAdmin())) return { ok: false, error: "No autorizado." };

  const status = REPORT_STATUSES.includes(triage.status as ReportStatus)
    ? (triage.status as ReportStatus)
    : "nuevo";

  await db
    .update(reports)
    .set({
      status,
      adminNotes: triage.adminNotes?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(reports.id, id));

  revalidatePath("/admin/reportes");
  return { ok: true, id };
}

export async function deleteReport(id: number): Promise<Result> {
  if (!(await isAdmin())) return { ok: false, error: "No autorizado." };
  await db.delete(reports).where(eq(reports.id, id));
  revalidatePath("/admin/reportes");
  return { ok: true, id };
}

async function collectRequestInfo() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");

  return {
    ipAddress: safeText(
      headerStore.get("cf-connecting-ip") ??
        headerStore.get("x-real-ip") ??
        firstForwardedIp(forwardedFor),
      64,
    ),
    forwardedFor: safeText(forwardedFor, 500),
    country: safeText(
      headerStore.get("cf-ipcountry") ?? headerStore.get("x-vercel-ip-country"),
      8,
    ),
    region: safeText(headerStore.get("x-vercel-ip-country-region"), 120),
    city: safeText(headerStore.get("x-vercel-ip-city"), 120),
    latitude: safeText(headerStore.get("x-vercel-ip-latitude"), 40),
    longitude: safeText(headerStore.get("x-vercel-ip-longitude"), 40),
    acceptLanguage: safeText(headerStore.get("accept-language"), 240),
  };
}

function firstForwardedIp(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

function safeText(value: string | null | undefined, maxLength: number) {
  const clean = value?.trim();
  return clean ? clean.slice(0, maxLength) : null;
}
