import { isTeamKey } from "@repo/reta/teams";
import type { RetaDTO } from "@repo/reta/api";

import type { GeneratedRetaWithPlayers } from "@/lib/queries";
import { retaTeams } from "@/lib/queries";

/**
 * De la fila de Postgres a la forma que viaja por `/api/v1/retas`.
 *
 * La traducción vive aquí y no en el route handler porque la usan la lista y la
 * ficha, y porque el DTO es un contrato con la app: si algún día cambia, tiene
 * que romper en un solo sitio.
 */
export function toRetaDTO(reta: GeneratedRetaWithPlayers): RetaDTO {
  return {
    id: reta.id,
    createdAt: reta.createdAt.toISOString(),
    diff: reta.diff,
    teams: retaTeams(reta),
    players: reta.players.map((player) => ({
      playerId: player.playerId,
      // La consulta ya resolvió el nombre; el invitado se reconoce por no
      // tener id, no por el texto.
      guestName: player.isGuest ? player.displayName : null,
      // Una letra que no reconocemos cae en A: es preferible una reta con un
      // equipo mal etiquetado a una que no se puede leer.
      team: isTeamKey(player.team) ? player.team : "A",
      role: player.role,
      overall: player.overall,
      displayName: player.displayName,
    })),
  };
}
