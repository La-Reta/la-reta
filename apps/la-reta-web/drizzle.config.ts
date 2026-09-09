import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

/*
 * Load env for drizzle-kit (push/generate). .env.local wins over .env.
 * Cargar al importar es el contrato de `drizzle.config.ts`: drizzle-kit lo lee
 * antes de mirar `dbCredentials`.
 */
/* eslint-disable unicorn/no-top-level-side-effects -- drizzle-kit espera esto al importar */
config({ path: ".env.local" });
config({ path: ".env" });
/* eslint-enable unicorn/no-top-level-side-effects */

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  verbose: true,
  strict: true,
});
