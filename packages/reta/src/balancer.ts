import { playerPositions, positionGroup } from "./positions";
import { DEFAULT_TEAM_COUNT, teamKeys } from "./teams";
import type { Position, PositionGroup } from "./positions";
import type { TeamKey } from "./teams";

/**
 * El repartidor de equipos de la reta.
 *
 * Vive en un paquete y no dentro de la web porque las dos apps quieren lo
 * mismo: dados N convocados, hacer equipos parejos, con portero, con forma de
 * equipo y —lo importante— distintos a los de las últimas retas. Duplicarlo en
 * el móvil habría significado dos algoritmos divergiendo, y el reparto de la
 * web y el del teléfono dando resultados distintos para la misma gente.
 *
 * Es genérico sobre el jugador a propósito: solo necesita id, overall y
 * posiciones, así que cada app pasa su propia ficha completa y la recupera
 * intacta en los lineups, sin conversiones ni pérdida de campos.
 */

/**
Lo mínimo que el balanceador necesita saber de alguien.
*/
export interface BalancerPlayer {
  id: number;
  overall: number;
  position: Position;
  position2?: Position | null;
}

/**
Un jugador junto al puesto que le tocó en este reparto.
*/
export interface Lineup<P extends BalancerPlayer> {
  player: P;
  role: Position;
}

/**
Un equipo generado: su letra, sus jugadores y su overall medio.
*/
export interface TeamSplit<P extends BalancerPlayer> {
  key: TeamKey;
  lineups: Lineup<P>[];
  rating: number;
}

export interface BalancedTeams<P extends BalancerPlayer> {
  teams: TeamSplit<P>[];
  /**
  Distancia entre la media del equipo más fuerte y la del más débil.
  */
  diff: number;
}

type OutfieldGroup = "DEF" | "MID" | "FWD";
const OUTFIELD_GROUPS: OutfieldGroup[] = ["DEF", "MID", "FWD"];
// Líneas ordenadas de portería a delantera, así que "la más cercana" es la de
// menor distancia de índice.
const GROUP_INDEX: Record<PositionGroup, number> = {
  GK: 0,
  DEF: 1,
  MID: 2,
  FWD: 3,
};
// Posición que se enseña cuando alguien acaba en una línea que no juega.
const GROUP_ANCHOR: Record<OutfieldGroup, Position> = {
  DEF: "CB",
  MID: "CM",
  FWD: "ST",
};

// Huecos por línea, de dentro hacia fuera: una línea corta ocupa primero los
// puestos centrales y solo se abre al crecer. Sirve para dar puestos distintos
// a jugadores de la misma línea — en fútbol 7 el sitio exacto da igual, así que
// dos centrales se reparten en CB + RB en vez de apilarse.
const GROUP_SLOTS: Record<OutfieldGroup, Position[]> = {
  DEF: ["CB", "RB", "LB", "RWB", "LWB"],
  MID: ["CM", "CDM", "CAM", "RM", "LM"],
  FWD: ["ST", "CF", "RW", "LW"],
};

function shuffle<T>(array: readonly T[]): T[] {
  const a = [...array];
  for (let index = a.length - 1; index > 0; index--) {
    const index_ = Math.floor(Math.random() * (index + 1));
    [a[index], a[index_]] = [a[index_] as T, a[index] as T];
  }
  return a;
}

function average<P extends BalancerPlayer>(lineups: Lineup<P>[]): number {
  if (lineups.length === 0) {
    return 0;
  }
  const sum = lineups.reduce(
    (accumulator, l) => accumulator + l.player.overall,
    0
  );
  return Math.round((sum / lineups.length) * 10) / 10;
}

const meanOverall = (ps: BalancerPlayer[]) =>
  ps.length ? ps.reduce((a, p) => a + p.overall, 0) / ps.length : 0;

