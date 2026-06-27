import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load env for drizzle-kit (push/generate). .env.local wins over .env.
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
