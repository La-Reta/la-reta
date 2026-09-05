import { splitSignature } from "./balancer";
import { defaultTeamName, isTeamKey } from "./teams";
import type { BalancedTeams, BalancerPlayer, RecentSplit } from "./balancer";
import type { Position } from "./positions";
import type { TeamKey } from "./teams";

/**
 * La forma de una reta generada en el cable.
 *
 * Vive en el paquete porque es un acuerdo entre dos programas: la web la
 * escribe en `/api/v1/retas` y la app la lee. Escrita dos veces —una en cada
 * lado— duraría hasta el primer campo nuevo, y el fallo saldría en runtime en
 * el teléfono de alguien, no al compilar.
 */

export interface RetaTeamDTO {
  key: TeamKey;
  name: string;
  rating: number;
}

export interface RetaPlayerDTO {
  /**
  `null` si es un invitado de última hora, que no está en la plantilla.
  */
  playerId: number | null;
  guestName: string | null;
  team: TeamKey;
  role: Position;
  /**
  Overall al generar, para que el historial sobreviva a editar la ficha.
  */
  overall: number;
  /**
  Nombre ya resuelto por el servidor: el apodo, o el del invitado.
  */
  displayName: string;
}

/**
Una reta guardada, como la devuelve `GET /api/v1/retas`.
*/
export interface RetaDTO {
  id: number;
  /**
  ISO 8601.
  */
  createdAt: string;
  diff: number;
  teams: RetaTeamDTO[];
  players: RetaPlayerDTO[];
}

/**
Lo que se manda a `POST /api/v1/retas`. El servidor pone id y fecha.
*/
export interface NewRetaDTO {
  diff: number;
  teams: RetaTeamDTO[];
  players: Omit<RetaPlayerDTO, "displayName">[];
}

/**
 * Convierte un reparto recién hecho en el cuerpo que espera la API.
 *
 * `isGuest` lo decide quien llama porque cada cliente marca a los suyos a su
 * manera —la web mira el id negativo, y nada garantiza que el próximo cliente
 * haga lo mismo—; el paquete solo necesita saber el resultado.
 */
export function toNewReta<P extends BalancerPlayer & { displayName: string }>(
  result: BalancedTeams<P>,
  options: {
    isGuest: (player: P) => boolean;
    /**
     * Nombre por equipo; sin él, "Equipo A".
     */
    nameOf?: (key: TeamKey) => string;
  }
): NewRetaDTO {
  const nameOf = options.nameOf ?? defaultTeamName;

  function describeTeam(team: BalancedTeams<P>["teams"][number]): RetaTeamDTO {
    return { key: team.key, name: nameOf(team.key), rating: team.rating };
  }

  function describePlayers(
    team: BalancedTeams<P>["teams"][number]
  ): NewRetaDTO["players"] {
    return team.lineups.map((lineup) => {
      const guest = options.isGuest(lineup.player);

      return {
        playerId: guest ? null : lineup.player.id,
        guestName: guest ? lineup.player.displayName : null,
        team: team.key,
        role: lineup.role,
        overall: lineup.player.overall,
      };
    });
  }

  return {
    diff: result.diff,
    teams: result.teams.map(describeTeam),
    players: result.teams.flatMap(describePlayers),
  };
}

/**
 * El historial en la forma que el repartidor entiende, de la más nueva a la más
 * vieja — que es el orden en que pesa los recuerdos.
 *
 * Los invitados se quedan fuera: no tienen id estable entre retas, así que
 * "estos dos ya jugaron juntos" no significa nada para ellos.
 */
export function toRecentSplits(retas: RetaDTO[]): RecentSplit[] {
  return retas.map((reta) => {
    const sides = new Map<TeamKey, number[]>();

    for (const player of reta.players) {
      if (player.playerId === null || !isTeamKey(player.team)) {
        continue;
      }
      sides.set(player.team, [
        ...(sides.get(player.team) ?? []),
        player.playerId,
      ]);
    }

    // biome-ignore lint: `Iterator#toArray()` no está en la lib de TS del repo
    // eslint-disable-next-line unicorn/prefer-iterator-to-array -- idem
    return { sides: [...sides.values()] };
  });
}

/**
La huella de una reta guardada, para comparar repartos entre clientes.
*/
export function retaSignature(reta: RetaDTO): string {
  return splitSignature(toRecentSplits([reta])[0]?.sides ?? []);
}
