import type { ImperativeRouter } from "expo-router";

type Destination = Parameters<ImperativeRouter["replace"]>[0];

/**
 * Cierra una pantalla superpuesta —modal u hoja— volviendo atrás, o yendo a
 * `fallback` cuando no hay nada detrás.
 *
 * El caso no es raro: si la pantalla es la primera de la pila, `router.back()`
 * no hace nada y avisa por consola ("The action 'GO_BACK' was not handled by
 * any navigator"). Pasa al abrir la app desde un deep link —`/calendario`,
 * `/sign-in`— y también al recargar en desarrollo estando en una de ellas. El
 * botón de cerrar quedaba muerto justo cuando más falta hace, porque no hay
 * nada más en pantalla.
 */
export function closeOverlay(router: ImperativeRouter, fallback: Destination) {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallback);
}