/**
max − min de las medias: 0 = todos parejos.
*/
function spread(groups: BalancerPlayer[][]): number {
  const avgs = groups.map(meanOverall);
  return Math.max(...avgs) - Math.min(...avgs);
}

export const canKeepGoal = (p: BalancerPlayer) =>
  playerPositions(p).some((pos) => positionGroup(pos) === "GK");

/**
Las posiciones de campo (principal primero); CM para un portero puro.
*/
function outfieldPositions(p: BalancerPlayer): Position[] {
  const ps = playerPositions(p).filter((pos) => positionGroup(pos) !== "GK");
  return ps.length ? ps : ["CM"];
}

const primaryGroup = (p: BalancerPlayer): OutfieldGroup =>
  positionGroup(outfieldPositions(p)[0]!) as OutfieldGroup;

const playsGroup = (p: BalancerPlayer, g: OutfieldGroup) =>
  outfieldPositions(p).some((pos) => positionGroup(pos) === g);

/** Cuántas líneas distintas puede cubrir. Más alto, más fácil de mover. */
const versatility = (p: BalancerPlayer): number =>
  new Set(outfieldPositions(p).map(positionGroup)).size;

/**
 * A quién conviene mudar de línea: primero quien ya juega la de destino, luego
 * el más polivalente, y en último lugar el más flojo — los buenos se quedan en
 * su sitio.
 */
function byBestFit(
  a: BalancerPlayer,
  b: BalancerPlayer,
  target: OutfieldGroup
): number {
  const fit = (playsGroup(a, target) ? 0 : 1) - (playsGroup(b, target) ? 0 : 1);

  return fit || versatility(b) - versatility(a) || a.overall - b.overall;
}

/**
 * Coloca a los de campo de un equipo para que el tablero se lea como una
 * formación de verdad:
 *
 *  1. Todos empiezan en su línea principal, así que un 3-2-1 natural se queda
 *     en 3-2-1.
 *  2. Solo la línea que se amontona suelta gente a la línea más cercana con
 *     sitio, prefiriendo a quien ya la juega de secundaria y luego al más
 *     polivalente. La línea principal de nadie se toca si no hace falta.
 */
/**
 * Ordena las líneas candidatas: primero la más cercana, y a igual distancia la
 * que menos gente tenga.
 *
 * Va con nombre y fuera del `sort` a propósito: en línea, el formateador del
 * repo destroza esta cadena y deja el archivo sin compilar.
 */
function byDistanceThenSize<P extends BalancerPlayer>(
  a: OutfieldGroup,
  b: OutfieldGroup,
  over: OutfieldGroup,
  lines: Record<OutfieldGroup, P[]>
): number {
  const distance =
    Math.abs(GROUP_INDEX[a] - GROUP_INDEX[over]) -
    Math.abs(GROUP_INDEX[b] - GROUP_INDEX[over]);

  return distance || lines[a].length - lines[b].length;
}

