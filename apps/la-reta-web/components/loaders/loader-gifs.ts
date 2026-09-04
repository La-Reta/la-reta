import "server-only";
import { readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * All animated loaders dropped in `public/loaders`, as public paths. Read fresh
 * each call so newly added files show up without a restart (same idea as
 * `playerImageMap`). Selection is done client-side (see GifLoader) so it isn't
 * frozen by Next's RSC/router cache.
 */
export function loaderGifs(): string[] {
  try {
    return readdirSync(join(process.cwd(), "public", "loaders"))
      .filter((f) => f.toLowerCase().endsWith(".webp"))
      .map((f) => `/loaders/${f}`);
  } catch {
    return [];
  }
}
