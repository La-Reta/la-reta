"use server";

import { revalidatePath } from "next/cache";
import type { TeamKey } from "@/lib/teams";
import type { Position } from "@/lib/constants";
import { db, generatedRetaPlayers, generatedRetas } from "@/lib/db";
import { splitSignature } from "@/lib/team-balancer";
import { defaultTeamName } from "@/lib/teams";
import { guard } from "@/lib/errors";
import { optionalText } from "@/lib/text";

type Result = { ok: true; id: number } | { ok: false; error: string };

export interface GeneratedRetaInput {
  /**
  Un elemento por equipo (2 … 6), en orden A, B, C …
  */
  teams: { key: TeamKey; name: string; rating: number }[];
  diff: number;
  players: {
    playerId: number | null;
    guestName?: string;
    team: TeamKey;
    role: Position;
    overall: number;
  }[];
}

/**
 * Un equipo con su nombre por defecto si viene vacío.
 */
function namedTeam(t: GeneratedRetaInput["teams"][number]) {
  return {
    key: t.key,
    name: optionalText(t.name) ?? defaultTeamName(t.key),
    rating: t.rating,
  };
}

/**
 * Los ids de plantilla de un equipo. Los invitados (sin id) quedan fuera: son
 * ocasionales y no cuentan para el seguimiento de repeticiones.
 */
function rosterIds(players: GeneratedRetaInput["players"], teamKey: string) {
  return players.flatMap((p) =>
    p.team === teamKey && p.playerId != null ? [p.playerId] : []
  );
}

/**
 * Una fila de `generated_reta_players`.
 */
function playerRow(retaId: number, p: GeneratedRetaInput["players"][number]) {
  return {
    retaId,
    playerId: p.playerId,
    guestName: p.guestName ?? null,
    team: p.team,
    role: p.role,
    overall: p.overall,
  };
}

/**
 * Persists one "Generar equipos" run: the split fingerprint plus every player's
 * side/role/OVR snapshot. Returns the new reta id so the live flow can link the
 * eventual match back to it. Guarda los N equipos en `teams` y, por
 * compatibilidad con las lecturas viejas, los dos primeros también en las
 * columnas team_a_* / team_b_*.
 */
export async function saveGeneratedReta(
  input: GeneratedRetaInput
): Promise<Result> {
  return await guard(async () => {
    if (input.players.length < 2) {
      return { ok: false, error: "Se necesitan al menos 2 jugadores." };
    }
    if (input.teams.length < 2) {
      return { ok: false, error: "Se necesitan al menos 2 equipos." };
    }
    const teams = input.teams.map(namedTeam);

    // Signature fingerprints the split by roster ids; guests (null id) are
    // occasional, so they're left out of the repetition/variety tracking.
    // `filter` no estrecha `playerId`, así que el descarte y la conversión van
    // en un solo paso — antes iba con `!`, que prometía lo no comprobado.
    const sides = teams.map((t) => rosterIds(input.players, t.key));

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

    await db
      .insert(generatedRetaPlayers)
      .values(input.players.map((p) => playerRow(reta.id, p)));

    revalidatePath("/teams/registro");
    return { ok: true, id: reta.id };
  });
}
