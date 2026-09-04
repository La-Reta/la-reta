import type { TeamKey } from "@/lib/teams";

/** Quién está en la cancha y quién espera turno. */
export type Pairing = { home: TeamKey; away: TeamKey; queue: TeamKey[] };

/** Arranque: juegan los dos primeros, el resto hace fila en orden. */
export function initialPairing(keys: TeamKey[]): Pairing {
  return { home: keys[0], away: keys[1], queue: keys.slice(2) };
}

/**
 * Rotación clásica de reta: **gana y se queda**. El perdedor se va al final de
 * la fila y entra el siguiente. Con 2 equipos (fila vacía) no hay rotación: se
 * repite el mismo partido.
 *
 * ponytail: el empate saca al local (el que llevaba más tiempo en cancha) y
 * deja al retador. Si en tu cancha el empate lo resuelven a penales o se queda
 * el local, cambia solo esta línea.
 */
export function rotate(
  p: Pairing,
  scoreHome: number,
  scoreAway: number,
): Pairing {
  if (p.queue.length === 0) return p;
  const homeWins = scoreHome > scoreAway;
  const stays = homeWins ? p.home : p.away;
  const leaves = homeWins ? p.away : p.home;
  return {
    home: stays,
    away: p.queue[0],
    queue: [...p.queue.slice(1), leaves],
  };
}

// self-check (npx tsx lib/live-rotation.ts)
export function demo() {
  const assert = (c: boolean, m: string) => {
    if (!c) throw new Error("live-rotation demo failed: " + m);
  };
  const keys: TeamKey[] = ["A", "B", "C"];
  const start = initialPairing(keys);
  assert(
    start.home === "A" && start.away === "B" && start.queue.join() === "C",
    "arranca A vs B con C en fila",
  );

  // Gana el local: se queda y entra C; B a la fila.
  const r1 = rotate(start, 3, 1);
  assert(
    r1.home === "A" && r1.away === "C" && r1.queue.join() === "B",
    "gana local: A vs C",
  );
  // Gana el visitante: C se queda de local, entra B, A a la fila.
  const r2 = rotate(r1, 0, 2);
  assert(
    r2.home === "C" && r2.away === "B" && r2.queue.join() === "A",
    "gana visitante: C vs B",
  );
  // Empate: sale el local.
  const r3 = rotate(r2, 1, 1);
  assert(
    r3.home === "B" && r3.away === "A" && r3.queue.join() === "C",
    "empate: sale el local",
  );
  // Nadie se pierde en el camino.
  assert(
    [r3.home, r3.away, ...r3.queue].sort().join() === "A,B,C",
    "los 3 equipos siguen en juego",
  );
  // Con 2 equipos no hay rotación.
  const two = initialPairing(["A", "B"]);
  assert(rotate(two, 5, 0) === two, "2 equipos: sin rotación");

  return "ok";
}

if (process.argv[1]?.endsWith("live-rotation.ts")) console.log(demo());
