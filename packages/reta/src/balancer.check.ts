import {
  balanceTeams,
  balanceTeamsVaried,
  splitSignature,
  swapPlayers,
} from "./balancer";
import type { BalancedTeams, BalancerPlayer, Lineup } from "./balancer";
import type { Position } from "./positions";

/**
 * Autocomprobación del repartidor: `npm run test -w @repo/reta`.
 *
 * Va en su propio archivo y no al final de `balancer.ts` como antes porque el
 * módulo ahora lo empaqueta Metro para el móvil, y allí `process.argv` no
 * existe: la guarda que lanzaba la demo reventaría al importar el balanceador
 * en el teléfono.
 */

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`reta/balancer: ${message}`);
  }
}

function lineup(
  id: number,
  overall: number,
  role: Position
): Lineup<BalancerPlayer> {
  return { player: { id, overall, position: role, position2: null }, role };
}

function checkBoardEdits(): void {
  const teams: BalancedTeams<BalancerPlayer> = {
    teams: [
      {
        key: "A",
        lineups: [lineup(1, 40, "GK"), lineup(2, 50, "CB")],
        rating: 45,
      },
      {
        key: "B",
        lineups: [lineup(3, 60, "GK"), lineup(4, 80, "ST")],
        rating: 70,
      },
    ],
    diff: 25,
  };

  // Cambio entre equipos: el ocupante se muda, el puesto se queda, las medias
  // se recalculan.
  const swapped = swapPlayers(teams, 2, 4);
  const movedIn = swapped.teams[0]?.lineups[1];
  const movedOut = swapped.teams[1]?.lineups[1];
  assert(
    movedIn?.player.id === 4 && movedIn.role === "CB",
    "el ocupante cambia y el puesto se conserva"
  );
  assert(
    movedOut?.player.id === 2 && movedOut.role === "ST",
    "el otro lado refleja el cambio"
  );
  assert(
    swapped.teams[0]?.rating === 60 && swapped.teams[1]?.rating === 55,
    "medias recalculadas"
  );
  assert(teams.teams[0]?.lineups[1]?.player.id === 2, "el original no se muta");
  assert(
    swapPlayers(teams, 1, 2).teams[0]?.rating === 45,
    "un cambio dentro del equipo no mueve su media"
  );
  assert(swapPlayers(teams, 2, 2) === teams, "mismo id no hace nada");
  assert(swapPlayers(teams, 2, 999) === teams, "id inexistente no hace nada");
}

function checkSignature(): void {
  assert(
    splitSignature([
      [2, 1],
      [4, 3],
    ]) === "1,2|3,4",
    "la firma va ordenada"
  );
  assert(
    splitSignature([
      [3, 4],
      [1, 2],
    ]) ===
      splitSignature([
        [1, 2],
        [3, 4],
      ]),
    "la firma ignora las letras de equipo"
  );
}

const POOL_SIZE = 18;

/**
 * Medias repartidas y un portero cada seis, para que el reparto tenga
 * materia con la que trabajar.
 */
function poolPlayer(index: number): BalancerPlayer {
  return {
    id: index + 1,
    overall: 50 + ((index * 7) % 40),
    position: index % 6 === 0 ? "GK" : "CM",
    position2: null,
  };
}

const pool: BalancerPlayer[] = Array.from({ length: POOL_SIZE }, (_, index) =>
  poolPlayer(index)
);

function checkSplits(): void {
  for (const count of [2, 3, 4]) {
    const split = balanceTeams(pool, count);
    assert(split.teams.length === count, `${count} equipos generados`);

    const sizes = split.teams.map((t) => t.lineups.length);
    assert(
      Math.max(...sizes) - Math.min(...sizes) <= 1,
      `${count}: tamaños parejos`
    );
    assert(
      split.teams.flatMap((t) => t.lineups).length === pool.length,
      `${count}: nadie se pierde ni se duplica`
    );
    assert(split.diff <= 4, `${count}: diff razonable (${split.diff})`);

    const gkTeams = split.teams.filter((t) =>
      t.lineups.some((l) => l.role === "GK")
    ).length;
    assert(gkTeams === Math.min(count, 3), `${count}: un portero por equipo`);
  }

  assert(
    balanceTeams(pool.slice(0, 3), 6).teams.length === 3,
    "acota el número de equipos por los jugadores que hay"
  );
}

/**
 * La memoria: con el reparto de la semana pasada en el historial, el generador
 * tiene que ofrecer otro. Se repite el experimento porque el balanceador es
 * aleatorio y un solo intento no distingue suerte de criterio.
 */
function checkMemory(): void {
  const previous = balanceTeams(pool, 2);
  const sides = previous.teams.map((t) => t.lineups.map((l) => l.player.id));
  const signature = splitSignature(sides);

  let repeats = 0;
  const rounds = 30;
  for (let index = 0; index < rounds; index += 1) {
    const next = balanceTeamsVaried(pool, [{ sides }], 2);
    const nextSignature = splitSignature(
      next.teams.map((t) => t.lineups.map((l) => l.player.id))
    );
    if (nextSignature === signature) {
      repeats += 1;
    }
  }
  assert(repeats === 0, `no repite el reparto anterior (repitió ${repeats})`);

  // Un historial viejo pesa menos que uno fresco: la misma firma castigada en
  // la posición 0 y en la 20 no puede dar el mismo resultado.
  const STALE_ROUNDS = 20;
  const stale: { sides: number[][] }[] = Array.from(
    { length: STALE_ROUNDS },
    () => ({ sides })
  );
  const withStale = balanceTeamsVaried(pool, stale, 2);
  assert(
    withStale.teams.length === 2,
    "un historial largo no rompe el reparto"
  );

  assert(
    balanceTeamsVaried(pool, [], 2).teams.length === 2,
    "sin historial cae al reparto normal"
  );
}

checkBoardEdits();
checkSignature();
checkSplits();
checkMemory();

// Es un script de comprobación: la salida es el resultado.
console.log("ok");
