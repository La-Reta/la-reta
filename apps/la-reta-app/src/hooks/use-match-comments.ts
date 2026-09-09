import { useCallback, useEffect, useState } from "react";

import { fetchMatchReviews } from "@/lib/match-comments";
import type { MatchReviews } from "@/lib/types";

/**
 * Las reseñas de un partido.
 *
 * No usa `useApi` a propósito: ese hook cachea por ruta a nivel de módulo, que
 * es justo lo que hace falta para el roster —dos pantallas piden lo mismo y la
 * segunda lo quiere al instante— y justo lo que estorba aquí. Una reseña recién
 * escrita tiene que verse ya, y con ese caché la lista volvería a pintar lo que
 * se sabía antes de escribirla.
 *
 * `reactorKey` viaja para que el servidor marque las reacciones propias. Con
 * sesión es el `userId`; sin ella no se marca ninguna, porque sin cuenta esta
 * app no deja reaccionar.
 *
 * **Refrescar es subir un contador, no llamar a un fetch desde el efecto.** El
 * efecto solo se sincroniza con el servidor y los `setState` viven dentro de
 * las promesas; hacerlo al revés —un `setLoading(true)` síncrono en el cuerpo
 * del efecto— encadena renders y el linter de React lo marca con razón.
 */
export function useMatchComments(matchId: string, reactorKey: string) {
  const [data, setData] = useState<MatchReviews | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let alive = true;

    fetchMatchReviews(matchId, reactorKey)
      .then((next) => {
        if (!alive) return;
        setData(next);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!alive) return;
        setError(
          cause instanceof Error ? cause.message : "No se pudieron cargar."
        );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [matchId, reactorKey, nonce]);

  return { data, error, loading, refetch };
}
