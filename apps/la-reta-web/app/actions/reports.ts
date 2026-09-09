"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { isAdmin } from "@/lib/admin";
import { db, reports } from "@/lib/db";
import { REPORT_CATEGORIES, REPORT_STATUSES } from "@/lib/constants";
import { optionalText, safeText } from "@/lib/text";
import { inList } from "@/lib/guards";

type Result = { ok: true; id?: number } | { ok: false; error: string };

function firstForwardedIp(value: string | null) {
  return optionalText(value?.split(",", 1)[0]);
}

async function collectRequestInfo() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");

  return {
    ipAddress: safeText(
      headerStore.get("cf-connecting-ip") ??
        headerStore.get("x-real-ip") ??
        firstForwardedIp(forwardedFor),
      64
    ),
    forwardedFor: safeText(forwardedFor, 500),
    country: safeText(
      headerStore.get("cf-ipcountry") ?? headerStore.get("x-vercel-ip-country"),
      8
    ),
    region: safeText(headerStore.get("x-vercel-ip-country-region"), 120),
    city: safeText(headerStore.get("x-vercel-ip-city"), 120),
    latitude: safeText(headerStore.get("x-vercel-ip-latitude"), 40),
    longitude: safeText(headerStore.get("x-vercel-ip-longitude"), 40),
    acceptLanguage: safeText(headerStore.get("accept-language"), 240),
  };
}

export interface ReportClientInfo {
  language?: string;
  languages?: string;
  timezone?: string;
  timezoneOffset?: number;
  screen?: string;
  viewport?: string;
  pixelRatio?: string;
  platform?: string;
  userAgent?: string;
}

/**
 * Lo que llega del cliente. Los campos van opcionales aunque el formulario
 * siempre los mande: esto es una frontera y el cliente es manipulable.
 * Declarándolos obligatorios, TypeScript daba por muertas las guardas `?.` que
 * en ejecución sí hacen falta.
 */
export interface ReportInput {
  title?: string;
  description?: string;
  category?: string;
  reporterName?: string;
  contact?: string;
  relatedPath?: string;
  client?: ReportClientInfo;
}

const ADMIN_REPORTS_PATH = "/admin/reportes";

export async function createReport(input: ReportInput): Promise<Result> {
  const title = optionalText(input.title);
  if (title === null) {
    return { ok: false, error: "El título es obligatorio." };
  }
  const description = optionalText(input.description);
  if (description === null) {
    return { ok: false, error: "Describe qué está pasando." };
  }

  const category = inList(REPORT_CATEGORIES, input.category)
    ? input.category
    : "ayuda";

  const requestInfo = await collectRequestInfo();

  const [row] = await db
    .insert(reports)
    .values({
      title: title.slice(0, 140),
      description,
      category,
      reporterName: safeText(input.reporterName, 80),
      contact: safeText(input.contact, 160),
      relatedPath: safeText(input.relatedPath, 240),
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
      userAgent: optionalText(input.client?.userAgent),
      ...requestInfo,
    })
    .returning({ id: reports.id });

  revalidatePath(ADMIN_REPORTS_PATH);
  return { ok: true, id: row.id };
}

export interface ReportTriage {
  status: string;
  adminNotes: string;
}

export async function updateReportTriage(
  id: number,
  triage: ReportTriage
): Promise<Result> {
  if (!(await isAdmin())) {
    return { ok: false, error: "No autorizado." };
  }

  const status = inList(REPORT_STATUSES, triage.status)
    ? triage.status
    : "nuevo";

  await db
    .update(reports)
    .set({
      status,
      adminNotes: optionalText(triage.adminNotes),
      updatedAt: new Date(),
    })
    .where(eq(reports.id, id));

  revalidatePath(ADMIN_REPORTS_PATH);
  return { ok: true, id };
}

export async function deleteReport(id: number): Promise<Result> {
  if (!(await isAdmin())) {
    return { ok: false, error: "No autorizado." };
  }
  await db.delete(reports).where(eq(reports.id, id));
  revalidatePath(ADMIN_REPORTS_PATH);
  return { ok: true, id };
}
