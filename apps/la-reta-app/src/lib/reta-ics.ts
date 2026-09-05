import { VENUE, venueQuery } from "@repo/reta/venue";

import { nextReta } from "@/lib/reta-date";

/**
 * La próxima reta en formato iCalendar (RFC 5545).
 *
 * Va aparte de quien lo guarda y lo comparte porque es lo único aquí que se
 * puede equivocar en silencio: una fecha mal formada o una coma sin escapar
 * produce un archivo que el teléfono abre y descarta sin decir nada. Separado
 * del sistema de archivos, se ejecuta y se lee.
 */

/** Una reta dura sus dos horas de cancha. */
const DURATION_MS = 2 * 60 * 60 * 1000;

/** Formato de fecha de iCalendar en UTC: 20260917T010000Z. */
function icsDate(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

/**
 * Escapa según RFC 5545: la coma, el punto y coma y la barra invertida separan
 * valores dentro de una propiedad, y la dirección lleva comas.
 */
function icsText(value: string): string {
  return value.replace(/([,;\\])/g, "\\$1");
}

/** Tope de octetos por línea que fija el RFC. */
const LINE_LIMIT = 75;

/**
 * Parte las líneas largas como manda el RFC 5545: máximo 75 **octetos**, y la
 * continuación empieza con un espacio.
 *
 * Se cuenta en octetos y no en caracteres porque "Arcángeles" y "José" llevan
 * tildes, que en UTF-8 ocupan dos bytes: contando caracteres, la línea de la
 * dirección se pasaba del límite aun pareciendo corta. Los lectores tolerantes
 * —Apple entre ellos— se lo tragan sin plegar, pero un archivo que solo
 * funciona con los lectores amables no es un archivo que funcione.
 */
function fold(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= LINE_LIMIT) return line;

  const parts: string[] = [];
  let current = "";
  let budget = LINE_LIMIT;

  for (const char of line) {
    const size = encoder.encode(char).length;

    if (size > budget) {
      parts.push(current);
      current = "";
      // La continuación gasta un octeto en el espacio inicial.
      budget = LINE_LIMIT - 1;
    }

    current += char;
    budget -= size;
  }

  parts.push(current);
  return parts.join("\r\n ");
}

export function retaIcs(now: Date = new Date()): string {
  const reta = nextReta(now);
  const start = reta.kickoff;
  const end = new Date(start.getTime() + DURATION_MS);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//La Reta//ES",
    "BEGIN:VEVENT",
    // El id es estable por fecha: volver a añadir la misma reta actualiza el
    // evento en vez de duplicarlo.
    `UID:reta-${icsDate(start)}@lareta`,
    `DTSTAMP:${icsDate(now)}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    "SUMMARY:La Reta",
    `LOCATION:${icsText(venueQuery())}`,
    `DESCRIPTION:${icsText(`Reta en ${VENUE.name}.`)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:La Reta en 2 horas",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .map(fold)
    .join("\r\n");
}
