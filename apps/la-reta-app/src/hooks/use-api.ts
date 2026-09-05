import { useCallback, useEffect, useState } from "react";

import { request } from "@/lib/api";

/**
 * Fetch mínimo con estado de carga y error. La app aún no tiene una capa de
 * datos; cuando la tenga, esto se sustituye por TanStack Query (que la web ya
 * usa en la galería de jugadores) en vez de crecer aquí.
 *
 * `loading` se deriva en vez de guardarse: el resultado lleva la clave de la
 * petición que lo produjo, así que basta compararla con la clave actual. Eso
 * evita el `setState` síncrono dentro del efecto que React 19 desaconseja
 * (dispara un render en cascada) y de paso hace imposible que una respuesta
 * vieja se muestre como si fuera la nueva.
 */

interface Result<T> {
  key: string;
  data: T | null;
  error: string | null;
}

export interface ApiState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refetch: () => void;
}

export function useApi<T>(path: string): ApiState<T> {
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);

  const key = `${path}#${nonce}`;
  const refetch = useCallback(() => setNonce((value) => value + 1), []);

  useEffect(() => {
    // Aborta al desmontar o al re-pedir, para no llamar setState sobre un
    // componente ya desmontado.
    const controller = new AbortController();

    request<T>(path, { signal: controller.signal })
      .then((data) => setResult({ key, data, error: null }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setResult({
          key,
          data: null,
          error: err instanceof Error ? err.message : "Error desconocido",
        });
      });

    return () => controller.abort();
  }, [path, key]);

  const current = result?.key === key ? result : null;

  return {
    data: current?.data ?? null,
    error: current?.error ?? null,
    loading: current === null,
    refetch,
  };
}
