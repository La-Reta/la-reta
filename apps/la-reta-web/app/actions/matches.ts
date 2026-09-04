"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, matches, matchGoals } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { formatApiDate } from "@/lib/dates";
import { isTeamKey } from "@/lib/teams";

type Result = { ok: true; id: number } | { ok: false; error: string };
/** Lado del partido; con 3+ equipos es la letra real del equipo en la reta. */
type MatchTeam = string;

export type MatchInput = {
  playedAt: string;
  teamAName: string;
  teamBName: string;
  scoreA: number;
  scoreB: number;
  balance: number;
  notes: string;
  durationSec?: number | null;
  // Which generated lineup this match came from (set from the live flow).
  generatedRetaId?: number | null;
  // Qué equipos de esa reta jugaron ("A", "C", …). Solo importa con 3+ equipos.
  teamAKey?: string | null;
  teamBKey?: string | null;
  /**
   * Marcador completo de una reta de 3+ equipos. Con 2 (o sin él) se ignora y
   * mandan teamAName/scoreA y su par B.
   */
  teams?: { key: string; name: string; score: number }[] | null;
  scorers: {
    playerId: number | null;
    guestName?: string;
    goals: number;
    assists?: number;
    team?: MatchTeam | null;
  }[];
};

const clamp = (n: number, max: number) =>
  Math.max(0, Math.min(max, Math.round(Number(n)) || 0));

/** Collapses scorer rows to one row per player/guest (summing goals + assists). */
function scorerRows(matchId: number, scorers: MatchInput["scorers"]) {
  const tally = new Map<
    string,
    {
      playerId: number | null;
      guestName: string | null;
      team: MatchTeam | null;
      goals: number;
      assists: number;
    }
  >();
  for (const s of scorers ?? []) {
    const guestName = s.playerId == null ? s.guestName?.trim() || null : null;
    // Skip rows that identify neither a roster player nor a named guest.
    if (s.playerId == null && !guestName) continue;
    const team = isTeamKey(s.team) ? s.team : null;
    const key = `${s.playerId ?? `guest:${guestName}`}:${team ?? "unknown"}`;
    const current = tally.get(key) ?? {
      playerId: s.playerId ?? null,
      guestName,
      team,
      goals: 0,
      assists: 0,
    };
    tally.set(key, {
      ...current,
      goals: current.goals + clamp(s.goals, 50),
      assists: current.assists + clamp(s.assists ?? 0, 50),
    });
  }
  return [...tally.values()].map(
    ({ playerId, guestName, team, goals, assists }) => ({
      matchId,
      playerId,
      guestName,
      team,
      goals,
      assists,
    }),
  );
}

function matchValues(input: MatchInput) {
  // Con 3+ equipos el marcador vive en `teams`; los dos primeros se copian a
  // las columnas de siempre para que todo lo que lee A/B siga funcionando.
  const teams =
    input.teams && input.teams.length > 2
      ? input.teams
          .filter((t) => isTeamKey(t.key))
          .map((t) => ({
            key: t.key,
            name: t.name?.trim() || `Equipo ${t.key}`,
            score: clamp(t.score, 99),
          }))
      : null;

  return {
    playedAt: input.playedAt?.trim() || formatApiDate(),
    teamAName: teams?.[0]?.name ?? (input.teamAName?.trim() || "Equipo A"),
    teamBName: teams?.[1]?.name ?? (input.teamBName?.trim() || "Equipo B"),
    teamAKey: teams?.[0]
      ? teams[0].key
      : isTeamKey(input.teamAKey)
        ? input.teamAKey
        : null,
    teamBKey: teams?.[1]
      ? teams[1].key
      : isTeamKey(input.teamBKey)
        ? input.teamBKey
        : null,
    teams,
    scoreA: teams?.[0] ? teams[0].score : clamp(input.scoreA, 99),
    scoreB: teams?.[1] ? teams[1].score : clamp(input.scoreB, 99),
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
      .values({
        ...matchValues(input),
        generatedRetaId: input.generatedRetaId ?? null,
      })
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
    const values = matchValues(input);
    // El formulario de edición es de dos lados y no manda `teams`. Si el partido
    // era una reta de 3+, se conserva su marcador completo y solo se refrescan
    // los dos equipos que la forma sí puede editar — así editar la fecha o las
    // notas no borra a los demás equipos.
    if (input.teams === undefined) {
      const [current] = await db
        .select({ teams: matches.teams })
        .from(matches)
        .where(eq(matches.id, id))
        .limit(1);
      values.teams = current?.teams?.length
        ? current.teams.map((t, i) =>
            i === 0
              ? { ...t, name: values.teamAName, score: values.scoreA }
              : i === 1
                ? { ...t, name: values.teamBName, score: values.scoreB }
                : t,
          )
        : null;
    }

    await db.update(matches).set(values).where(eq(matches.id, id));
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

/** Set (or clear with null) the match photo. Admin-only, como la edición. */
export async function setMatchPhoto(
  id: number,
  photoUrl: string | null,
): Promise<Result> {
  try {
    if (!(await isAdmin())) return { ok: false, error: "No autorizado." };
    await db
      .update(matches)
      .set({ photoUrl: photoUrl?.trim() || null })
      .where(eq(matches.id, id));
    revalidatePath(`/matches/${id}/detail`);
    revalidatePath("/matches");
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
