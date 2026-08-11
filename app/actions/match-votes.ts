"use server";

import { db, matchGoals, matchVotes, matches } from "@/lib/db";
import {
  isVotingOpen,
  VOTE_CATEGORY_KEYS,
  type VoteCategory,
} from "@/lib/match-votes";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type Result = { ok: true } | { ok: false; error: string };

/**
 * Registra el voto del usuario en una categoría de un partido. **Solo con
 * cuenta** (sesión de Clerk): el PIN de admin no vota, porque un voto anónimo
 * compartido no representa a nadie. Un voto por (partido, categoría, votante),
 * y se puede **cambiar** mientras la votación siga abierta — votar por otro
 * candidato reemplaza tu voto anterior. Para quitarlo, `resetMatchVote`.
 */
export async function castMatchVote(input: {
  matchId: number;
  category: VoteCategory;
  playerId: number | null;
  guestName?: string | null;
}): Promise<Result> {
  try {
    const { userId: voterId } = await auth();
    if (!voterId)
      return { ok: false, error: "Inicia sesión con tu cuenta para votar." };

    if (!VOTE_CATEGORY_KEYS.includes(input.category))
      return { ok: false, error: "Categoría inválida." };

    const [match] = await db
      .select({ id: matches.id, createdAt: matches.createdAt })
      .from(matches)
      .where(eq(matches.id, input.matchId))
      .limit(1);
    if (!match) return { ok: false, error: "Partido no encontrado." };
    if (!isVotingOpen(match.createdAt))
      return { ok: false, error: "La votación de este partido ya cerró." };

    const guestName =
      input.playerId == null ? input.guestName?.trim() || null : null;
    if (input.playerId == null && !guestName)
      return { ok: false, error: "Elige a un jugador." };

    // El candidato debe haber participado en el partido (evita votos arbitrarios).
    const participants = await db
      .select({
        playerId: matchGoals.playerId,
        guestName: matchGoals.guestName,
      })
      .from(matchGoals)
      .where(eq(matchGoals.matchId, input.matchId));
    const isParticipant =
      input.playerId != null
        ? participants.some((p) => p.playerId === input.playerId)
        : participants.some(
            (p) => p.playerId == null && (p.guestName ?? "") === guestName,
          );
    if (!isParticipant)
      return { ok: false, error: "Ese jugador no participó en este partido." };

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

    revalidatePath(`/matches/${input.matchId}/detail`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/**
 * Quita tu voto en una categoría. Mismo votante (cuenta de Clerk), votación
 * abierta. Tras esto puedes volver a votar en esa categoría.
 */
export async function resetMatchVote(input: {
  matchId: number;
  category: VoteCategory;
}): Promise<Result> {
  try {
    const { userId: voterId } = await auth();
    if (!voterId) return { ok: false, error: "No autorizado." };
    if (!VOTE_CATEGORY_KEYS.includes(input.category))
      return { ok: false, error: "Categoría inválida." };

    const [match] = await db
      .select({ createdAt: matches.createdAt })
      .from(matches)
      .where(eq(matches.id, input.matchId))
      .limit(1);
    if (!match) return { ok: false, error: "Partido no encontrado." };
    if (!isVotingOpen(match.createdAt))
      return { ok: false, error: "La votación de este partido ya cerró." };

    await db
      .delete(matchVotes)
      .where(
        and(
          eq(matchVotes.matchId, input.matchId),
          eq(matchVotes.category, input.category),
          eq(matchVotes.voterId, voterId),
        ),
      );

    revalidatePath(`/matches/${input.matchId}/detail`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
