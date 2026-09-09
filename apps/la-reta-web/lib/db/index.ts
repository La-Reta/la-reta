import "server-only";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
// Drizzle necesita el objeto de esquema entero para tipar las consultas; no hay
// "el miembro concreto" que importar.
// eslint-disable-next-line sonarjs/no-wildcard-import -- drizzle pide el esquema completo
import * as schema from "./schema";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

type DB = NeonHttpDatabase<typeof schema>;

let instance: DB | null = null;

// Neon scales the compute to zero when idle; the first query after a suspend can
// fail (network error or 5xx) while it wakes, and local network blips drop the
// occasional fetch. Retry with exponential backoff + jitter so pages don't 500
// on a transient failure. ponytail: ~250ms→3s backoff over 7 tries (~10.75s max)
// to outlast a cold start; if a blip outlasts that the query still throws and the
// error boundary catches it. Bump MAX_RETRIES if cold starts still slip through.
const MAX_RETRIES = 6;

async function backoff(attempt: number): Promise<void> {
  // El jitter solo desincroniza reintentos; no protege nada, así que
  // `Math.random` sobra de sobra y `crypto` sería ruido.
  // eslint-disable-next-line sonarjs/pseudo-random -- jitter, no criptografía
  const ms = Math.min(250 * 2 ** attempt, 3000) + Math.random() * 100;
  // Dormir es esto: no hay API de espera que no pase por un `new Promise`, y
  // `timers/promises` no existe en todos los runtimes donde corre esto.
  // eslint-disable-next-line promise/avoid-new -- no hay otra forma de esperar aquí
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Un intento. Devuelve `null` cuando el servidor contestó 5xx y todavía quedan
 * reintentos, para que quien llama vuelva a probar; los errores de red suben.
 */
async function attemptFetch(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  attempt: number
): Promise<Response | null> {
  const response = await fetch(input, init);
  if (response.status >= 500 && attempt < MAX_RETRIES) {
    await backoff(attempt);
    return null;
  }
  return response;
}

async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    let response: Response | null;
    try {
      // Secuencial a propósito: reintentar es esperar a que el anterior falle.
      // eslint-disable-next-line no-await-in-loop -- el reintento es serie por definición
      response = await attemptFetch(input, init, attempt);
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES) {
        // eslint-disable-next-line no-await-in-loop -- ídem
        await backoff(attempt);
      }
      continue;
    }
    if (response) {
      return response;
    }
  }
  throw lastError;
}

neonConfig.fetchFunction = fetchWithRetry;

function getDatabase(): DB {
  if (instance) {
    return instance;
  }
  const url = process.env.DATABASE_URL;
  if (url === undefined || url === "") {
    throw new Error(
      "DATABASE_URL no está definida. Copia .env.example a .env.local y pega tu connection string de Neon."
    );
  }
  // El singleton perezoso es justo el punto de este módulo: la conexión se crea
  // en la primera consulta para que `next build` no necesite la variable.
  // eslint-disable-next-line unicorn/no-top-level-assignment-in-function -- singleton perezoso deliberado
  instance = drizzle(neon(url), { schema });
  return instance;
}

/**
 * Drizzle client. The underlying Neon connection is created lazily on first
 * query so importing this module (e.g. during `next build`) never requires the
 * env var to be present.
 */
/*
 * Un Proxy sobre un objeto tipado es dinámico por naturaleza: `Reflect.get`
 * devuelve `any` y no hay forma de tiparlo sin mentir. El tipo bueno lo pone
 * `as DB` en la propia declaración, que es lo que ve quien lo usa.
 */
/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-type-assertion -- Proxy dinámico sobre un tipo estático */
// eslint-disable-next-line unicorn/name-replacements -- `db` es el nombre público del cliente en todo el repo
export const db = new Proxy({} as DB, {
  get(_target, property) {
    const real = getDatabase();
    const value = Reflect.get(real, property);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
/* eslint-enable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-type-assertion */

// Reexportar tablas y tipos desde `@/lib/db` es la convención del repo: cientos
// de `import { db, players } from "@/lib/db"` dependen de esto.
// eslint-disable-next-line sonarjs/no-wildcard-import -- convención establecida del repo
export * from "./schema";
