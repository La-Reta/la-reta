"use server";

import { isAdmin } from "@/lib/admin";
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
 * Registra el voto del usuario en una categoría de un partido. Solo usuarios con
 * sesión Clerk o admin (PIN). Un voto por (partido, categoría, votante) y es
 * **definitivo**: si ya votaste en esa categoría, no puedes cambiarlo. Solo
 * mientras la votación esté abierta y para candidatos que participaron.
 */
export async function castMatchVote(input: {
  matchId: number;
  category: VoteCategory;
  playerId: number | null;
  guestName?: string | null;
}): Promise<Result> {
  try {
    const { userId } = await auth();
    const admin = await isAdmin();
    const voterId = userId ?? (admin ? "admin" : null);
    if (!voterId)
      return {
        ok: false,
        error: "Inicia sesión o entra como admin para votar.",
      };

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
      .select({ playerId: matchGoals.playerId, guestName: matchGoals.guestName })
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

    // Un voto por categoría y definitivo: si ya existe, no se cambia.
    const [existing] = await db
      .select({ id: matchVotes.id })
      .from(matchVotes)
      .where(
        and(
          eq(matchVotes.matchId, input.matchId),
          eq(matchVotes.category, input.category),
          eq(matchVotes.voterId, voterId),
        ),
      )
      .limit(1);
    if (existing)
      return {
        ok: false,
        error: "Ya votaste en esta categoría; tu voto es definitivo.",
      };

    await db.insert(matchVotes).values({
      matchId: input.matchId,
      category: input.category,
      voterId,
      playerId: input.playerId ?? null,
      guestName,
    });

    revalidatePath(`/matches/${input.matchId}/detail`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/**
 * Quita tu voto en una categoría (reset explícito). Mismo votante, votación
 * abierta. Tras esto puedes volver a votar en esa categoría.
 */
export async function resetMatchVote(input: {
  matchId: number;
  category: VoteCategory;
}): Promise<Result> {
  try {
    const { userId } = await auth();
    const admin = await isAdmin();
    const voterId = userId ?? (admin ? "admin" : null);
    if (!voterId)
      return { ok: false, error: "No autorizado." };
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
