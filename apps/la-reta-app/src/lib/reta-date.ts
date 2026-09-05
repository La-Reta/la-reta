/**
 * Cuándo es la próxima reta.
 *
 * Es una copia de apps/la-reta-web/lib/functions/compute-reta.ts, y lo es a
 * propósito: son doce líneas de aritmética de fechas sin dependencias, y pedirle
 * al backend un dato que el reloj del teléfono ya sabe sería una petición de más
 * que además falla sin señal. Si el ancla cambia, hay que cambiarla en los dos
 * sitios — cuando exista packages/api-contract, este es de los primeros que debe
 * mudarse.
 */

/** La reta cae cada 14 días. Ancla = un jueves conocido. */
const RETA_ANCHOR = "2026-07-09";
const CDMX_TZ = "America/Mexico_City";
/** México no usa horario de verano desde 2022, así que el offset es fijo. */
const CDMX_OFFSET = "-06:00";
const KICKOFF_TIME = "19:00:00";
const DAY_MS = 86_400_000;
const CYCLE_DAYS = 14;

const WEEKDAYS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];
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

export interface NextReta {
  daysUntil: number;
  kickoff: Date;
  /** "jueves 3 sep" — para enseñar junto al conteo. */
  label: string;
  /** Día y mes sueltos, para las fichas del calendario. */
  day: number;
  month: string;
}

export function nextReta(now: Date = new Date()): NextReta {
  const today = cdmxDate(now);
  const elapsed = Math.round(
    (Date.parse(`${today}T00:00:00Z`) -
      Date.parse(`${RETA_ANCHOR}T00:00:00Z`)) /
      DAY_MS
  );
  const intoCycle = ((elapsed % CYCLE_DAYS) + CYCLE_DAYS) % CYCLE_DAYS;
  const daysUntil = intoCycle === 0 ? 0 : CYCLE_DAYS - intoCycle;

  const dateStr = addDays(today, daysUntil);
  const kickoff = new Date(`${dateStr}T${KICKOFF_TIME}${CDMX_OFFSET}`);

  return {
    daysUntil,
    kickoff,
    label: labelFor(dateStr),
    day: Number(dateStr.slice(8, 10)),
    month: MONTHS[Number(dateStr.slice(5, 7)) - 1],
  };
}

/**
 * Las próximas `count` retas, empezando por la más cercana.
 *
 * Sale de la misma aritmética que `nextReta`, sumando ciclos de 14 días. No
 * hace falta pedirle el calendario al backend: la cadencia es fija y el reloj
 * del teléfono ya la sabe, así que también funciona sin señal.
 */
export function upcomingRetas(
  count: number,
  now: Date = new Date()
): NextReta[] {
  const first = nextReta(now);

  return Array.from({ length: count }, (_, index) => {
    if (index === 0) return first;

    const kickoff = new Date(
      first.kickoff.getTime() + index * CYCLE_DAYS * DAY_MS
    );
    const dateStr = kickoff.toISOString().slice(0, 10);

    return {
      daysUntil: first.daysUntil + index * CYCLE_DAYS,
      kickoff,
      label: labelFor(dateStr),
      day: Number(dateStr.slice(8, 10)),
      month: MONTHS[Number(dateStr.slice(5, 7)) - 1],
    };
  });
}

/** ¿Cae reta este día? La cadencia es fija, así que es pura aritmética. */
export function isRetaDay(ymd: string): boolean {
  const diff = Math.round(
    (Date.parse(`${ymd}T00:00:00Z`) - Date.parse(`${RETA_ANCHOR}T00:00:00Z`)) /
      DAY_MS
  );

  return ((diff % CYCLE_DAYS) + CYCLE_DAYS) % CYCLE_DAYS === 0;
}

export interface CalendarDay {
  /** "2026-09-17". Vacío en los huecos de relleno de la primera semana. */
  ymd: string;
  day: number;
  isReta: boolean;
  isToday: boolean;
  /** Fuera del mes que se está enseñando. */
  isOutside: boolean;
}

export const WEEKDAY_INITIALS = ["L", "M", "X", "J", "V", "S", "D"];
export const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/**
 * Retícula de un mes, en semanas que empiezan en lunes.
 *
 * Devuelve siempre semanas completas —rellenando con los días del mes anterior
 * y el siguiente— para que la cuadrícula no cambie de forma al cambiar de mes,
 * que es lo que hace que un calendario se sienta estable.
 */
export function monthGrid(
  year: number,
  month: number,
  now: Date = new Date()
): CalendarDay[][] {
  const today = cdmxDate(now);
  const first = new Date(Date.UTC(year, month, 1));
  // getUTCDay(): 0 = domingo. Se rota para que la semana empiece en lunes.
  const offset = (first.getUTCDay() + 6) % 7;
  const start = new Date(first.getTime() - offset * DAY_MS);

  const weeks: CalendarDay[][] = [];
  for (let week = 0; week < 6; week++) {
    const days: CalendarDay[] = [];
    for (let index = 0; index < 7; index++) {
      const date = new Date(start.getTime() + (week * 7 + index) * DAY_MS);
      const ymd = date.toISOString().slice(0, 10);
      days.push({
        ymd,
        day: date.getUTCDate(),
        isReta: isRetaDay(ymd),
        isToday: ymd === today,
        isOutside: date.getUTCMonth() !== month,
      });
    }
    weeks.push(days);
  }

  return weeks;
}

/** Cuenta atrás en palabras: el número solo no dice si es hoy o en dos semanas. */
export function countdownLabel(daysUntil: number): string {
  if (daysUntil === 0) return "Hoy";
  if (daysUntil === 1) return "Mañana";
  return `En ${daysUntil} días`;
}

/** Hoy en CDMX, para que el día de la reta no dependa de dónde esté el teléfono. */
function cdmxDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: CDMX_TZ }).format(date);
}

function addDays(ymd: string, days: number): string {
  return new Date(Date.parse(`${ymd}T00:00:00Z`) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

function labelFor(ymd: string): string {
  const date = new Date(`${ymd}T00:00:00Z`);
  const weekday = WEEKDAYS[date.getUTCDay()];
  const month = MONTHS[date.getUTCMonth()];

  return `${weekday} ${date.getUTCDate()} ${month}`;
}
