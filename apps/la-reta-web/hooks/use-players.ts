"use client";

import { useQuery } from "@tanstack/react-query";
import type { Player } from "@/lib/db/schema";
import { fetchJson } from "@/lib/fetch-json";

export const playersKey = ["players"] as const;

async function fetchPlayers(): Promise<Player[]> {
  return await fetchJson<Player[]>(
    "/api/players",
    "No se pudieron cargar los jugadores"
  );
}

/**
 * Client cache of the roster. Seeded with the server-rendered list as
 * `initialData`, then kept fresh via invalidation after mutations.
 */
export function usePlayers(initialData: Player[]) {
  return useQuery({
    queryKey: playersKey,
    queryFn: fetchPlayers,
    initialData,
  });
}
