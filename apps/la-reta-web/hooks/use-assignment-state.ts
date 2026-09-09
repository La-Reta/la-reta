import type { CasacaAssignmentRow } from "@/lib/queries";

/**
 * Lo mínimo que necesita saber de alguien del pool: su id de plantilla, que es
 * `null` para los invitados de última hora.
 */
export interface Assignable {
  id: number | null;
}

export interface AssignmentState<T extends Assignable> {
  isToday: boolean;
  hasAlreadyAssignedToday: boolean;
  todaysAssignedIds: Set<number>;
  availablePool: T[];
  todaysAssignments: CasacaAssignmentRow[];
}

/**
 * `new Date(x).toDateString()` en una sola pieza: encadenar sobre un `new` se
 * lee peor y el linter lo marca.
 */
function dayOf(value: Date | string): string {
  const date = new Date(value);
  return date.toDateString();
}

/**
 * Milisegundos de una fecha, sin encadenar sobre el `new`.
 */
function msOf(value: Date | string): number {
  const date = new Date(value);
  return date.getTime();
}

/**
Compute assignment state: today's assignments, available players, match day status.
*/
export function useAssignmentState<T extends Assignable>({
  assignments,
  pool,
  daysUntil,
}: {
  assignments: CasacaAssignmentRow[];
  pool: T[];
  daysUntil: () => number;
}): AssignmentState<T> {
  const now = new Date();
  const today = now.toDateString();

  // Get all assignments from today (sorted by most recent first)
  const todaysAssignments = assignments
    .filter((a) => dayOf(a.createdAt) === today)
    .toSorted((a, b) => msOf(b.createdAt) - msOf(a.createdAt));

  const hasAlreadyAssignedToday = todaysAssignments.length > 0;
  // `filter(Boolean)` no estrecha el tipo, así que el descarte va en un paso.
  const todaysAssignedIds = new Set(
    todaysAssignments.flatMap((a) => (a.playerId == null ? [] : [a.playerId]))
  );

  const isToday = daysUntil() === 0;

  // Filter pool to exclude people already assigned today
  const availablePool = pool.filter(
    (p) => p.id === null || !todaysAssignedIds.has(p.id)
  );

  return {
    isToday,
    hasAlreadyAssignedToday,
    todaysAssignedIds,
    availablePool,
    todaysAssignments,
  };
}
