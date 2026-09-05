/**
 * Dónde se juega la reta.
 *
 * Vive en el paquete de dominio y no en la app porque es un dato de la reta,
 * como las posiciones o las letras de equipo: la web lo va a querer para el
 * calendario y para las fichas de partido en cuanto exista esa vista.
 *
 * Es una constante y no una fila de la base a propósito, de momento: la
 * cuadrilla juega siempre en la misma cancha, y una tabla de sedes con un solo
 * registro es una tabla que hay que mantener para nada. Cuando haya una segunda
 * cancha —o cuando alguien quiera cambiarla sin publicar una versión— esto se
 * muda a `retas.venue` y esta constante pasa a ser el valor por defecto.
 */

export const VENUE = {
  name: "Canchas de Futbol 7 Arcángeles",
  city: "Morelia",
  address:
    "Juana María Estrada 255, Residencial San José de la Huerta, 58088 Morelia, Mich.",
} as const;

/**
 * Nombre y dirección en una línea, que es lo que entienden los mapas.
 */
export const venueQuery = (): string => `${VENUE.name}, ${VENUE.address}`;

/**
 * El enlace a cada mapa.
 *
 * Se usan los enlaces `https` y no los esquemas propios (`comgooglemaps://`,
 * `maps://`) porque estos últimos no abren nada si la app no está instalada, y
 * habría que comprobar antes con `canOpenURL` y una entrada en el Info.plist.
 * Con `https` el teléfono abre la app cuando la tiene y el navegador cuando no.
 */
export function mapsUrl(provider: "google" | "apple"): string {
  const query = encodeURIComponent(venueQuery());

  return provider === "google"
    ? `https://www.google.com/maps/search/?api=1&query=${query}`
    : `https://maps.apple.com/?q=${query}`;
}
