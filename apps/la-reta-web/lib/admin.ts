import { cookies, headers } from "next/headers";
import "server-only";
import { verifyPinToken } from "@/lib/api/tokens";

export const ADMIN_COOKIE = "reta_admin";

/**
 * Header que usan los clientes nativos en lugar de la cookie. No puede ser
 * `Authorization`: ahí viaja el token de sesión de Clerk.
 */
export const PIN_TOKEN_HEADER = "x-reta-pin-token";

/**
Shared admin PIN. Override with ADMIN_PIN in .env.local.
*/
export function adminPin(): string {
  return process.env.ADMIN_PIN ?? "reta2026";
}

async function pinTokenScope() {
  const store = await headers();
  return await verifyPinToken(store.get(PIN_TOKEN_HEADER));
}

/**
 * True when the current request carries a valid admin cookie (web) or a
 * signed admin token (native clients).
 */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  if (store.get(ADMIN_COOKIE)?.value === adminPin()) {
    return true;
  }
  return (await pinTokenScope()) === "admin";
}

// Live scoreboard access
export const LIVE_COOKIE = "reta_live";

/**
Separate password to open the live scoreboard. Override with LIVE_PIN.
*/
export function livePin(): string {
  return process.env.LIVE_PIN ?? "gol2026";
}

/**
Unlocked if the live cookie is valid, or the user is already admin.
*/
export async function isLiveUnlocked(): Promise<boolean> {
  const store = await cookies();
  if (store.get(ADMIN_COOKIE)?.value === adminPin()) {
    return true;
  }
  if (store.get(LIVE_COOKIE)?.value === livePin()) {
    return true;
  }
  // Un token de admin abre live, igual que la cookie de admin.
  const scope = await pinTokenScope();
  return scope === "live" || scope === "admin";
}
