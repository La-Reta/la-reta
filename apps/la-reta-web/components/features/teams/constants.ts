import { TEAM_COLORS } from "@/lib/teams";

// sky y rose, los dos primeros de TEAM_COLORS.
export const TEAM_A = TEAM_COLORS.A;
export const TEAM_B = TEAM_COLORS.B;

// Anchos de exportación: se renderiza una copia oculta a este ancho para que la
// descarga (html-to-image) salga a tamaño desktop aun desde mobile.
export const EXPORT_BOARD_WIDTH = 1120;
// ponytail: portrait width for list export
export const EXPORT_LIST_WIDTH = 720;

/**
 * Cómo se presenta el mismo reparto: tablero (cancha) o lista. Vive aquí y no
 * en un componente porque lo usan el matchup, el hook de descarga y el
 * orquestador; antes lo exportaba la barra de controles, que ya no existe.
 */
export type MatchupView = "board" | "list";
