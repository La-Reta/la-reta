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
    playerId: number;
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
    const aIds = input.players
      .filter((p) => p.team === "A")
      .map((p) => p.playerId);
    const bIds = input.players
      .filter((p) => p.team === "B")
      .map((p) => p.playerId);
    if (aIds.length + bIds.length < 2) {
      return { ok: false, error: "Se necesitan al menos 2 jugadores." };
    }

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
