import "server-only";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "reta_admin";

/** Shared admin PIN. Override with ADMIN_PIN in .env.local. */
export function adminPin(): string {
  return process.env.ADMIN_PIN || "reta2026";
}

/** True when the current request carries a valid admin cookie. */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === adminPin();
}

// ── Live scoreboard access ───────────────────────────────────────────────────
export const LIVE_COOKIE = "reta_live";

/** Separate password to open the live scoreboard. Override with LIVE_PIN. */
export function livePin(): string {
  return process.env.LIVE_PIN || "gol2026";
}

/** Unlocked if the live cookie is valid, or the user is already admin. */
export async function isLiveUnlocked(): Promise<boolean> {
  const store = await cookies();
  if (store.get(ADMIN_COOKIE)?.value === adminPin()) return true;
  return store.get(LIVE_COOKIE)?.value === livePin();
}
