/**
 * El mensaje de un `catch`, sin aserciones.
 *
 * Todas las server actions terminan en `catch (error) { return { ok: false,
 * error: ... } }` y hacían `(error as Error).message`: una aserción sobre algo
 * que puede ser cualquier cosa —un `throw "texto"`, un rechazo de fetch— y que
 * daría `undefined` en el mensaje justo cuando más falta hace saber qué pasó.
 * `Error.isError` lo comprueba de verdad, y funciona a través de realms (un
 * error nacido en otro contexto no pasa el `instanceof`).
 */
export function errorMessage(
  error: unknown,
  fallback = "Algo salió mal."
): string {
  if (Error.isError(error)) {
    return error.message;
  }
  return typeof error === "string" && error.length > 0 ? error : fallback;
}

interface Failure {
  ok: false;
  error: string;
}

/**
 * Envuelve el cuerpo de una server action.
 *
 * Un `throw` de dentro sale como `{ ok: false, error }` en vez de propagarse al
 * cliente como el HTML de error de Next, que un formulario no sabe leer. Antes
 * cada acción repetía su propio `try/catch` con `(error as Error).message`:
 * catorce copias de la misma decisión, y ninguna comprobaba de verdad que lo
 * lanzado fuera un Error.
 *
 * De paso deja un solo `try` por archivo y con una sola sentencia dentro, que
 * es lo que hace legible dónde empieza el camino de fallo.
 */
export async function guard<T>(run: () => Promise<T>): Promise<T | Failure> {
  try {
    return await run();
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}
