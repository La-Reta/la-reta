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
 * Las posiciones que alguien puede cubrir. Vive en `@repo/reta` porque el
 * balanceador y los filtros de la app la necesitan igual; se reexporta para no
 * tocar los sitios que ya la importan de aquí.
 */
export { playerPositions } from "@repo/reta/positions";

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
