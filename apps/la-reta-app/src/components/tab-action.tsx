import { useIsFocused } from "expo-router";
import { useEffect, useId, useRef, useSyncExternalStore } from "react";

import type { IconName } from "@/components/ui/icon";

/**
 * La acción principal de la pantalla, en el cristal de la barra de pestañas.
 *
 * iOS 26 tiene un sitio para esto —el accesorio de la tab bar, el mismo que en
 * Mail lleva el botón de redactar— y flota con el cristal, se encoge al bajar y
 * vuelve al subir. Antes había una barra propia clavada abajo: por mucho que se
 * calculara el hueco, competía con la tab bar por el mismo borde de la pantalla
 * y acababa medio tapada.
 *
 * Puede llevar más de una acción: el accesorio las reparte en horizontal, así
 * que "Compartir" y "Repartir" caben en la misma píldora sin robarle sitio al
 * contenido de la pantalla.
 *
 * El estado vive **fuera de React**, en este módulo, y no en un contexto. Con
 * contexto el accesorio salía vacío: `NativeTabs.BottomAccessory` lo monta el
 * host nativo en su propio árbol, así que un proveedor colocado sobre las
 * pantallas no le llega. Un store externo no depende de dónde cuelgue cada
 * cual. Además iOS monta dos copias del accesorio, una por colocación, y así
 * las dos leen exactamente lo mismo.
 */

export interface TabAction {
  label: string;
  icon: IconName;
  onPress: () => void;
  disabled?: boolean;
}

let current: TabAction[] = [];
/**
 * Quién puso la acción que se ve.
 *
 * Al navegar, la pantalla nueva se enfoca antes de que la vieja se entere de
 * que perdió el foco, así que sin dueño la limpieza de la que sale borraba la
 * acción que la que entra acababa de publicar, y el cristal se quedaba vacío.
 */
let owner: string | null = null;
const listeners = new Set<() => void>();

function publish(id: string, actions: TabAction[]): void {
  if (actions.length === 0 && owner !== id) return;

  current = actions;
  owner = actions.length === 0 ? null : id;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const snapshot = (): TabAction[] => current;

/** Lo que lee el accesorio de la barra. */
export function useTabActionValue(): TabAction[] {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

/**
 * Publica la acción de esta pantalla mientras esté montada.
 *
 * `onPress` se guarda en una referencia y **no** entra en las dependencias del
 * efecto: quien llama pasa una función nueva en cada render, y con ella en la
 * lista el efecto volvería a publicar, eso provocaría otro render y el bucle no
 * pararía. La referencia siempre apunta al último manejador, así que el cristal
 * ejecuta lo que la pantalla piensa ahora, no lo de hace tres renders.
 */
export function useTabAction(actions: TabAction[]): void {
  const id = useId();
  const focused = useIsFocused();
  const latest = useRef(actions);

  // Lo que cambia el dibujo del accesorio. `onPress` queda fuera: la pantalla
  // pasa funciones nuevas en cada render y con ellas en la lista el efecto
  // republicaría sin parar.
  const signature = actions
    .map((action) => `${action.label}/${action.icon}/${action.disabled}`)
    .join();

  useEffect(() => {
    latest.current = actions;
  });

  useEffect(() => {
    // Se publica al **enfocar**, no al montar: las pestañas nativas mantienen
    // vivas todas sus pantallas, así que montando salía el "Convocar" de Armar
    // encima de Inicio.
    const published = focused
      ? latest.current.map((action, index) => ({
          label: action.label,
          icon: action.icon,
          disabled: action.disabled,
          // Se llama a través de la referencia para ejecutar lo que la pantalla
          // piensa ahora, no lo de hace tres renders.
          onPress: () => latest.current[index]?.onPress(),
        }))
      : [];

    publish(id, published);

    // Al salir, el cristal se queda vacío: una acción huérfana aplicaría a lo
    // que sea que haya debajo.
    return () => publish(id, []);
  }, [id, focused, signature]);
}
