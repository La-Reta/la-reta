"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, matches, matchGoals } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { formatApiDate } from "@/lib/dates";
import { isTeamKey } from "@/lib/teams";
import { guard } from "@/lib/errors";
import { optionalText } from "@/lib/text";

type Result = { ok: true; id: number } | { ok: false; error: string };

/**
 * Lo que llega del cliente. Los campos van opcionales aunque el formulario
 * siempre los mande: esto es una frontera y el cliente es manipulable.
 * Declarándolos obligatorios, TypeScript daba por muertas las guardas `?.` que
 * en ejecución sí hacen falta.
 */
export interface MatchInput {
  playedAt?: string;
  teamAName?: string;
  teamBName?: string;
  scoreA?: number;
  scoreB?: number;
  balance?: number;
  notes?: string;
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
  scorers?: {
    playerId: number | null;
    guestName?: string;
    goals: number;
    assists?: number;
    team?: string | null;
  }[];
}

// Acepta `undefined` porque el cuerpo llega del cliente y puede no traer el
// campo. `Math.round(undefined)` es NaN, y el `|| 0` ya lo cubría: esto solo
// pone en el tipo lo que la función siempre hizo.
const clamp = (n: number | undefined, max: number) =>
  Math.max(0, Math.min(max, Math.round(n ?? 0) || 0));

/**
Collapses scorer rows to one row per player/guest (summing goals + assists).
*/
interface Tally {
  playerId: number | null;
  guestName: string | null;
  team: string | null;
  goals: number;
  assists: number;
}

/**
 * Una fila de `match_goals` a partir de lo acumulado por jugador.
 */
function goalRow(matchId: number, row: Tally) {
  return {
    matchId,
    playerId: row.playerId,
    guestName: row.guestName,
    team: row.team,
    goals: row.goals,
    assists: row.assists,
  };
}

function scorerRows(matchId: number, scorers: MatchInput["scorers"]) {
  if (!scorers) {
    return [];
  }
  const tally = new Map<string, Tally>();
  for (const s of scorers) {
    const guestName = s.playerId == null ? optionalText(s.guestName) : null;
    // Skip rows that identify neither a roster player nor a named guest.
    if (guestName === null && s.playerId == null) {
      continue;
    }
    const team = isTeamKey(s.team) ? s.team : null;
    // Fuera de la plantilla del `key` porque anidar plantillas se lee fatal.
    const who = s.playerId ?? `guest:${guestName}`;
    const key = `${who}:${team ?? "unknown"}`;
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
  return Array.from(tally.values(), (row) => goalRow(matchId, row));
}

/**
 * Aplica el nombre y marcador editados a un equipo, si los hay para él.
 */
function withOverride<T extends object>(
  team: T,
  override: { name: string; score: number } | undefined
) {
  return override ? { ...team, ...override } : team;
}

/**
 * Un equipo de la reta, con nombre por defecto y marcador acotado.
 */
function namedTeam(t: { key: string; name?: string | null; score?: number }) {
  return {
    key: t.key,
    name: optionalText(t.name) ?? `Equipo ${t.key}`,
    score: clamp(t.score, 99),
  };
}

/**
 * La letra del equipo en esa posición, o la que mandó el cliente si es válida.
 */
function teamKeyAt(
  teams: { key: string }[] | null,
  index: number,
  fallback: string | null | undefined
): string | null {
  const fromTeams = teams?.[index];
  if (fromTeams) {
    return fromTeams.key;
  }
  return isTeamKey(fallback) ? fallback : null;
}

function matchValues(input: MatchInput) {
  // Con 3+ equipos el marcador vive en \`teams\`; los dos primeros se copian a
  // las columnas de siempre para que cuanto lee A/B siga funcionando.
  const named = input.teams;
  const teams =
    named != null && named.length > 2
      ? named.filter((t) => isTeamKey(t.key)).map(namedTeam)
      : null;

  return {
    playedAt: optionalText(input.playedAt) ?? formatApiDate(),
    teamAName: teams?.[0]?.name ?? optionalText(input.teamAName) ?? "Equipo A",
    teamBName: teams?.[1]?.name ?? optionalText(input.teamBName) ?? "Equipo B",
    teamAKey: teamKeyAt(teams, 0, input.teamAKey),
    teamBKey: teamKeyAt(teams, 1, input.teamBKey),
    teams,
    scoreA: teams?.[0] ? teams[0].score : clamp(input.scoreA, 99),
    scoreB: teams?.[1] ? teams[1].score : clamp(input.scoreB, 99),
    balance: clamp(input.balance, 100),
    durationSec:
      input.durationSec != null && input.durationSec > 0
        ? Math.round(input.durationSec)
        : null,
    notes: optionalText(input.notes),
  };
}

export async function createMatch(input: MatchInput): Promise<Result> {
  return await guard(async () => {
    const inserted = await db
      .insert(matches)
      .values({
        ...matchValues(input),
        generatedRetaId: input.generatedRetaId ?? null,
      })
      .returning({ id: matches.id });
    const match = inserted.at(0);
    if (!match) {
      throw new Error("No se pudo crear el partido.");
    }

    const goals = scorerRows(match.id, input.scorers);
    if (goals.length > 0) {
      await db.insert(matchGoals).values(goals);
    }

    revalidatePath("/matches");
    revalidatePath("/");
    return { ok: true, id: match.id };
  });
}

export async function updateMatch(
  id: number,
  input: MatchInput
): Promise<Result> {
  return await guard(async () => {
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
      // Solo los dos primeros equipos viajan en la forma de edición; el resto
      // se queda como estaba.
      const overrides = [
        { name: values.teamAName, score: values.scoreA },
        { name: values.teamBName, score: values.scoreB },
      ];
      const existingTeams = current.teams ?? [];
      values.teams =
        existingTeams.length > 0
          ? existingTeams.map((t, index) => withOverride(t, overrides[index]))
          : null;
    }

    await db.update(matches).set(values).where(eq(matches.id, id));
    // Replace the scorer set wholesale.
    await db.delete(matchGoals).where(eq(matchGoals.matchId, id));
    const rows = scorerRows(id, input.scorers);
    if (rows.length) {
      await db.insert(matchGoals).values(rows);
    }

    revalidatePath("/matches");
    revalidatePath("/");
    return { ok: true, id };
  });
}

/**
Set (or clear with null) the match photo. Admin-only, como la edición.
*/
export async function setMatchPhoto(
  id: number,
  photoUrl: string | null
): Promise<Result> {
  return await guard(async () => {
    if (!(await isAdmin())) {
      return { ok: false, error: "No autorizado." };
    }
    await db
      .update(matches)
      .set({ photoUrl: optionalText(photoUrl) })
      .where(eq(matches.id, id));
    revalidatePath(`/matches/${id}/detail`);
    revalidatePath("/matches");
    return { ok: true, id };
  });
}

export async function deleteMatch(id: number): Promise<Result> {
  return await guard(async () => {
    if (!(await isAdmin())) {
      return { ok: false, error: "No autorizado." };
    }
    await db.delete(matches).where(eq(matches.id, id));
    revalidatePath("/matches");
    return { ok: true, id };
  });
}
