import {
  CDMX_OFFSET,
  CDMX_TZ,
  DAY_MS,
  KICKOFF_TIME,
  RETA_ANCHOR,
} from "../match-dates";

/** Fecha de hoy (YYYY-MM-DD) en CDMX, para que el día de la reta sea consistente. */
function cdmxDateStr(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: CDMX_TZ }).format(date);
}

function addDaysStr(ymd: string, days: number) {
  return new Date(Date.parse(`${ymd}T00:00:00Z`) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/** Días hasta la próxima reta (0 = hoy) y el instante exacto de arranque (7pm CDMX). */
export function computeReta(now: Date) {
  const todayStr = cdmxDateStr(now);
  const elapsedDays = Math.round(
    (Date.parse(`${todayStr}T00:00:00Z`) -
      Date.parse(`${RETA_ANCHOR}T00:00:00Z`)) /
      DAY_MS,
  );
  const mod = ((elapsedDays % 14) + 14) % 14;
  const daysUntil = mod === 0 ? 0 : 14 - mod;
  const retaDateStr = addDaysStr(todayStr, daysUntil);
  const kickoff = new Date(`${retaDateStr}T${KICKOFF_TIME}${CDMX_OFFSET}`);
  return { daysUntil, kickoff };
}
