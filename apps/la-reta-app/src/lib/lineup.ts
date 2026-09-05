import type { Lineup } from "@repo/reta/balancer";

import { positionGroup, type PositionGroup } from "@/lib/players";
import type { Player } from "@/lib/types";

/**
 * El once ideal, portado de apps/la-reta-web/lib/lineup.ts.
 *
 * Mismo 4-3-3 y mismo criterio que la web —es el dibujo más legible de un
 * vistazo— pero con las coordenadas giradas a vertical: en un teléfono la
 * cancha se mira a lo alto, con la portería propia abajo.
 */

export interface LineupSlot {
  id: string;
  /** Etiqueta de la demarcación, en español ("DFC", "MC"). */
  label: string;
  group: PositionGroup;
  /** Porcentajes sobre la cancha vertical: `left` a lo ancho, `top` a lo largo. */
  left: number;
  top: number;
  player: Player | null;
}

const FORMATION: Omit<LineupSlot, "player">[] = [
  { id: "gk", label: "POR", group: "GK", left: 50, top: 92 },
  { id: "lb", label: "LI", group: "DEF", left: 84, top: 76 },
  { id: "lcb", label: "DFC", group: "DEF", left: 62, top: 82 },
  { id: "rcb", label: "DFC", group: "DEF", left: 38, top: 82 },
  { id: "rb", label: "LD", group: "DEF", left: 16, top: 76 },
  { id: "lcm", label: "MC", group: "MID", left: 72, top: 54 },
  { id: "cm", label: "MCD", group: "MID", left: 50, top: 62 },
  { id: "rcm", label: "MC", group: "MID", left: 28, top: 54 },
  { id: "lw", label: "EI", group: "FWD", left: 82, top: 28 },
  { id: "st", label: "DC", group: "FWD", left: 50, top: 12 },
  { id: "rw", label: "ED", group: "FWD", left: 18, top: 28 },
];

/**
 * Arma el 4-3-3 más fuerte disponible.
 *
 * Cada hueco se lleva al mejor jugador libre que pueda cubrir esa línea (por su
 * posición principal o la secundaria). Si una línea se queda corta, el hueco lo
 * tapa el mejor que quede: es preferible un once completo con alguien fuera de
 * sitio que un dibujo con agujeros.
 */
export function bestEleven(players: Player[]): LineupSlot[] {
  const pool = [...players].sort((a, b) => b.overall - a.overall);
  const used = new Set<number>();
  const slots: LineupSlot[] = FORMATION.map((slot) => ({
    ...slot,
    player: null,
  }));

  for (const slot of slots) {
    const pick = pool.find(
      (player) =>
        !used.has(player.id) &&
        [player.position, player.position2]
          .filter(Boolean)
          .some(
            (pos) => positionGroup(pos as Player["position"]) === slot.group
          )
    );
    if (pick) {
      slot.player = pick;
      used.add(pick.id);
    }
  }

  for (const slot of slots) {
    if (slot.player) continue;
    const pick = pool.find((player) => !used.has(player.id));
    if (pick) {
      slot.player = pick;
      used.add(pick.id);
    }
  }

  return slots;
}

/** Profundidad de cada línea sobre la cancha vertical, con la portería abajo. */
const LINE_TOP: Record<PositionGroup, number> = {
  GK: 90,
  DEF: 70,
  MID: 48,
  FWD: 24,
};

const LINE_ORDER: PositionGroup[] = ["GK", "DEF", "MID", "FWD"];

/** Margen lateral: más cerca de la banda y el retrato se sale del césped. */
const EDGE = 18;
/** Desde cuántos en una línea hay que escalonarlos para que no se toquen. */
const STAGGER_FROM = 4;
const STAGGER = 5;

/**
 * Coloca a un equipo generado sobre la cancha.
 *
 * No usa una formación fija como `bestEleven`: una reta es de seis, siete u
 * ocho por lado y forzarlos a un 4-3-3 dejaría huecos donde no hay nadie. Aquí
 * las líneas salen de lo que el repartidor ya decidió —cada jugador trae su
 * puesto— y cada línea se reparte a lo ancho con la gente que le tocó, así que
 * un 3-2-1 se dibuja 3-2-1 y un 2-3-2 también.
 */
export function teamSlots(lineups: Lineup<Player>[]): LineupSlot[] {
  const byLine = new Map<PositionGroup, Lineup<Player>[]>();
  for (const lineup of lineups) {
    const group = positionGroup(lineup.role);
    byLine.set(group, [...(byLine.get(group) ?? []), lineup]);
  }

  const slots: LineupSlot[] = [];
  for (const group of LINE_ORDER) {
    const line = byLine.get(group) ?? [];

    line.forEach((lineup, index) => {
      slots.push({
        id: String(lineup.player.id),
        label: lineup.role,
        group,
        left: spreadAcross(index, line.length),
        // Una línea de cuatro o más se escalona: en un ancho de teléfono, cinco
        // retratos a la misma altura se solapan.
        top:
          LINE_TOP[group] +
          (line.length >= STAGGER_FROM && index % 2 === 1 ? STAGGER : 0),
        player: lineup.player,
      });
    });
  }

  return slots;
}

/** Reparte `count` jugadores a lo ancho, centrados y sin pisar la banda. */
function spreadAcross(index: number, count: number): number {
  if (count <= 1) return 50;
  return EDGE + (index * (100 - 2 * EDGE)) / (count - 1);
}
