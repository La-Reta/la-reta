import { positionGroup } from "@repo/reta/positions";

import type { IconName } from "@/components/ui/icon";
import { playerPositions } from "@/lib/players";
import type { Player } from "@/lib/types";

/**
 * Buscar y ordenar la plantilla.
 *
 * Todo pasa en el teléfono: `/api/v1/players` trae el roster entero una vez y
 * de ahí no se vuelve a pedir nada. Escribir en el buscador no llama al
 * servidor, así que no hay nada que "no sobrecargar" — lo que sí importa es que
 * la lista no bloquee el teclado, y de eso se encarga la pantalla.
 */

/**
 * Texto comparable: sin mayúsculas y sin tildes.
 *
 * Sin esto, buscar "tono" no encontraba a TOÑO y "vazquez" fallaba con
 * VÁZQUEZ. Nadie escribe acentos en un buscador.
 */
function comparable(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/**
 * Filtra por nombre, apodo o posición.
 *
 * La posición entra a propósito: en una reta se busca "portero" tanto como se
 * busca a alguien por su nombre, y escribir "gk" es más rápido que ir al filtro.
 */
export function searchPlayers(players: Player[], query: string): Player[] {
  const needle = comparable(query);
  if (needle.length === 0) return players;

  return players.filter((player) => {
    const haystack = [
      player.displayName,
      player.name,
      ...playerPositions(player),
    ].map(comparable);

    return haystack.some((value) => value.includes(needle));
  });
}

export type SortKey =
  "overall-desc" | "overall-asc" | "age-desc" | "age-asc" | "position" | "name";

export const DEFAULT_SORT: SortKey = "overall-desc";

/**
 * El icono dice **de qué** ordena y el texto dice hacia dónde.
 *
 * Por eso los dos criterios de nivel comparten estrella y los dos de edad
 * comparten calendario: buscar "el de la edad" en una lista de seis renglones
 * casi iguales se hace por la forma, no leyendo cada uno hasta encontrarlo. Son
 * los mismos iconos que la app ya usa para esos datos —la estrella es "Nivel"
 * en la tira de cifras de Inicio—, así que no hay nada nuevo que aprender.
 */
export const SORTS: { key: SortKey; label: string; icon: IconName }[] = [
  { key: "overall-desc", label: "Nivel · mayor a menor", icon: "star" },
  { key: "overall-asc", label: "Nivel · menor a mayor", icon: "star" },
  { key: "age-desc", label: "Edad · mayor a menor", icon: "calendar" },
  { key: "age-asc", label: "Edad · menor a mayor", icon: "calendar" },
  {
    key: "position",
    label: "Posición · de portería a delantera",
    icon: "jersey",
  },
  { key: "name", label: "Nombre · A a Z", icon: "alphabet" },
];

/** El orden de las líneas en una alineación, no el alfabético. */
const LINE_ORDER = { GK: 0, DEF: 1, MID: 2, FWD: 3 };

const byName = (a: Player, b: Player) =>
  a.displayName.localeCompare(b.displayName, "es");

/**
 * Ordena una copia; nunca la lista original.
 *
 * `sort` muta, y la lista viene del hook de datos: ordenarla en su sitio
 * cambiaría lo que ven las demás pantallas sin que nadie se lo haya pedido.
 *
 * Todos los criterios desempatan por nombre para que el orden sea estable: con
 * cinco jugadores de 45, sin desempate la lista baila en cada render.
 */
export function sortPlayers(players: Player[], sort: SortKey): Player[] {
  const list = [...players];

  switch (sort) {
    case "overall-asc":
      return list.sort((a, b) => a.overall - b.overall || byName(a, b));
    case "age-desc":
      return list.sort((a, b) => b.age - a.age || byName(a, b));
    case "age-asc":
      return list.sort((a, b) => a.age - b.age || byName(a, b));
    case "position":
      return list.sort(
        (a, b) =>
          LINE_ORDER[positionGroup(a.position)] -
            LINE_ORDER[positionGroup(b.position)] ||
          b.overall - a.overall ||
          byName(a, b)
      );
    case "name":
      return list.sort(byName);
    default:
      return list.sort((a, b) => b.overall - a.overall || byName(a, b));
  }
}
