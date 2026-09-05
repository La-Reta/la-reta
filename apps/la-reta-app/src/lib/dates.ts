const MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

/**
 * Fecha corta en español a partir del `date` de Postgres ("2025-03-08").
 *
 * Se formatea a mano en vez de con `Intl`: la cadena no lleva zona horaria y
 * pasarla por `new Date()` la interpreta en UTC, que al oeste de Greenwich
 * devuelve el día anterior. Partirla por guiones no tiene ese problema.
 */
export function formatMatchDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);

  if (!year || !month || !day) return iso;

  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/**
 * "20 ago", sin año.
 *
 * Es la fecha de un eje o de una etiqueta apretada, donde el año ya lo pone el
 * contexto y cuatro cifras más obligarían a girar el texto.
 */
export function formatShortDate(iso: string): string {
  const [, month, day] = iso.slice(0, 10).split("-").map(Number);

  if (!month || !day) return iso;

  return `${day} ${MONTHS[month - 1]}`;
}
