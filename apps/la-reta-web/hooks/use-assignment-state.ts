import { CasacaAssignmentRow } from "@/lib/queries";

export type AssignmentState = {
  isToday: boolean;
  hasAlreadyAssignedToday: boolean;
  todaysAssignedIds: Set<number | null>;
  availablePool: any[];
  todaysAssignments: CasacaAssignmentRow[];
};

/** Compute assignment state: today's assignments, available players, match day status. */
export function useAssignmentState({
  assignments,
  pool,
  daysUntil,
}: {
  assignments: CasacaAssignmentRow[];
  pool: any[];
  daysUntil: () => number;
}): AssignmentState {
  const today = new Date().toDateString();

  // Get all assignments from today (sorted by most recent first)
  const todaysAssignments = assignments
    .filter((a) => new Date(a.createdAt).toDateString() === today)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const hasAlreadyAssignedToday = todaysAssignments.length > 0;
  const todaysAssignedIds = new Set(
    todaysAssignments.map((a) => a.playerId).filter(Boolean),
  );

  const isToday = daysUntil() === 0;

  // Filter pool to exclude people already assigned today
  const availablePool = pool.filter((p) => !todaysAssignedIds.has(p.id));

  return {
    isToday,
    hasAlreadyAssignedToday,
    todaysAssignedIds,
    availablePool,
    todaysAssignments,
  };
}
