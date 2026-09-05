import { useApi } from "@/hooks/use-api";
import type { MatchVotes, VoteCategory, VoteTally } from "@/lib/types";

/**
 * Recuento de la votación de un partido.
 *
 * Es la única petición que la ficha de partido añade: el resto sale de los
 * partidos ya descargados. Va aparte porque el listado no la trae y traerla
 * para los cinco partidos a la vez sería pedir mucho para enseñar poco.
 */
export function useMatchVotes(matchId: string) {
  const { data, error, loading } = useApi<MatchVotes>(
    `/api/v1/matches/${matchId}/votes`
  );

  return { tally: data?.tally ?? null, error, loading };
}

/**
 * El más votado de una categoría, con cuántos votos y el total emitido.
 *
 * Sin el total, un "3 votos" no dice si ganó por poco o por goleada.
 */
export function topOf(
  tally: VoteTally[] | null,
  category: VoteCategory
): { name: string; count: number; total: number } | null {
  const rows = (tally ?? []).filter((row) => row.category === category);
  if (rows.length === 0) return null;

  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const winner = rows.reduce((best, row) =>
    row.count > best.count ? row : best
  );

  return { name: winner.name, count: winner.count, total };
}
