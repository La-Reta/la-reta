/**
 * Utilidades que comparten todos los route handlers de /api/v1 y los
 * envoltorios de Server Actions.
 */

/**
 * Mensaje de un error desconocido sin afirmar que es un `Error`. Un `catch`
 * puede recibir cualquier cosa, así que `err as Error` es una promesa que el
 * runtime no garantiza.
 */
export function errorMessage(error: unknown): string {
  if (Error.isError(error)) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Error inesperado.";
}

/**
 * Lee el cuerpo JSON de una petición. Devuelve `null` si no es JSON válido,
 * para que el handler responda 400 en vez de reventar con un 500.
 */
export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    // request.json() devuelve `any` por contrato: tipar la entrada de la red
    // es precisamente la aserción que el llamador está haciendo a conciencia.
    // biome-ignore lint: límite HTTP
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- el cuerpo de una petición no es tipable sin aserción
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

/**
Parsea un id numérico de ruta. `null` si no es un entero positivo.
*/
export function parseId(value: string): number | null {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export const INVALID_ID = "id inválido.";
