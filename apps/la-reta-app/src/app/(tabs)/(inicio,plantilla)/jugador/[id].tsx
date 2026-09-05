import { PlayerSheet } from "@/components/player-sheet";

/**
 * Ficha de jugador, compartida por Inicio y Plantilla.
 *
 * El nombre del directorio `(inicio,plantilla)` es la sintaxis de expo-router
 * para una pantalla que vive en varias pilas a la vez: cada pestaña se queda
 * con su propio historial, así que tocar al crack desde Inicio abre la ficha
 * **dentro de Inicio** y volver regresa de donde saliste. Antes esto eran dos
 * ficheros con rutas distintas (`/ficha` y `/jugador`), que funcionaba pero
 * dejaba dos URLs para lo mismo.
 */
export default function JugadorScreen() {
  return <PlayerSheet />;
}
