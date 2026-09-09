import type { Position, PositionGroup } from "@/lib/constants";
import type { Player } from "@/lib/db/schema";
import { POSITIONS, positionGroup } from "@/lib/constants";
import { playerPositions } from "@/lib/format";
import { overallForLine } from "@/lib/ratings";

/**
 * Lo justo de un jugador para pintarlo en el mapa: al cliente no baja la ficha
 * entera —seis atributos, fechas, foto— para escribir un nombre y un número.
 */
export interface RankedPlayer {
  readonly id: number;
  readonly displayName: string;
  readonly nationality: string;
  /**
  Overall recalculado con los pesos de esta línea.
  */
  readonly rating: number;
  /**
  El overall de siempre, el de la posición que declara.
  */
  readonly own: number;
  /**
  Si de verdad juega en esta línea, o es una hipótesis.
  */
  readonly plays: boolean;
}

export interface LineInsight {
  /**
  Cuántos declaran alguna posición de la línea.
  */
  readonly count: number;
  /**
  Media del recalculado entre los que la juegan. `null` si no la juega nadie.
  */
  readonly average: number | null;
  /**
  La plantilla entera ordenada por lo que rendiría en esta línea.
  */
  readonly ranking: readonly RankedPlayer[];
}

export interface PositionsOverview {
  readonly byPosition: Readonly<Record<Position, readonly RankedPlayer[]>>;
  readonly lines: Readonly<Record<PositionGroup, LineInsight>>;
}

function statsOf(player: Player) {
  return {
    pace: player.pace,
    shooting: player.shooting,
    passing: player.passing,
    dribbling: player.dribbling,
    defending: player.defending,
    physical: player.physical,
  };
}

function rank(player: Player, line: PositionGroup): RankedPlayer {
  return {
    id: player.id,
    displayName: player.displayName,
    nationality: player.nationality,
    rating: overallForLine(line, statsOf(player)),
    own: player.overall,
    plays: playerPositions(player).some(
      (position) => positionGroup(position) === line
    ),
  };
}

function byRating(a: RankedPlayer, b: RankedPlayer) {
  return b.rating - a.rating;
}

function mean(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round(total / values.length);
}

/**
 * Lo que el mapa de posiciones necesita, calculado en el servidor y una vez.
 *
 * Baja ya masticado por dos razones: el cliente no necesita los atributos de
 * nadie para pintar un ranking, y recalcularlo en el navegador cada vez que se
 * toca una posición sería repetir el mismo trabajo con los mismos datos.
 *
 * El ranking de cada línea incluye a la plantilla **entera**, no solo a quien
 * declara esas posiciones: la gracia del mapa es enseñar que un delantero
 * rendiría de central, y para eso hay que puntuar también a quien nunca juega
 * ahí. Quién la juega de verdad y quién es una hipótesis lo separa `plays`.
 */
export function positionsOverview(
  players: readonly Player[]
): PositionsOverview {
  // Literal explícito y no un acumulador: si mañana entra una posición nueva en
  // `@repo/reta`, esto deja de compilar en vez de devolver un hueco silencioso.
  const byPosition: Record<Position, RankedPlayer[]> = {
    GK: [],
    RB: [],
    RWB: [],
    CB: [],
    LB: [],
    LWB: [],
    CDM: [],
    CM: [],
    CAM: [],
    RM: [],
    LM: [],
    RW: [],
    LW: [],
    CF: [],
    ST: [],
  };

  for (const player of players) {
    for (const position of playerPositions(player)) {
      byPosition[position].push(rank(player, positionGroup(position)));
    }
  }
  for (const position of POSITIONS) {
    byPosition[position] = byPosition[position].toSorted(byRating);
  }

  const lineInsight = (line: PositionGroup): LineInsight => {
    const ranking = players
      .map((player) => rank(player, line))
      .toSorted(byRating);
    const played = ranking.filter((entry) => entry.plays);
    return {
      count: played.length,
      average: mean(played.map((entry) => entry.rating)),
      ranking,
    };
  };

  return {
    byPosition,
    lines: {
      GK: lineInsight("GK"),
      DEF: lineInsight("DEF"),
      MID: lineInsight("MID"),
      FWD: lineInsight("FWD"),
    },
  };
}
