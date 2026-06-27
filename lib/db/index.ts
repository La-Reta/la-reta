import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type DB = NeonHttpDatabase<typeof schema>;

let instance: DB | null = null;

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
