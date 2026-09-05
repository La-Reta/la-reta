import type { NewRetaDTO } from "@repo/reta/api";

import { saveGeneratedReta } from "@/app/actions/retas";
import { getActor } from "@/lib/api/context";
import { readJson } from "@/lib/api/errors";
import { handler, jsonError, jsonOk } from "@/lib/api/respond";
import { getGeneratedRetas } from "@/lib/queries";
import { toRetaDTO } from "@/lib/retas-dto";

export const dynamic = "force-dynamic";

export { preflight as OPTIONS } from "@/lib/api/respond";

/**
Tope duro: sin él, un `?limit=99999` se traería la tabla entera.
*/
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

/**
 * Las retas generadas, de la más nueva a la más vieja.
 *
 * Ese orden no es cosmético: el repartidor pesa cada recuerdo por su posición
 * en la lista, así que invertirlo haría que evitara las combinaciones viejas y
 * repitiera las de la semana pasada.
 *
 * Lectura pública, como los partidos y la plantilla.
 */
export const GET = handler(async (request) => {
  const url = new URL(request.url);
  const requested = Number(url.searchParams.get("limit"));
  const limit = Number.isFinite(requested)
    ? Math.max(1, Math.min(MAX_LIMIT, Math.trunc(requested)))
    : DEFAULT_LIMIT;

  const retas = await getGeneratedRetas(limit);

  return jsonOk(request, retas.map(toRetaDTO));
});

/**
 * Guarda un reparto. Escribe, así que pide cuenta: la lectura es pública porque
 * el resultado se comparte, pero cualquiera con la URL no debería poder llenar
 * el historial de retas inventadas —y ese historial es justo lo que el
 * repartidor usa para no repetirse.
 */
export const POST = handler(async (request) => {
  const { userId } = await getActor();
  if (userId === null) {
    return jsonError(
      request,
      "Necesitas una cuenta para guardar la reta.",
      401
    );
  }

  const body = await readJson<NewRetaDTO>(request);
  if (!body || !Array.isArray(body.teams) || !Array.isArray(body.players)) {
    return jsonError(request, "Falta 'teams' o 'players'.", 400);
  }

  const result = await saveGeneratedReta({
    diff: body.diff,
    teams: body.teams,
    players: body.players.map((player) => {
      const { guestName } = player;

      return {
        playerId: player.playerId,
        guestName: guestName ?? undefined,
        team: player.team,
        role: player.role,
        overall: player.overall,
      };
    }),
  });

  return result.ok
    ? jsonOk(request, { id: result.id }, 201)
    : jsonError(request, result.error, 400);
});
