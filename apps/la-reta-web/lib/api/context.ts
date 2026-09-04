import "server-only";
import { auth } from "@clerk/nextjs/server";
import { isAdmin, isLiveUnlocked } from "@/lib/admin";

/**
 * Quién hace la petición, resuelto igual para los dos clientes.
 *
 * `auth()` de Clerk lee tanto la cookie `__session` (web) como
 * `Authorization: Bearer` (nativo), así que el userId sale del mismo sitio en
 * ambos. Los gates de PIN los resuelve `lib/admin.ts`, que acepta cookie o
 * token firmado.
 */
export interface Actor {
  userId: string | null;
  isAdmin: boolean;
  liveUnlocked: boolean;
}

export async function getActor(): Promise<Actor> {
  const [{ userId }, admin, live] = await Promise.all([
    auth(),
    isAdmin(),
    isLiveUnlocked(),
  ]);
  return { userId: userId ?? null, isAdmin: admin, liveUnlocked: live };
}

/**
 * Varias acciones sensibles permiten admin **o** usuario con cuenta, tal como
 * documenta CLAUDE.md. Se centraliza aquí para no repetir la regla.
 */
export function canMutate(actor: Actor): boolean {
  return actor.isAdmin || actor.userId !== null;
}
