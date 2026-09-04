"use client";

import type { VoteTally } from "@/lib/queries";
import { useQuery } from "@tanstack/react-query";

export type MatchVotesData = {
  tally: VoteTally[];
  myVotes: Record<string, string>;
};

export const matchVotesKey = (matchId: number) =>
  ["match-votes", matchId] as const;

async function fetchMatchVotes(matchId: number): Promise<MatchVotesData> {
  const res = await fetch(`/api/matches/${matchId}/votes`);
  if (!res.ok) throw new Error("No se pudieron cargar los votos");
  return res.json();
}

/**
 * Cache cliente de los votos de un partido. Sembrada con lo renderizado por el
 * server (`initialData`) y sondeada cada 15s **solo mientras la votación está
 * abierta**, para que los votos de otros aparezcan en vivo sin sockets. Cerrada,
 * los resultados son finales y no se sondea (cuida el performance). El refetch
 * en segundo plano está apagado por defecto (pausa al perder foco la pestaña).
 */
export function useMatchVotes(
  matchId: number,
  initialData: MatchVotesData,
  votingOpen: boolean,
) {
  return useQuery({
    queryKey: matchVotesKey(matchId),
    queryFn: () => fetchMatchVotes(matchId),
    initialData,
    refetchInterval: votingOpen ? 15_000 : false,
  });
}
