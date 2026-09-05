/**
 * `<ViewTransition>` ya existe en el React que el App Router empaqueta (canal
 * canary; verificado en runtime con Next 16.3), pero `@types/react` 19.2 todavía
 * no lo declara. Este augment le da tipos sin instalar `react@canary`, que es
 * justo lo que la guía de Next pide NO hacer.
 *
 * Cuando @types/react lo incluya, borra este archivo.
 *
 * Las reglas de abajo se apagan porque dentro de `declare module` ESLint no
 * resuelve el ámbito del módulo aumentado: marca `ReactNode`/`Ref` como no
 * definidos si los usas sin calificar, y como calificación redundante si les
 * pones `React.`. TypeScript sí los resuelve (`tsc --noEmit` pasa limpio).
 */
/* eslint-disable no-undef, sonarjs/no-reference-error, unicorn/name-replacements */
import "react";

declare module "react" {
  interface ViewTransitionClassPerType {
    [transitionType: string]: string;
    default: string;
  }

  interface ViewTransitionProps {
    /*
     * Identidad compartida entre dos vistas: habilita el morph.
     * Debe ser único.
     */
    name?: string;
    children?: ReactNode;
    default?: string | ViewTransitionClassPerType;
    enter?: string | ViewTransitionClassPerType;
    exit?: string | ViewTransitionClassPerType;
    share?: string | ViewTransitionClassPerType;
    update?: string | ViewTransitionClassPerType;
    ref?: Ref<unknown>;
    onEnter?: (element: Element, types: string[]) => void;
    onExit?: (element: Element, types: string[]) => void;
    onShare?: (element: Element, types: string[]) => void;
    onUpdate?: (element: Element, types: string[]) => void;
  }

  const ViewTransition: ComponentType<ViewTransitionProps>;

  function addTransitionType(type: string): void;
}
