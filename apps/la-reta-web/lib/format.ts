/** Turns an ISO 3166-1 alpha-2 code ("no", "mx") into a flag emoji. */
export function flagEmoji(iso2: string | null | undefined): string {
  if (!iso2 || iso2.length !== 2) return "🏳️";
  const code = iso2.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "🏳️";
  return String.fromCodePoint(
    ...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

/**
 * The positions a player can fill: primary plus an optional, distinct secondary.
 * Structural input so it works with rows, form state, or partial objects.
 */
export function playerPositions<T extends string>(p: {
  position: T;
  position2?: T | null;
}): T[] {
  return p.position2 && p.position2 !== p.position
    ? [p.position, p.position2]
    : [p.position];
}

/** Seconds → "M:SS" (or "H:MM:SS" past an hour). */
export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/** Initials from a name, max 2 chars: "Erling Haaland" -> "EH". */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
