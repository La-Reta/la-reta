import type { NewRetaDTO, RetaDTO } from "@repo/reta/api";
import { useCallback } from "react";

import { useApi } from "@/hooks/use-api";
import { request } from "@/lib/api";

/** Cuántas retas pesa el repartidor. Más allá, el recuerdo vale casi cero. */
const HISTORY_SIZE = 20;

export interface RetasState {
  retas: RetaDTO[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  save: (reta: NewRetaDTO) => Promise<number>;
}

/**
 * El historial de retas generadas.
 *
 * Es lo que le da memoria al repartidor: sin esto recibía una lista vacía y
 * solo esquivaba lo generado en la misma sesión, así que el lunes volvía a
 * proponer los equipos del jueves.
 *
 * Llegan de la más nueva a la más vieja porque el peso de cada recuerdo sale de
 * su posición en la lista; reordenarlas aquí invertiría el olvido.
 */
export function useRetas(): RetasState {
  const { data, error, loading, refetch } = useApi<RetaDTO[]>(
    `/api/v1/retas?limit=${HISTORY_SIZE}`
  );

  const save = useCallback(
    async (reta: NewRetaDTO) => {
      const created = await request<{ id: number }>("/api/v1/retas", {
        method: "POST",
        body: reta,
      });
      refetch();
      return created.id;
    },
    [refetch]
  );

  return { retas: data, loading, error, refetch, save };
}
