import type { Player } from "@/lib/db/schema";
import type {
  BalancedTeams as GenericBalancedTeams,
  Lineup as GenericLineup,
  TeamSplit as GenericTeamSplit,
} from "@repo/reta/balancer";

/**
 * El repartidor de equipos, atado a la ficha de jugador de la web.
 *
 * El algoritmo se mudó a `@repo/reta/balancer` porque la app móvil arma las
 * mismas retas: dos copias habrían divergido y el mismo grupo de gente habría
 * salido repartido distinto según desde dónde se generara. Aquí solo quedan los
 * alias con `Player`, para que los cientos de usos existentes —`BalancedTeams`
 * sin genérico— sigan compilando igual.
 *
 * La autocomprobación del algoritmo vive con él: `npm run test -w @repo/reta`.
 */

export {
  addToTeam,
  balanceTeams,
  balanceTeamsVaried,
  canKeepGoal,
  lightestTeam,
  lineupSignature,
  removeFromTeams,
  replacePlayer,
  splitSignature,
  swapPlayers,
  type RecentSplit,
} from "@repo/reta/balancer";

export type Lineup = GenericLineup<Player>;
export type TeamSplit = GenericTeamSplit<Player>;
export type BalancedTeams = GenericBalancedTeams<Player>;
