"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db, players, casacaAssignments } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { safeText } from "@/lib/text";
import { errorMessage } from "@/lib/errors";

/**
Display name for the signed-in Clerk user, or null.
*/
function clerkDisplayName(
  user: Awaited<ReturnType<typeof currentUser>>
): string | null {
  if (!user) {
    return null;
  }
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const email = user.primaryEmailAddress?.emailAddress.split("@", 1)[0];
  // El primero que traiga algo. Con `??` una cadena vacía ganaría y devolvería
  // "" en vez de caer al siguiente, que es lo que hacía el `||` encadenado.
  return (
    [user.username, full, email].find(
      (value): value is string =>
        value !== null && value !== undefined && value !== ""
    ) ?? null
  );
}

type Result =
  { ok: true; spunByName: string | null } | { ok: false; error: string };

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
  if (userId === null && !admin) {
    return { ok: false, error: "Inicia sesión o entra como admin para girar." };
  }

  let playerId: number | null = null;
  let guestName: string | null = null;

  if (target.playerId == null) {
    guestName = safeText(target.guestName, 60);
    if (guestName === null) {
      return { ok: false, error: "Falta el nombre del invitado." };
    }
  } else {
    const exists = await db
      .select({ id: players.id })
      .from(players)
      .where(eq(players.id, target.playerId))
      .limit(1);
    if (exists.at(0) === undefined) {
      return { ok: false, error: "Jugador no encontrado." };
    }
    ({ playerId } = target);
  }

  const user = userId === null ? null : await currentUser();
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

/**
 * Borra un turno del historial. Solo admin: sirve cuando el elegido no apareció
 * o no aceptó, y hay que dejar el turno como si nunca hubiera salido — al
 * quitarlo vuelve a entrar al sorteo (la ruleta excluye a los últimos dos).
 */
export async function deleteCasacaAssignment(
  id: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await isAdmin())) {
    return { ok: false, error: "No autorizado." };
  }
  try {
    await db.delete(casacaAssignments).where(eq(casacaAssignments.id, id));
    revalidatePath("/casacas");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}
