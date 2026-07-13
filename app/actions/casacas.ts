"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db, players, casacaAssignments } from "@/lib/db";
import { isAdmin } from "@/lib/admin";

/** Display name for the signed-in Clerk user, or null. */
function clerkDisplayName(
  user: Awaited<ReturnType<typeof currentUser>>,
): string | null {
  if (!user) return null;
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const email = user.primaryEmailAddress?.emailAddress?.split("@")[0];
  return user.username || full || email || null;
}

type Result =
  | { ok: true; spunByName: string | null }
  | { ok: false; error: string };

/**
 * Persist the wheel result. Pass `playerId` for a roster player or `guestName`
 * for a last-minute guest (not in `players`). Only a Clerk user or a PIN admin
 * may record it; we store who + when for a light audit.
 */
export async function recordCasacaSpin(target: {
  playerId?: number;
  guestName?: string;
}): Promise<Result> {
  const { userId } = await auth();
  const admin = await isAdmin();
  if (!userId && !admin) {
    return { ok: false, error: "Inicia sesión o entra como admin para girar." };
  }

  let playerId: number | null = null;
  let guestName: string | null = null;

  if (target.playerId != null) {
    const exists = await db
      .select({ id: players.id })
      .from(players)
      .where(eq(players.id, target.playerId))
      .limit(1);
    if (!exists[0]) return { ok: false, error: "Jugador no encontrado." };
    playerId = target.playerId;
  } else {
    guestName = target.guestName?.trim().slice(0, 60) || null;
    if (!guestName) return { ok: false, error: "Falta el nombre del invitado." };
  }

  const user = userId ? await currentUser() : null;
  const spunByName = clerkDisplayName(user) ?? (admin ? "Admin" : null);

  await db.insert(casacaAssignments).values({
    playerId,
    guestName,
    spunById: userId ?? null,
    spunByName,
  });

  revalidatePath("/casacas");
  return { ok: true, spunByName };
}
