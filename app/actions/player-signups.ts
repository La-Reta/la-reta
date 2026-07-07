"use server";

import { isAdmin } from "@/lib/admin";
import {
  FEET,
  POSITIONS,
  SIGNUP_STATUSES,
  type Foot,
  type Position,
  type SignupStatus,
} from "@/lib/constants";
import { db, playerSignups } from "@/lib/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

type Result = { ok: true; id?: number } | { ok: false; error: string };

export type SignupClientInfo = {
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

export type PlayerSignupInput = {
  name: string;
  displayName?: string;
  position: string;
  position2?: string;
  preferredFoot?: string;
  nationality?: string;
  photoUrl?: string;
  birthDate?: string;
  heightCm?: string | number;
  weightKg?: string | number;
  contact?: string;
  note?: string;
  client?: SignupClientInfo;
};

const inList = <T extends readonly string[]>(
  list: T,
  value: string | undefined,
): value is T[number] => !!value && list.includes(value);

const smallintOrNull = (value: string | number | undefined) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};

export async function createPlayerSignup(
  input: PlayerSignupInput,
): Promise<Result> {
  const name = input.name?.trim();
  if (!name) return { ok: false, error: "Tu nombre es obligatorio." };
  if (!inList(POSITIONS, input.position)) {
    return { ok: false, error: "Elige una posición." };
  }

  const position = input.position as Position;
  const position2 =
    inList(POSITIONS, input.position2) && input.position2 !== position
      ? (input.position2 as Position)
      : null;
  const preferredFoot: Foot = inList(FEET, input.preferredFoot)
    ? (input.preferredFoot as Foot)
    : "right";

  const requestInfo = await collectRequestInfo();

  const [row] = await db
    .insert(playerSignups)
    .values({
      name: name.slice(0, 120),
      displayName: input.displayName?.trim().slice(0, 60) || null,
      position,
      position2,
      preferredFoot,
      nationality: (input.nationality?.trim().toLowerCase() || "mx").slice(0, 2),
      photoUrl: input.photoUrl?.trim().slice(0, 500) || null,
      birthDate: input.birthDate?.trim() || null,
      heightCm: smallintOrNull(input.heightCm),
      weightKg: smallintOrNull(input.weightKg),
      contact: input.contact?.trim().slice(0, 160) || null,
      note: input.note?.trim() || null,
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
    .returning({ id: playerSignups.id });

  revalidatePath("/admin/registros");
  revalidatePath("/players");
  return { ok: true, id: row.id };
}

export async function updateSignupStatus(
  id: number,
  status: string,
  adminNotes?: string,
): Promise<Result> {
  if (!(await isAdmin())) return { ok: false, error: "No autorizado." };
  const next: SignupStatus = SIGNUP_STATUSES.includes(status as SignupStatus)
    ? (status as SignupStatus)
    : "pendiente";

  await db
    .update(playerSignups)
    .set({
      status: next,
      adminNotes: adminNotes?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(playerSignups.id, id));

  revalidatePath("/admin/registros");
  revalidatePath("/players");
  return { ok: true, id };
}

export async function deleteSignup(id: number): Promise<Result> {
  if (!(await isAdmin())) return { ok: false, error: "No autorizado." };
  await db.delete(playerSignups).where(eq(playerSignups.id, id));
  revalidatePath("/admin/registros");
  revalidatePath("/players");
  return { ok: true, id };
}

async function collectRequestInfo() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");

  return {
    ipAddress: safeText(
      headerStore.get("cf-connecting-ip") ??
        headerStore.get("x-real-ip") ??
        forwardedFor?.split(",")[0]?.trim(),
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

function safeText(value: string | null | undefined, maxLength: number) {
  const clean = value?.trim();
  return clean ? clean.slice(0, maxLength) : null;
}
