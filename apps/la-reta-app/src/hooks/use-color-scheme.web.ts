import { useSyncExternalStore } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

/**
 * En web el HTML se genera sin saber el tema del visitante, así que el primer
 * render tiene que coincidir con el del servidor ("light") y solo después
 * puede usar el valor real. Si no, la hidratación no cuadra.
 *
 * El flag sale de `useSyncExternalStore` en vez de un `useState` + `useEffect`:
 * React llama al snapshot de servidor durante SSR y durante la pasada de
 * hidratación, y al de cliente a partir de ahí. Eso es justo lo que hacía el
 * efecto, pero sin un `setState` que provoque un render en cascada — el patrón
 * que React 19 marca con `react-hooks/set-state-in-effect`.
 */

/** El valor nunca cambia después de hidratar, así que no hay a qué suscribirse. */
const subscribe = () => () => {
  // Sin suscripción: nada puede cambiar este valor.
};

const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function useColorScheme() {
  const hasHydrated = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return "light";
}
