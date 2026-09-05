import { MatchSheet } from "@/components/match-sheet";

/**
 * Ficha de partido, compartida por Inicio, Plantilla y Partidos.
 *
 * Plantilla también la necesita: desde la ficha de un jugador se puede abrir
 * cualquiera de los partidos en los que apareció.
 */
export default function PartidoScreen() {
  return <MatchSheet />;
}
