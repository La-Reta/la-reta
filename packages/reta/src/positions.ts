/**
 * Posiciones y líneas de la reta.
 *
 * Vive en un paquete y no en cada app porque es la definición del dominio, no
 * una constante de pantalla: la web la usa para el enum de Postgres, la app
 * para los filtros de plantilla y el balanceador para repartir por líneas. Tres
 * copias de esta tabla es lo mismo que ninguna — a la primera posición nueva se
 * desincronizan y un jugador aparece como defensa en un cliente y medio en el
 * otro.
 *
 * Sin dependencias a propósito: lo importa el servidor, el navegador y Metro.
 */

// Ordenadas por línea. `as const` + tupla para que el pgEnum de Drizzle y las
// uniones de TS no se separen.
export const POSITIONS = [
  "GK",
  "RB",
  "RWB",
  "CB",
  "LB",
  "LWB",
  "CDM",
  "CM",
  "CAM",
  "RM",
  "LM",
  "RW",
  "LW",
  "CF",
  "ST",
] as const;

export type Position = (typeof POSITIONS)[number];

export type PositionGroup = "GK" | "DEF" | "MID" | "FWD";

const GROUP_BY_POSITION: Record<Position, PositionGroup> = {
  GK: "GK",
  RB: "DEF",
  RWB: "DEF",
  CB: "DEF",
  LB: "DEF",
  LWB: "DEF",
  CDM: "MID",
  CM: "MID",
  CAM: "MID",
  RM: "MID",
  LM: "MID",
  RW: "FWD",
  LW: "FWD",
  CF: "FWD",
  ST: "FWD",
};

/**
 * La línea de una posición. Cae a mediocampo si le llega algo desconocido.
 */
export function positionGroup(position: Position): PositionGroup {
  // La tabla no cubre lo que no es una posición, y el dato entra por JSON: una
  // posición nueva en el servidor no puede dejar a un cliente viejo con
  // `undefined` en la mano.
  const table: Partial<Record<Position, PositionGroup>> = GROUP_BY_POSITION;

  return table[position] ?? "MID";
}

export const isPosition = (value: unknown): value is Position =>
  typeof value === "string" && (POSITIONS as readonly string[]).includes(value);

/**
 * Las posiciones que alguien puede cubrir: la principal y, si es distinta, la
 * secundaria.
 *
 * Es una función y no `[position, position2]` a pelo por la comparación: la
 * base deja guardar la misma posición en los dos campos, y sin descartar el
 * duplicado un ST/ST se contaría dos veces en su línea y se leería "ST / ST".
 */
export function playerPositions<T extends string>(player: {
  position: T;
  position2?: T | null;
}): T[] {
  const second = player.position2;

  return second !== null && second !== undefined && second !== player.position
    ? [player.position, second]
    : [player.position];
}
