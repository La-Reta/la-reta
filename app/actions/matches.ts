"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, matches, matchGoals } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { formatApiDate } from "@/lib/dates";

type Result = { ok: true; id: number } | { ok: false; error: string };

export type MatchInput = {
  playedAt: string;
  teamAName: string;
  teamBName: string;
  scoreA: number;
  scoreB: number;
  balance: number;
  notes: string;
  durationSec?: number | null;
  scorers: { playerId: number; goals: number }[];
};

const clamp = (n: number, max: number) =>
  Math.max(0, Math.min(max, Math.round(Number(n)) || 0));

/** Collapses scorer rows to one row per player (summing goals). */
function scorerRows(matchId: number, scorers: MatchInput["scorers"]) {
  const tally = new Map<number, number>();
  for (const s of scorers ?? []) {
    if (!s.playerId) continue;
    tally.set(s.playerId, (tally.get(s.playerId) ?? 0) + clamp(s.goals, 50));
  }
  return [...tally].map(([playerId, goals]) => ({ matchId, playerId, goals }));
}

function matchValues(input: MatchInput) {
  return {
    playedAt: input.playedAt?.trim() || formatApiDate(),
    teamAName: input.teamAName?.trim() || "Equipo A",
    teamBName: input.teamBName?.trim() || "Equipo B",
    scoreA: clamp(input.scoreA, 99),
    scoreB: clamp(input.scoreB, 99),
    balance: clamp(input.balance, 100),
    durationSec:
      input.durationSec != null && input.durationSec > 0
        ? Math.round(input.durationSec)
        : null,
    notes: input.notes?.trim() || null,
  };
}

export async function createMatch(input: MatchInput): Promise<Result> {
  try {
    const [m] = await db
      .insert(matches)
      .values(matchValues(input))
      .returning({ id: matches.id });

    const rows = scorerRows(m.id, input.scorers);
    if (rows.length) await db.insert(matchGoals).values(rows);

    revalidatePath("/matches");
    revalidatePath("/");
    return { ok: true, id: m.id };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function updateMatch(
  id: number,
  input: MatchInput,
): Promise<Result> {
  try {
    await db.update(matches).set(matchValues(input)).where(eq(matches.id, id));
    // Replace the scorer set wholesale.
    await db.delete(matchGoals).where(eq(matchGoals.matchId, id));
    const rows = scorerRows(id, input.scorers);
    if (rows.length) await db.insert(matchGoals).values(rows);

    revalidatePath("/matches");
    revalidatePath("/");
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function deleteMatch(id: number): Promise<Result> {
  try {
    if (!(await isAdmin())) return { ok: false, error: "No autorizado." };
    await db.delete(matches).where(eq(matches.id, id));
    revalidatePath("/matches");
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
