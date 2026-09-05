import { useSyncExternalStore } from "react";

import { DEFAULT_SORT, type SortKey } from "@/lib/roster";

/**
 * El orden de la plantilla, fuera de React.
 *
 * La hoja de orden es una **ruta** —para que la presente iOS como hoja nativa
 * en vez de imitarla con un `Modal`— y una ruta no puede devolver un valor al
 * volver. Con un store las dos pantallas leen y escriben lo mismo sin pasar
 * parámetros ni recordar de dónde se venía.
 *
 * Es estado de sesión a propósito: al cerrar la app se vuelve al orden por
 * nivel, que es como la gente espera encontrar una plantilla.
 */

let current: SortKey = DEFAULT_SORT;
const listeners = new Set<() => void>();

const snapshot = (): SortKey => current;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setRosterSort(sort: SortKey): void {
  if (sort === current) return;

  current = sort;
  for (const listener of listeners) listener();
}

export function useRosterSort(): SortKey {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
