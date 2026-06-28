import { formatTime } from "@/lib/dates";
import type { LiveGoal } from "./types";

export function countGoalsFor(goals: LiveGoal[], team: "A" | "B") {
  return goals.filter((goal) => goal.team === team).length;
}

export function getPlayerName(
  playersById: Map<number, string>,
  id: number | null,
) {
  if (id == null) return "Anónimo";
  return playersById.get(id) ?? "Jugador";
}

function shortName(fullName: string) {
  return fullName.trim().split(/\s+/).slice(-1)[0];
}

export function getScorersSummary(
  goals: LiveGoal[],
  team: "A" | "B",
  playersById: Map<number, string>,
) {
  const tally = new Map<number, number>();

  for (const goal of goals) {
    if (goal.team !== team || goal.playerId == null) continue;
    tally.set(goal.playerId, (tally.get(goal.playerId) ?? 0) + 1);
  }

  return [...tally].map(([playerId, count]) => {
    const label = shortName(getPlayerName(playersById, playerId));
    return count > 1 ? `${label} ×${count}` : label;
  });
}

export function formatGoalMinute(at: number, startedAt: number | null) {
  if (!startedAt) return "";
  return `${Math.max(0, Math.floor((at - startedAt) / 60000))}'`;
}

export function formatGoalClock(at: number) {
  return formatTime(at);
}

export function tallyGoalsByPlayer(goals: LiveGoal[]) {
  const tally = new Map<string, { playerId: number; team: "A" | "B"; goals: number }>();

  for (const goal of goals) {
    if (goal.playerId == null) continue;
    const key = `${goal.playerId}:${goal.team}`;
    const current = tally.get(key) ?? {
      playerId: goal.playerId,
      team: goal.team,
      goals: 0,
    };
    tally.set(key, { ...current, goals: current.goals + 1 });
  }

  return [...tally.values()];
}

export function createGoalEvent(team: "A" | "B", currentCount: number) {
  const at = Date.now();
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `goal-${at}-${team}-${currentCount}`;

  return { id, team, at };
}
