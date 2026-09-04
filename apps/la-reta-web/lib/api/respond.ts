import type { ServiceResult } from "@/lib/services/result";
import { errorMessage } from "@/lib/api/errors";

/**
 * Respuestas HTTP uniformes para /api/v1.
 *
 * Éxito devuelve el dato desnudo (sin envoltorio) y el error un
 * `{ error }` con el status correcto, para que el cliente pueda distinguir
 * por código sin parsear el cuerpo.
 */

/**
 * Un cliente nativo no manda `Origin`, así que CORS solo importa para Expo
 * web. Los orígenes permitidos se declaran en API_ALLOWED_ORIGINS (separados
 * por coma); sin esa variable no se permite ninguno, que es el default seguro.
 */
function allowedOrigins(): string[] {
  return (process.env.API_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  if (origin === null || !allowedOrigins().includes(origin)) {
    return {};
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":
      "content-type,authorization,x-reta-pin-token",
    Vary: "Origin",
  };
}

export function preflight(request: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export function jsonOk(
  request: Request,
  data: unknown,
  status = 200
): Response {
  return Response.json(data, { status, headers: corsHeaders(request) });
}

export function jsonError(
  request: Request,
  error: string,
  status: number
): Response {
  return Response.json({ error }, { status, headers: corsHeaders(request) });
}

/**
Traduce el resultado de un servicio a una respuesta HTTP.
*/
export function respond<T>(
  request: Request,
  result: ServiceResult<T>,
  successStatus = 200
): Response {
  return result.ok
    ? jsonOk(request, result.data ?? { ok: true }, successStatus)
    : jsonError(request, result.error, result.status);
}

/**
 * Envuelve un handler para que un fallo inesperado salga como 500 con JSON en
 * vez de como el HTML de error de Next, que un cliente móvil no sabe leer.
 */
export function handler<C = unknown>(
  route: (request: Request, context: C) => Promise<Response>
) {
  return async (request: Request, context: C): Promise<Response> => {
    try {
      return await route(request, context);
    } catch (error) {
      return jsonError(request, errorMessage(error), 500);
    }
  };
}
