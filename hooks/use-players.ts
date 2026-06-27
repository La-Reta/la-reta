"use client";

import { useQuery } from "@tanstack/react-query";
import type { Player } from "@/lib/db/schema";

export const playersKey = ["players"] as const;

async function fetchPlayers(): Promise<Player[]> {
  const res = await fetch("/api/players");
  if (!res.ok) throw new Error("No se pudieron cargar los jugadores");
  return res.json();
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
