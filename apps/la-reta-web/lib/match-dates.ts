/*
 * ponytail: la reta cae cada 14 días. Ancla = próximo jueves conocido; edítala
 * a tu fecha real y lo demás se deriva solo.
 */
/**
 * Un jueves.
 */
export const RETA_ANCHOR = "2026-07-09";
// La reta arranca 7pm hora CDMX. México no usa horario de verano desde 2022, así
// que CDMX es UTC-6 fijo — anclamos el instante con ese offset para que el conteo
// sea correcto sin importar la zona horaria del visitante.
export const CDMX_TZ = "America/Mexico_City";
export const CDMX_OFFSET = "-06:00";
/**
 * 7:00 pm CDMX.
 */
export const KICKOFF_TIME = "19:00:00";
export const DAY_MS = 86_400_000;
/**
 * Se muestra cuando falten ≤2 días; se oculta pasada la reta.
 */
export const SHOW_WITHIN_DAYS = 2;
