import "server-only";
import { and, eq } from "drizzle-orm";
import type { VoteCategory } from "@/lib/match-votes";
import type { ServiceResult } from "@/lib/services/result";
import { db, matchGoals, matchVotes, matches } from "@/lib/db";
import { isVotingOpen, VOTE_CATEGORY_KEYS } from "@/lib/match-votes";
import {
  badRequest,
  forbidden,
  notFound,
  ok,
  unauthorized,
} from "@/lib/services/result";

/**
 * Lógica de votos de partido, sin acoplar al framework.
 *
 * El votante llega como parámetro en vez de leerse con `auth()` dentro: así
 * la misma función sirve a la Server Action de la web y al route handler que
 * consume la app móvil. La revalidación de caché se queda fuera, porque solo
 * tiene sentido en la web.
 */

export interface CastMatchVoteInput {
  matchId: number;
  category: VoteCategory;
  playerId: number | null;
  guestName?: string | null;
}

export async function castMatchVote(
  input: CastMatchVoteInput,
  voterId: string | null
): Promise<ServiceResult> {
  // Solo con cuenta: el PIN de admin no vota, porque un voto anónimo
  // compartido no representa a nadie.
  if (voterId === null) {
    return unauthorized("Inicia sesión con tu cuenta para votar.");
  }
  if (!VOTE_CATEGORY_KEYS.includes(input.category)) {
    return badRequest("Categoría inválida.");
  }

  const matchRows = await db
    .select({ id: matches.id, createdAt: matches.createdAt })
    .from(matches)
    .where(eq(matches.id, input.matchId))
    .limit(1);
  const match = matchRows.at(0);
  if (match === undefined) {
    return notFound("Partido no encontrado.");
  }
  if (!isVotingOpen(match.createdAt)) {
    return forbidden("La votación de este partido ya cerró.");
  }

  // El original usaba `|| null`, que convierte "" en null. Se hace explícito
  // para no perder ese caso al quitar el falsy check.
  const trimmed = input.guestName?.trim();
  const guestName =
    trimmed !== undefined && trimmed !== "" && input.playerId === null
      ? trimmed
      : null;
  if (guestName === null && input.playerId === null) {
    return badRequest("Elige a un jugador.");
  }

  // El candidato debe haber participado en el partido (evita votos arbitrarios).
  const participants = await db
    .select({ playerId: matchGoals.playerId, guestName: matchGoals.guestName })
    .from(matchGoals)
    .where(eq(matchGoals.matchId, input.matchId));
  const isParticipant =
    input.playerId == null
      ? participants.some(
          (p) => p.playerId == null && (p.guestName ?? "") === guestName
        )
      : participants.some((p) => p.playerId === input.playerId);
  if (!isParticipant) {
    return badRequest("Ese jugador no participó en este partido.");
  }

  // Un voto por (partido, categoría, votante): el índice único deja que el
  // upsert cambie el candidato en una sola query, sin leer-luego-escribir.
  await db
    .insert(matchVotes)
    .values({
      matchId: input.matchId,
      category: input.category,
      voterId,
      playerId: input.playerId ?? null,
      guestName,
    })
    .onConflictDoUpdate({
      target: [matchVotes.matchId, matchVotes.category, matchVotes.voterId],
      set: {
        playerId: input.playerId ?? null,
        guestName,
        updatedAt: new Date(),
      },
    });

  return ok();
}

export interface ResetMatchVoteInput {
  matchId: number;
  category: VoteCategory;
}

export async function resetMatchVote(
  input: ResetMatchVoteInput,
  voterId: string | null
): Promise<ServiceResult> {
  if (voterId === null) {
    return unauthorized();
  }
  if (!VOTE_CATEGORY_KEYS.includes(input.category)) {
    return badRequest("Categoría inválida.");
  }

  const matchRows = await db
    .select({ createdAt: matches.createdAt })
    .from(matches)
    .where(eq(matches.id, input.matchId))
    .limit(1);
  const match = matchRows.at(0);
  if (match === undefined) {
    return notFound("Partido no encontrado.");
  }
  if (!isVotingOpen(match.createdAt)) {
    return forbidden("La votación de este partido ya cerró.");
  }

  await db
    .delete(matchVotes)
    .where(
      and(
        eq(matchVotes.matchId, input.matchId),
        eq(matchVotes.category, input.category),
        eq(matchVotes.voterId, voterId)
      )
    );

  return ok();
}
