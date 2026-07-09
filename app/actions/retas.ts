"use server";

import { db, generatedRetaPlayers, generatedRetas } from "@/lib/db";
import type { Position } from "@/lib/constants";
import { splitSignature } from "@/lib/team-balancer";
import { revalidatePath } from "next/cache";

type Result = { ok: true; id: number } | { ok: false; error: string };

export type GeneratedRetaInput = {
  teamAName: string;
  teamBName: string;
  ratingA: number;
  ratingB: number;
  diff: number;
  players: {
    playerId: number | null;
    guestName?: string;
    team: "A" | "B";
    role: Position;
    overall: number;
  }[];
};

/**
 * Persists one "Generar equipos" run: the split fingerprint plus every player's
 * side/role/OVR snapshot. Returns the new reta id so the live flow can link the
 * eventual match back to it.
 */
export async function saveGeneratedReta(
  input: GeneratedRetaInput,
): Promise<Result> {
  try {
    if (input.players.length < 2) {
      return { ok: false, error: "Se necesitan al menos 2 jugadores." };
    }
    // Signature fingerprints the split by roster ids; guests (null id) are
    // occasional, so they're left out of the repetition/variety tracking.
    const realIds = (team: "A" | "B") =>
      input.players
        .filter((p) => p.team === team && p.playerId != null)
        .map((p) => p.playerId as number);
    const aIds = realIds("A");
    const bIds = realIds("B");

    const [reta] = await db
      .insert(generatedRetas)
      .values({
        signature: splitSignature(aIds, bIds),
        teamAName: input.teamAName?.trim() || "Equipo A",
        teamBName: input.teamBName?.trim() || "Equipo B",
        ratingA: input.ratingA,
        ratingB: input.ratingB,
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