function assignRoles<P extends BalancerPlayer>(outfielders: P[]): Lineup<P>[] {
  if (outfielders.length === 0) {
    return [];
  }

  const lines: Record<OutfieldGroup, P[]> = { DEF: [], MID: [], FWD: [] };
  for (const p of outfielders) {
    lines[primaryGroup(p)].push(p);
  }

  // Una línea aguanta un tercio más que el reparto justo antes de verse
  // amontonada: deja intactas las formas naturales (3-2-1) y rompe las pilas
  // de cinco o seis.
  const cap = Math.max(2, Math.ceil(outfielders.length / 3) + 1);

  for (let guard = 0; guard < 100; guard++) {
    const over = OUTFIELD_GROUPS.find((g) => lines[g].length > cap);
    if (!over) {
      break;
    }

    const withRoom = OUTFIELD_GROUPS.filter(
      (g) => g !== over && lines[g].length < cap
    );
    const [target] = [...withRoom].sort((a, b) =>
      byDistanceThenSize(a, b, over, lines)
    );

    // Las demás líneas también están llenas; se queda donde está.
    if (!target) {
      break;
    }

    // Se mueve al que mejor encaje: quien ya juega la línea destino, luego el
    // más polivalente, luego el más flojo (los buenos se quedan en su sitio).
    const [mover] = [...lines[over]].sort((a, b) => byBestFit(a, b, target));
    if (!mover) {
      break;
    }

    lines[over] = lines[over].filter((p) => p !== mover);
    lines[target].push(mover);
  }

  const result: Lineup<P>[] = [];
  for (const g of OUTFIELD_GROUPS) {
    const slots = GROUP_SLOTS[g];
    const used = new Set<Position>();
    const pending: P[] = [];

    // Pasada 1 (barajada): quien tenga libre una de sus propias posiciones se
    // la queda. Barajar hace que, cuando dos comparten posición, no sea siempre
    // el mismo quien se la lleva.
    for (const p of shuffle(lines[g])) {
      const own = outfieldPositions(p).find(
        (pos) => positionGroup(pos) === g && !used.has(pos)
      );
      if (own) {
        used.add(own);
        result.push({ player: p, role: own });
      } else {
        pending.push(p);
      }
    }

    // Pasada 2: los que quedan (repetidos o puros comodines) toman el siguiente
    // hueco libre de dentro hacia fuera, para que nadie comparta puesto. Si una
    // línea supera sus huecos, cae al ancla.
    for (const p of pending) {
      const free = slots.find((s) => !used.has(s));
      if (free) {
        used.add(free);
      }
      result.push({ player: p, role: free ?? GROUP_ANCHOR[g] });
    }
  }
  return result;
}

/**
 * Huella de un reparto que no depende de las etiquetas: los ids de cada lado
 * ordenados y unidos con ",", y los lados ordenados y unidos con "|". El mismo
 * enfrentamiento con las letras permutadas da la misma cadena, y para 2 equipos
 * da exactamente la misma que la versión anterior, así que las firmas ya
 * guardadas en la BD siguen siendo comparables.
 */
export function splitSignature(sides: number[][]): string {
  return sides
    .map((ids) => [...ids].sort((x, y) => x - y).join(","))
    .sort()
    .join("|");
}

export function lineupSignature<P extends BalancerPlayer>(
  teams: TeamSplit<P>[]
): string {
  return splitSignature(teams.map((t) => t.lineups.map((l) => l.player.id)));
}

/**
Parejas de un mismo lado ("3-7"), para medir cuánto se repite un reparto.
*/
function sidePairs(ids: number[]): string[] {
  const sorted = [...ids].sort((x, y) => x - y);
  const out: string[] = [];
  for (let index = 0; index < sorted.length; index++) {
    for (let index_ = index + 1; index_ < sorted.length; index_++) {
      out.push(`${sorted[index]}-${sorted[index_]}`);
    }
  }
  return out;
}

/**
Un reparto anterior, como se guarda en `generated_reta_players`.
*/
export interface RecentSplit {
  sides: number[][];
}

/**
 * Cada cuántas retas pesa la mitad un recuerdo.
 *
 * El historial llega de la más nueva a la más vieja, y antes todas contaban
 * igual: una pareja de hace tres meses bloqueaba tanto como la de la semana
 * pasada, y con veinte retas guardadas el generador se quedaba sin
 * combinaciones "nuevas" que ofrecer. Con vida media de cuatro, lo de la
 * jornada anterior pesa 1, lo de hace un mes ~0.4 y lo de hace medio año
 * prácticamente nada: el algoritmo recuerda, pero también olvida.
 */
export const MEMORY_HALF_LIFE = 4;

/**
Cuánto castiga repetir el reparto exacto, en puntos de overall.
*/
export const REPEAT_PENALTY = 3;
/**
Cuánto castiga repetir las parejas, en puntos de overall.
*/
export const OVERLAP_PENALTY = 3;

