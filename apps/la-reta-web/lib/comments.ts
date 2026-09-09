import "server-only";
import type { currentUser } from "@clerk/nextjs/server";
import { MAX_BODY } from "@/lib/constants";

export { MAX_BODY } from "@/lib/constants";

/**
 * Lo que comparten las reseñas de jugador y las de partido.
 *
 * Vive aquí y no en `app/actions/comments.ts` porque ese archivo lleva
 * `"use server"`: cuanto se exporta desde ahí tiene que ser una función
 * asíncrona, así que un ayudante síncrono no puede salir de él. Antes eran privados de ese
 * módulo; al aparecer el segundo tipo de reseña, copiarlos habría dejado dos
 * validaciones que envejecen por separado — y son justo las que deciden quién
 * firma y qué emoji entra.
 */

export interface ClientInfo {
  language?: string;
  timezone?: string;
  screen?: string;
  platform?: string;
  userAgent?: string;
}

export interface CommentInput {
  body: string;
  rating: number;
  client: ClientInfo;
}

export type CommentResult = { ok: true } | { ok: false; error: string };

export const UNAUTHORIZED = "No autorizado.";

export const MIN_RATING = 1;
export const MAX_RATING = 5;

/**
 * Nombre visible del usuario de Clerk con sesión, o `null`.
 */
export function clerkDisplayName(
  user: Awaited<ReturnType<typeof currentUser>>
): string | null {
  if (!user) {
    return null;
  }
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ");
  // Fallback al email (parte local) cuando no hay username ni nombre.
  const email = user.primaryEmailAddress?.emailAddress.split("@", 1)[0];
  // Se busca el primero **no vacío**, no el primero no nulo: Clerk devuelve ""
  // en los campos que el usuario no rellenó, y con `??` esa cadena vacía se
  // daría por buena y el autor saldría en blanco.
  return (
    [user.username, full, email].find((v) => v != null && v !== "") ?? null
  );
}

// Reusar el segmenter (crearlo por llamada es caro).
const graphemes = new Intl.Segmenter();

/**
 * True cuando `s` es exactamente un emoji (incluidas secuencias ZWJ y
 * modificadores). Usa `Intl.Segmenter` (un solo grapheme cluster) + property
 * Unicode, sin depender de `emoji-regex`. Ojo: los keycaps tipo "1️⃣" pueden no
 * pasar; los emojis de reacción habituales (👍❤️😂) sí.
 */
export function isSingleEmoji(s: string): boolean {
  if (s === "" || s.length > 16) {
    return false;
  }
  const segments = [...graphemes.segment(s)];
  return segments.length === 1 && /\p{Extended_Pictographic}/u.test(s);
}

/**
 * Recorta a `max` y convierte el vacío en `null`. Las columnas de metadatos
 * admiten null, y una cadena vacía guardada ocupa lo mismo que un dato y no
 * dice nada.
 */
export function trimmedOrNull(
  value: string | undefined,
  max: number
): string | null {
  return value === undefined || value === "" ? null : value.slice(0, max);
}

/**
 * Normaliza la nota que llega del cliente: entero de 1 a 5, o `null`.
 *
 * `null` y no un 0 ni un error: dejar reseña sin poner estrellas es válido, y
 * un 0 guardado arrastraría la media del partido hacia abajo como si alguien lo
 * hubiera puntuado pésimo.
 */
export function normalizeRating(raw: unknown): number | null {
  return typeof raw === "number" && raw >= MIN_RATING && raw <= MAX_RATING
    ? Math.round(raw)
    : null;
}

/**
 * Valida el cuerpo de una reseña. Devuelve el texto ya recortado o el error
 * que hay que enseñar.
 */
export function validateBody(
  raw: string | undefined
): { ok: true; body: string } | { ok: false; error: string } {
  const body = raw?.trim();
  if (body === undefined || body === "") {
    return { ok: false, error: "Escribe un comentario." };
  }
  if (body.length > MAX_BODY) {
    return { ok: false, error: `Máximo ${MAX_BODY} caracteres.` };
  }
  return { ok: true, body };
}
