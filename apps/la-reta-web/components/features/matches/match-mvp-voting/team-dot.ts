import { isTeamKey, TEAM_COLORS } from "@/lib/teams";

/** Color del punto del equipo. Devuelve un hex (style) para soportar 3+ equipos. */
export function teamDot(team: string | null) {
  return isTeamKey(team) ? TEAM_COLORS[team] : null;
}
