import "server-only";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type DB = NeonHttpDatabase<typeof schema>;

let instance: DB | null = null;

// Neon scales the compute to zero when idle; the first query after a suspend can
// fail (network error or 5xx) while it wakes, and local network blips drop the
// occasional fetch. Retry with exponential backoff + jitter so pages don't 500
// on a transient failure. ponytail: ~250ms→2s backoff over 5 tries (~3.75s max);
// if a blip outlasts that the query still throws and the error boundary catches it.
const MAX_RETRIES = 4;

function backoff(attempt: number): Promise<void> {
  const ms = Math.min(250 * 2 ** attempt, 2000) + Math.random() * 100;
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(input, init);
      if (res.status >= 500 && attempt < MAX_RETRIES) {
        await backoff(attempt);
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES) await backoff(attempt);
    }
  }
  throw lastErr;
}

neonConfig.fetchFunction = fetchWithRetry;

function getDb(): DB {
  if (instance) return instance;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL no está definida. Copia .env.example a .env.local y pega tu connection string de Neon.",
    );
  }
  instance = drizzle(neon(url), { schema });
  return instance;
}

/**
 * Drizzle client. The underlying Neon connection is created lazily on first
 * query so importing this module (e.g. during `next build`) never requires the
 * env var to be present.
 */
export const db = new Proxy({} as DB, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real as object, prop);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export * from "./schema";