/**
Cuántos repartos se prueban antes de quedarse con el mejor.
*/
export const DEFAULT_ATTEMPTS = 12;

const recallWeight = (index: number) => 0.5 ** (index / MEMORY_HALF_LIFE);

/**
 * Lo mismo que `balanceTeams`, pero entre varios repartos parejos se queda con
 * el que menos repite la historia reciente: los equipos siguen equilibrados sin
 * ser siempre los mismos.
 *
 * `recent` tiene que venir de la más nueva a la más vieja — es el orden en que
 * la consulta ya las devuelve— porque el peso de cada recuerdo sale de su
 * posición en la lista.
 */
export function balanceTeamsVaried<P extends BalancerPlayer>(
  selected: P[],
  recent: RecentSplit[],
  teamCount = DEFAULT_TEAM_COUNT,
  attempts = DEFAULT_ATTEMPTS
): BalancedTeams<P> {
  if (recent.length === 0) {
    return balanceTeams(selected, teamCount);
  }

  // Se guarda el peso del recuerdo **más reciente** de cada cosa, no la suma:
  // la pregunta que importa es "¿cuándo fue la última vez?", y sumando, una
  // pareja repetida cinco veces hace un año tapaba a la de la semana pasada.
  const signatureWeight = new Map<string, number>();
  const pairWeight = new Map<string, number>();

  for (const [index, split] of recent.entries()) {
    const weight = recallWeight(index);
    const signature = splitSignature(split.sides);
    signatureWeight.set(
      signature,
      Math.max(signatureWeight.get(signature) ?? 0, weight)
    );

    for (const ids of split.sides) {
      for (const pair of sidePairs(ids)) {
        pairWeight.set(pair, Math.max(pairWeight.get(pair) ?? 0, weight));
      }
    }
  }

  let best: BalancedTeams<P> | null = null;
  let bestScore = Infinity;

  for (let index = 0; index < attempts; index++) {
    const candidate = balanceTeams(selected, teamCount);
    const sides = candidate.teams.map((t) => t.lineups.map((l) => l.player.id));
    const pairs = sides.flatMap((ids) => sidePairs(ids));
    const overlap = pairs.length
      ? pairs.reduce((sum, p) => sum + (pairWeight.get(p) ?? 0), 0) /
        pairs.length
      : 0;

    // Heurística lineal: el reparto idéntico y las parejas repetidas "cuestan"
    // hasta tres puntos de overall cada uno, así que un reparto algo más
    // desigual gana si trae gente nueva junta. Sube los pesos si sigue saliendo
    // lo mismo.
    const score =
      candidate.diff +
      (signatureWeight.get(splitSignature(sides)) ?? 0) * REPEAT_PENALTY +
      overlap * OVERLAP_PENALTY;

    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best ?? balanceTeams(selected, teamCount);
}

/**
Recalcula medias y diff con los ocupantes actuales de cada equipo.
*/
function withRatings<P extends BalancerPlayer>(
  teams: { key: TeamKey; lineups: Lineup<P>[] }[]
): BalancedTeams<P> {
  const rated = teams.map((t) => ({ ...t, rating: average(t.lineups) }));
  const ratings = rated.map((t) => t.rating);
  return {
    teams: rated,
    diff:
      Math.round((Math.max(...ratings) - Math.min(...ratings)) * 10) / 10 || 0,
  };
}

/**
 * Intercambia a dos jugadores por id conservando el puesto de cada hueco (el
 * tablero no se mueve, solo cambian los ocupantes). Las medias se recalculan:
 * un cambio entre equipos las mueve, uno dentro del mismo equipo no. No hace
 * nada si los ids coinciden o alguno no está. Devuelve un objeto nuevo para que
 * React vea el cambio.
 */
export function swapPlayers<P extends BalancerPlayer>(
  teams: BalancedTeams<P>,
  fromId: number,
  toId: number
): BalancedTeams<P> {
  if (fromId === toId) {
    return teams;
  }
  const next = teams.teams.map((t) => ({
    key: t.key,
    lineups: t.lineups.map((l) => ({ ...l })),
  }));
  const all = next.flatMap((t) => t.lineups);
  const from = all.find((l) => l.player.id === fromId);
  const to = all.find((l) => l.player.id === toId);
  if (!from || !to) {
    return teams;
  }
  [from.player, to.player] = [to.player, from.player];
  return withRatings(next);
}

/**
 * Mete a alguien (o a un invitado de última hora) en un equipo ya generado sin
 * volver a repartir a nadie. Toma el arco si el equipo aún no tiene portero y
 * sabe atajar; si no, juega en su posición principal.
 */
export function addToTeam<P extends BalancerPlayer>(
  teams: BalancedTeams<P>,
  player: P,
  key: TeamKey
): BalancedTeams<P> {
  const clean = removeFromTeams(teams, player.id);
  return withRatings(
    clean.teams.map((team) => {
      if (team.key !== key) {
        return team;
      }
      const needsGK = team.lineups.every((l) => l.role !== "GK");
      const role: Position =
        needsGK && canKeepGoal(player) ? "GK" : outfieldPositions(player)[0]!;
      return { ...team, lineups: [...team.lineups, { player, role }] };
    })
  );
}

/**
Saca a alguien de los equipos (se desconvocó o se borró el invitado).
*/
export function removeFromTeams<P extends BalancerPlayer>(
  teams: BalancedTeams<P>,
  playerId: number
): BalancedTeams<P> {
  return withRatings(
    teams.teams.map((t) => ({
      ...t,
      lineups: t.lineups.filter((l) => l.player.id !== playerId),
    }))
  );
}

/**
 * Refresca la ficha de un jugador dentro del tablero (p. ej. un invitado al que
 * le cambiaron el overall) conservando su equipo y su posición.
 */
export function replacePlayer<P extends BalancerPlayer>(
  teams: BalancedTeams<P>,
  player: P
): BalancedTeams<P> {
  return withRatings(
    teams.teams.map((t) => ({
      ...t,
      lineups: t.lineups.map((l) =>
        l.player.id === player.id ? { ...l, player } : l
      ),
    }))
  );
}

/**
El equipo con menos gente (a empate, el de menor OVR) — para autoasignar.
*/
export function lightestTeam<P extends BalancerPlayer>(
  teams: BalancedTeams<P>
): TeamKey {
  const [first] = [...teams.teams].sort(
    (a, b) => a.lineups.length - b.lineups.length || a.rating - b.rating
  );
  return first?.key ?? "A";
}

/**
 * Reparte a los convocados en `teamCount` equipos de fuerza parecida.
 *
 *  1. Un portero por equipo, elegido entre los que saben atajar. La elección va
 *     barajada, así que alguien con doble posición (GK/CB) unas veces va al
 *     arco y otras juega de campo: regenerar da variedad de verdad.
 *  2. El resto se ordena de mejor a peor (empates barajados) y va cayendo en el
 *     equipo más ligero, para que tamaños y totales queden parejos.
 *  3. Una búsqueda local intercambia jugadores de campo entre el equipo más
 *     fuerte y el más débil mientras eso cierre la brecha (los tamaños no
 *     cambian, así que no puede desequilibrar las plantillas).
 *  4. Los de campo se reparten por líneas para que el tablero se lea como una
 *     formación (ver `assignRoles`).
 */
export function balanceTeams<P extends BalancerPlayer>(
  selected: P[],
  teamCount = DEFAULT_TEAM_COUNT
): BalancedTeams<P> {
  // Nunca más equipos que jugadores: un equipo vacío no es una reta.
  const keys = teamKeys(Math.min(teamCount, Math.max(2, selected.length)));
  const n = keys.length;

  const gks: (P | null)[] = Array.from({ length: n }, () => null);
  const members: P[][] = Array.from({ length: n }, () => []);

  const keepers = shuffle(selected.filter(canKeepGoal));
  const assignedAsGK = new Set<number>();
  for (const [index, keeper] of keepers.slice(0, n).entries()) {
    gks[index] = keeper;
    assignedAsGK.add(keeper.id);
  }

  const outfield = shuffle(
    selected.filter((p) => !assignedAsGK.has(p.id))
  ).sort((a, b) => b.overall - a.overall);

  const size = (index: number) =>
    (members[index]?.length ?? 0) + (gks[index] ? 1 : 0);
  const total = (index: number) => {
    return (
      (members[index] ?? []).reduce((a, p) => a + p.overall, 0) +
      (gks[index]?.overall ?? 0)
    );
  };

  for (const player of outfield) {
    let best = 0;
    for (let index = 1; index < n; index++) {
      if (
        size(index) < size(best) ||
        (size(index) === size(best) && total(index) < total(best))
      ) {
        best = index;
      }
    }
    members[best]?.push(player);
  }

  refine(members, gks);

  return withRatings(
    keys.map((key, index) => {
      const keeper = gks[index];
      return {
        key,
        lineups: [
          ...(keeper ? [{ player: keeper, role: "GK" as Position }] : []),
          ...assignRoles(members[index] ?? []),
        ],
      };
    })
  );
}

/**
 * Búsqueda local: intercambia una y otra vez a un jugador de campo entre el
 * equipo más fuerte y el más débil cuando eso reduce la brecha. Los tamaños se
 * conservan, así que solo se mueven las medias. El reparto voraz deja 1–3
 * puntos sobre la mesa; esto recupera casi todos en unas pocas pasadas.
 *
 * ponytail: solo mira el par (más fuerte, más débil). Con muchos equipos podría
 * quedar un intercambio útil entre dos intermedios; pasar a todos los pares si
 * algún día importa (es O(T²·P²), sigue siendo barato).
 */
function refine<P extends BalancerPlayer>(
  members: P[][],
  gks: (P | null)[]
): void {
  const squad = (index: number): P[] => {
    const keeper = gks[index];
    return [...(members[index] ?? []), ...(keeper ? [keeper] : [])];
  };

  for (let pass = 0; pass < 60; pass++) {
    const avgs = members.map((_, index) => meanOverall(squad(index)));
    let hi = 0;
    let lo = 0;
    for (const [index, a] of avgs.entries()) {
      if (a > (avgs[hi] ?? 0)) hi = index;
      if (a < (avgs[lo] ?? 0)) lo = index;
    }
    if (hi === lo) {
      return;
    }

    const base = spread(members.map((_, index) => squad(index)));
    let bestGain = 0;
    let bestSwap: [number, number] | null = null;

    const high = members[hi] ?? [];
    const low = members[lo] ?? [];

    for (const [a, element] of high.entries()) {
      for (const [b, element_] of low.entries()) {
        const from = element as P;
        const to = element_!;
        // Solo tiene sentido mandar al débil a alguien mejor.
        if (from.overall <= to.overall) {
          continue;
        }

        const swapped = members.map((m, index) => {
          if (index === hi) {
            return m.map((p, k) => (k === a ? to : p));
          }
          if (index === lo) {
            return m.map((p, k) => (k === b ? from : p));
          }
          return m;
        });
        const gain =
          base -
          spread(
            swapped.map((m, index) => {
              const keeper = gks[index];
              return [...m, ...(keeper ? [keeper] : [])];
            })
          );
        if (gain > bestGain + 1e-9) {
          bestGain = gain;
          bestSwap = [a, b];
        }
      }
    }

    if (!bestSwap) {
      return;
    }
    const [a, b] = bestSwap;
    const temporary = high[a]!;
    high[a] = low[b]!;
    low[b] = temporary;
  }
}
