import "server-only";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type DB = NeonHttpDatabase<typeof schema>;

let instance: DB | null = null;

// Neon scales the compute to zero when idle; the first query after a suspend can
// fail (network error or 5xx) while it wakes. Retry transient failures so pages
// don't 500 on a cold DB. ponytail: fixed 2 retries; revisit if waits grow.
async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const res = await fetch(input, init);
      if (res.status >= 500 && attempt < 2) {
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < 2)
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
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
