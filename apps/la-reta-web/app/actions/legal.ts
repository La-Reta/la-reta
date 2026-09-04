"use server";

import { headers } from "next/headers";
import { db, legalAcceptances } from "@/lib/db";
import { LEGAL_CONSENT_VERSION } from "@/lib/legal";

export type LegalConsentClientInfo = {
  language?: string;
  languages?: string;
  timezone?: string;
  timezoneOffset?: number;
  screen?: string;
  viewport?: string;
  pixelRatio?: string;
  platform?: string;
  userAgent?: string;
  sourcePath?: string;
};

type Result = { ok: true } | { ok: false; error: string };

const ACCEPTED_DOCUMENTS = [
  "/legal",
  "/legal/privacidad",
  "/legal/terminos",
  "/legal/ia-y-contenido",
].join(",");

export async function acceptLegalTerms(
  client: LegalConsentClientInfo,
): Promise<Result> {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");
  const ipAddress =
    headerStore.get("cf-connecting-ip") ??
    headerStore.get("x-real-ip") ??
    firstForwardedIp(forwardedFor);

  try {
    await db.insert(legalAcceptances).values({
      legalVersion: LEGAL_CONSENT_VERSION,
      acceptedDocuments: ACCEPTED_DOCUMENTS,
      sourcePath: safeText(client.sourcePath, 120),
      language: safeText(client.language, 24),
      languages: safeText(client.languages, 240),
      timezone: safeText(client.timezone, 64),
      timezoneOffset:
        typeof client.timezoneOffset === "number"
          ? client.timezoneOffset
          : null,
      screen: safeText(client.screen, 32),
      viewport: safeText(client.viewport, 32),
      pixelRatio: safeText(client.pixelRatio, 16),
      platform: safeText(client.platform, 80),
      userAgent: client.userAgent || null,
      ipAddress: safeText(ipAddress, 64),
      forwardedFor: safeText(forwardedFor, 500),
      country: safeText(
        headerStore.get("cf-ipcountry") ??
          headerStore.get("x-vercel-ip-country"),
        8,
      ),
      acceptLanguage: safeText(headerStore.get("accept-language"), 240),
    });

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "No se pudo guardar la aceptación. Inténtalo de nuevo.",
    };
  }
}

function firstForwardedIp(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

function safeText(value: string | null | undefined, maxLength: number) {
  const clean = value?.trim();
  return clean ? clean.slice(0, maxLength) : null;
}
