import { timingSafeEqual } from "node:crypto";
import "server-only";

/**
 * Tokens firmados para los gates de PIN (admin y live).
 *
 * La web sigue usando las cookies httpOnly de `lib/admin.ts`. Un cliente
 * nativo no puede: no hay navegador que las guarde ni que las mande. Así que
 * el móvil canjea el PIN por uno de estos tokens y lo manda en cada petición.
 *
 * A diferencia de la cookie —que guarda el PIN en claro como su propio valor—
 * el token no lleva el secreto dentro y caduca, así que interceptarlo no
 * revela el PIN ni sirve para siempre.
 */

const encoder = new TextEncoder();

export type PinScope = "admin" | "live";

interface Payload {
  scope: PinScope;
  /**
  Epoch en segundos.
  */
  exp: number;
  iat: number;
}

/**
30 días, igual que el maxAge de las cookies, para no cambiar la UX.
*/
const TTL_SECONDS = 60 * 60 * 24 * 30;

/**
 * Falla en claro si no hay secreto en vez de caer a un default: un secreto
 * por defecto haría falsificables todos los tokens de admin.
 */
function secret(): string {
  const value = process.env.PIN_TOKEN_SECRET;
  if (value === undefined || value.length < 32) {
    throw new Error(
      "PIN_TOKEN_SECRET no está configurado (mínimo 32 caracteres). " +
        "Genera uno con: openssl rand -base64 32"
    );
  }
  return value;
}

function b64url(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function fromB64url(value: string): Buffer {
  return Buffer.from(value.replaceAll("-", "+").replaceAll("_", "/"), "base64");
}

async function sign(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return b64url(new Uint8Array(sig));
}

/**
Comparación en tiempo constante: un `===` filtra el prefijo correcto.
*/
function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf-8");
  const right = Buffer.from(b, "utf-8");
  // timingSafeEqual lanza si difieren en longitud, así que se compara antes;
  // la longitud de una firma HMAC no es secreta.
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export async function mintPinToken(scope: PinScope): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: Payload = { scope, iat: now, exp: now + TTL_SECONDS };
  const body = b64url(encoder.encode(JSON.stringify(payload)));
  return `v1.${body}.${await sign(body)}`;
}

/**
Devuelve el scope si el token es válido y no ha caducado; si no, null.
*/
export async function verifyPinToken(
  token: string | null | undefined
): Promise<PinScope | null> {
  if (typeof token !== "string" || token === "") {
    return null;
  }
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") {
    return null;
  }

  const [, body, sig] = parts;
  if (!safeEqual(sig, await sign(body))) {
    return null;
  }

  // El cuerpo viene de un token no confiable: se valida en runtime en vez de
  // afirmar el tipo, porque un `as Payload` haría creer a TS que el scope ya
  // es válido y volvería redundante la comprobación que de verdad hace falta.
  let parsed: unknown;
  try {
    parsed = JSON.parse(fromB64url(body).toString("utf-8"));
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) {
    return null;
  }

  if (!("scope" in parsed) || !("exp" in parsed)) {
    return null;
  }
  const { scope, exp } = parsed;
  if (typeof exp !== "number" || exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  if (scope === "admin" || scope === "live") {
    return scope;
  }
  return null;
}

export const TTL_SECONDS_FOR_CLIENTS = TTL_SECONDS;
