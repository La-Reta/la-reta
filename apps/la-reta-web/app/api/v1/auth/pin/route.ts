import { timingSafeEqual } from "node:crypto";
import { adminPin, livePin } from "@/lib/admin";
import { readJson } from "@/lib/api/errors";
import { handler, jsonError, jsonOk } from "@/lib/api/respond";
import { mintPinToken, TTL_SECONDS_FOR_CLIENTS } from "@/lib/api/tokens";

export const dynamic = "force-dynamic";

/**
 * Canjea un PIN por un token firmado, para clientes que no pueden usar las
 * cookies httpOnly del gate de admin (la app Expo).
 *
 * Ojo: esto expone la comprobación del PIN en un endpoint anónimo, cosa que
 * antes solo ocurría dentro de una Server Action. El PIN es corto y
 * compartido, así que el freno de abajo es necesario, no decorativo.
 */

/**
 * Throttle en memoria. En serverless el estado es **por instancia**, así que
 * frena a un script ingenuo pero no a un atacante que provoque fan-out. Es un
 * mínimo, no la defensa definitiva: lo correcto es moverlo a Postgres o a un
 * KV compartido (ver README de la API).
 */
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function throttled(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

/**
Evita filtrar la longitud del prefijo correcto por diferencia de tiempo.
*/
function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf-8");
  const right = Buffer.from(b, "utf-8");
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export const POST = handler(async (request: Request) => {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim() ??
    "unknown";
  if (throttled(ip)) {
    return jsonError(request, "Demasiados intentos. Espera unos minutos.", 429);
  }

  const body = await readJson<{ pin?: string; scope?: string }>(request);
  if (body === null) {
    return jsonError(request, "Cuerpo JSON inválido.", 400);
  }

  const { scope } = body;
  if (scope !== "admin" && scope !== "live") {
    return jsonError(request, "scope debe ser 'admin' o 'live'.", 400);
  }

  const pin = body.pin?.trim() ?? "";
  const expected = scope === "admin" ? adminPin() : livePin();
  if (!safeEqual(pin, expected)) {
    return jsonError(request, "PIN incorrecto.", 401);
  }

  const token = await mintPinToken(scope);
  return jsonOk(request, { token, expiresIn: TTL_SECONDS_FOR_CLIENTS });
});

export { preflight as OPTIONS } from "@/lib/api/respond";
