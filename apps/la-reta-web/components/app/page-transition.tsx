import { ViewTransition } from "react";
import type { ReactNode } from "react";

/**
 * Transición direccional de página.
 *
 * Va en cada `page.tsx` (nunca en un layout: los layouts persisten entre
 * navegaciones, así que enter/exit no dispararían nunca). Los enlaces marcan la
 * dirección con `transitionTypes={["nav-forward"]}` o `["nav-back"]`; sin tipo
 * —el botón atrás del navegador, un `router.refresh()`, un Suspense que
 * resuelve— cae en `default: "none"` y no se anima nada.
 *
 * Las clases `nav-forward`/`nav-back` viven en `app/globals.css`.
 */
export const PageTransition = ({
  children,
}: {
  readonly children: ReactNode;
}) => {
  return (
    <ViewTransition
      enter={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        default: "none",
      }}
      exit={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        default: "none",
      }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
};
