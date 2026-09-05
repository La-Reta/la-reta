const WHITE_FLAG = "🏳️";
const ISO2 = /^[A-Z]{2}$/u;
const WHITESPACE = /\s+/u;

/**
 * Distancia entre "A" (0x41) y 🇦 (0x1F1E6): sumársela a cada letra la convierte
 * en su símbolo indicador regional, y dos de esos juntos son una bandera.
 */
const REGIONAL_INDICATOR_OFFSET =
  ("🇦".codePointAt(0) ?? 0) - ("A".codePointAt(0) ?? 0);

/**
Turns an ISO 3166-1 alpha-2 code ("no", "mx") into a flag emoji.
*/
export function flagEmoji(iso2: string | null | undefined): string {
  const code = iso2?.toUpperCase();
  if (code === undefined || !ISO2.test(code)) {
    return WHITE_FLAG;
  }
  // `Array.from` recorre por code point, no por unidad UTF-16.
  const points = Array.from(
    code,
    (letter) => (letter.codePointAt(0) ?? 0) + REGIONAL_INDICATOR_OFFSET
  );
  return String.fromCodePoint(...points);
}

/**
 * Las posiciones que alguien puede cubrir. Vive en `@repo/reta` porque el
 * balanceador y los filtros de la app la necesitan igual; se reexporta para no
 * tocar los sitios que ya la importan de aquí.
 */
export { playerPositions } from "@repo/reta/positions";

const SEC_PER_MIN = 60;
const SEC_PER_HOUR = 3600;

const pad = (n: number) => String(n).padStart(2, "0");

/**
Seconds → "M:SS" (or "H:MM:SS" past an hour).
*/
export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / SEC_PER_HOUR);
  const m = Math.floor((s % SEC_PER_HOUR) / SEC_PER_MIN);
  const sec = s % SEC_PER_MIN;
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

const MAX_INITIALS = 2;

/**
Initials from a name, max 2 chars: "Erling Haaland" -> "EH".
*/
export function initials(name: string): string {
  return name
    .trim()
    .split(WHITESPACE)
    .filter((word) => word.length > 0)
    .slice(0, MAX_INITIALS)
    .map((word) => word.slice(0, 1).toUpperCase())
    .join("");
}
