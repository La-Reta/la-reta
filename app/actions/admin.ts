"use server";

import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminPin, LIVE_COOKIE, livePin } from "@/lib/admin";

export async function loginAdmin(pin: string) {
  if (pin?.trim() !== adminPin()) {
    return { ok: false as const, error: "PIN incorrecto." };
  }
  const store = await cookies();
  store.set(ADMIN_COOKIE, adminPin(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return { ok: true as const };
}

export async function logoutAdmin() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  return { ok: true as const };
}

export async function unlockLive(pin: string) {
  if (pin?.trim() !== livePin()) {
    return { ok: false as const, error: "Contraseña incorrecta." };
  }
  const store = await cookies();
  store.set(LIVE_COOKIE, livePin(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return { ok: true as const };
}
