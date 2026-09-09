import {
  CDMX_OFFSET,
  CDMX_TZ,
  DAY_MS,
  KICKOFF_TIME,
  RETA_ANCHOR,
} from "../match-dates";

/**
Fecha de hoy (YYYY-MM-DD) en CDMX, para que el día de la reta sea consistente.
*/
function cdmxDateString(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: CDMX_TZ });
  return formatter.format(date);
}

function addDaysString(ymd: string, days: number) {
  const shifted = new Date(Date.parse(`${ymd}T00:00:00Z`) + days * DAY_MS);
  return shifted.toISOString().slice(0, 10);
}

/**
Días hasta la próxima reta (0 = hoy) y el instante exacto de arranque (7pm CDMX).
*/
export function computeReta(now: Date) {
  const todayString = cdmxDateString(now);
  const elapsedDays = Math.round(
    (Date.parse(`${todayString}T00:00:00Z`) -
      Date.parse(`${RETA_ANCHOR}T00:00:00Z`)) /
      DAY_MS
  );
  const intoCycle = ((elapsedDays % 14) + 14) % 14;
  const daysUntil = intoCycle === 0 ? 0 : 14 - intoCycle;
  const retaDateString = addDaysString(todayString, daysUntil);
  const kickoff = new Date(`${retaDateString}T${KICKOFF_TIME}${CDMX_OFFSET}`);
  return { daysUntil, kickoff };
}
