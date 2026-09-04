import { errorMessage } from "@/lib/api/errors";

/**
 * Resultado de un servicio de dominio.
 *
 * Los servicios no saben si los llama una Server Action o un route handler,
 * así que devuelven un `status` HTTP en vez de lanzar: el route handler lo usa
 * tal cual y la Server Action lo descarta, conservando la forma
 * `{ ok } | { ok, error }` que la web ya consume.
 */
export interface ServiceOk<T> {
  ok: true;
  data: T;
}
export interface ServiceError {
  ok: false;
  error: string;
  status: number;
}
export type ServiceResult<T = undefined> = ServiceOk<T> | ServiceError;

export function badRequest(error: string): ServiceError {
  return { ok: false, error, status: 400 };
}

export function unauthorized(error = "No autorizado."): ServiceError {
  return { ok: false, error, status: 401 };
}

export function forbidden(error = "Sin permisos."): ServiceError {
  return { ok: false, error, status: 403 };
}

export function notFound(error: string): ServiceError {
  return { ok: false, error, status: 404 };
}

export function conflict(error: string): ServiceError {
  return { ok: false, error, status: 409 };
}

export function serverError(error: string): ServiceError {
  return { ok: false, error, status: 500 };
}

export function ok(): ServiceResult;
export function ok<T>(data: T): ServiceResult<T>;
export function ok<T>(data?: T): ServiceResult<T | undefined> {
  return { ok: true, data };
}

/**
 * Adapta un resultado de servicio a lo que las Server Actions ya devolvían.
 * Sin esto habría que tocar todos los call sites de la web.
 */
export function toActionResult<T>(
  result: ServiceResult<T>
): { ok: true } | { ok: false; error: string } {
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Envoltorio que comparten todas las Server Actions: ejecuta el servicio,
 * revalida solo si salió bien y traduce cualquier excepción al mismo
 * `{ ok:false, error }` que la web ya espera. El try envuelve una sola
 * sentencia a propósito, para no tragarse errores del callback de éxito.
 */
export async function runAction<T>(
  run: () => Promise<ServiceResult<T>>,
  onSuccess?: () => void
): Promise<ActionResult> {
  let result: ServiceResult<T>;
  try {
    result = await run();
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
  if (result.ok) {
    onSuccess?.();
  }
  return toActionResult(result);
}
