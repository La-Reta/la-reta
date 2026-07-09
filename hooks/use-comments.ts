"use client";

import { useQuery } from "@tanstack/react-query";
import type { PlayerComment } from "@/lib/db/schema";

export type CommentsData = {
  comments: PlayerComment[];
  reactions: Record<number, Record<string, number>>;
};

export const commentsKey = (playerId: number) =>
  ["comments", playerId] as const;

async function fetchComments(playerId: number): Promise<CommentsData> {
  const res = await fetch(`/api/players/${playerId}/comments`);
  if (!res.ok) throw new Error("No se pudieron cargar los comentarios");
  return res.json();
}

/**
 * Client cache of a player's reseñas. Seeded with the server-rendered data as
 * `initialData`, then polled every 15s so a comment from one client shows up on
 * others without sockets. Also refetches after our own mutations.
 */
export function useComments(playerId: number, initialData: CommentsData) {
  return useQuery({
    queryKey: commentsKey(playerId),
    queryFn: () => fetchComments(playerId),
    initialData,
    refetchInterval: 15_000,
  });
}
