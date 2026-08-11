"use server";

import { db, generatedRetaPlayers, generatedRetas } from "@/lib/db";
import type { Position } from "@/lib/constants";
import { splitSignature } from "@/lib/team-balancer";
import { defaultTeamName, type TeamKey } from "@/lib/teams";
import { revalidatePath } from "next/cache";

type Result = { ok: true; id: number } | { ok: false; error: string };

export type GeneratedRetaInput = {
  /** Un elemento por equipo (2 … 6), en orden A, B, C … */
  teams: { key: TeamKey; name: string; rating: number }[];
  diff: number;
  players: {
    playerId: number | null;
    guestName?: string;
    team: TeamKey;
    role: Position;
    overall: number;
  }[];
};

/**
 * Persists one "Generar equipos" run: the split fingerprint plus every player's
 * side/role/OVR snapshot. Returns the new reta id so the live flow can link the
 * eventual match back to it. Guarda los N equipos en `teams` y, por
 * compatibilidad con las lecturas viejas, los dos primeros también en las
 * columnas team_a_* / team_b_*.
 */
export async function saveGeneratedReta(
  input: GeneratedRetaInput,
): Promise<Result> {
  try {
    if (input.players.length < 2) {
      return { ok: false, error: "Se necesitan al menos 2 jugadores." };
    }
    if (input.teams.length < 2) {
      return { ok: false, error: "Se necesitan al menos 2 equipos." };
    }
    const teams = input.teams.map((t) => ({
      key: t.key,
      name: t.name?.trim() || defaultTeamName(t.key),
      rating: t.rating,
    }));

    // Signature fingerprints the split by roster ids; guests (null id) are
    // occasional, so they're left out of the repetition/variety tracking.
    const sides = teams.map((t) =>
      input.players
        .filter((p) => p.team === t.key && p.playerId != null)
        .map((p) => p.playerId as number),
    );

    const [reta] = await db
      .insert(generatedRetas)
      .values({
        signature: splitSignature(sides),
        teams,
        teamAName: teams[0].name,
        teamBName: teams[1].name,
        ratingA: teams[0].rating,
        ratingB: teams[1].rating,
        diff: input.diff,
      })
      .returning({ id: generatedRetas.id });

    await db.insert(generatedRetaPlayers).values(
      input.players.map((p) => ({
        retaId: reta.id,
        playerId: p.playerId,
        guestName: p.guestName ?? null,
        team: p.team,
        role: p.role,
        overall: p.overall,
      })),
    );

    revalidatePath("/teams/registro");
    return { ok: true, id: reta.id };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
