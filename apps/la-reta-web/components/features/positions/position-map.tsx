"use client";

import { gsap, NO_REDUCED_MOTION, useGSAP } from "@/components/motion/gsap";
import { Pitch } from "@/components/shared/pitch";
import {
  GROUP_COLOR,
  POSITION_COORDS,
  POSITION_NAME,
  POSITIONS,
  type Position,
  positionGroup,
} from "@/lib/constants";
import type { RankedPlayer } from "@/lib/positions-insights";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";
import * as React from "react";

/**
 * De la portería al ataque.
 *
 * Manda dos cosas a la vez: el orden en que se tabula —recorrer la cancha de
 * atrás adelante es como se lee una alineación— y el de la entrada, que sube
 * como una ola en vez de encenderse a saltos.
 */
const MARKER_ORDER = [...POSITIONS].toSorted(
  (a, b) => POSITION_COORDS[a].x - POSITION_COORDS[b].x
);

/**
 * La cancha jugable: cada posición es un botón.
 *
 * Antes era un SVG con tooltips de hover, así que en un teléfono —que es donde
 * se abre esto, a la orilla de la cancha— no se podía hacer absolutamente nada.
 * Ahora se toca, se tabula y se lee con lector de pantalla, y el estado vive
 * arriba para que el panel de al lado cuente lo mismo que la cancha.
 */
export const PositionMap = ({
  byPosition,
  selected,
  onSelect,
}: {
  readonly byPosition: Readonly<Record<Position, readonly RankedPlayer[]>>;
  readonly selected: Position | null;
  readonly onSelect: (position: Position | null) => void;
}) => {
  const root = React.useRef<HTMLDivElement>(null);

  /**
   * La entrada de los quince marcadores: un tween con `stagger`, no quince.
   *
   * `set` antes que `to` porque un `from` escalonado solo aplica el estado
   * inicial al primero y los demás parpadean al llegarles el turno. Y
   * `clearProps` al final para devolverle el `transform` al CSS, que es quien
   * lleva el hover y el estado elegido.
   */
  useGSAP(
    () => {
      gsap.matchMedia().add(NO_REDUCED_MOTION, () => {
        const markers = gsap.utils.toArray<HTMLElement>(".position-marker");
        gsap.set(markers, { autoAlpha: 0, scale: 0.4 });
        gsap.to(markers, {
          autoAlpha: 1,
          scale: 1,
          ease: "back.out(2.2)",
          stagger: { amount: 0.45 },
          clearProps: "opacity,visibility,transform",
        });
      });
    },
    { scope: root }
  );

  /**
   * El aro que sale disparado al elegir una posición.
   *
   * Es un nodo que monta y desmonta con la selección, así que el tween se crea
   * en el mismo efecto que depende de ella (`revertOnUpdate`): creado una sola
   * vez se quedaría apuntando al aro de la posición anterior, que ya no está en
   * el documento, y no se vería nada.
   */
  useGSAP(
    () => {
      gsap.matchMedia().add(NO_REDUCED_MOTION, () => {
        gsap.fromTo(
          ".position-ping",
          { scale: 0.55, opacity: 0.5 },
          { scale: 2.4, opacity: 0, duration: 0.7, ease: "power2.out" }
        );
      });
    },
    { dependencies: [selected], revertOnUpdate: true, scope: root }
  );

  return (
    // `@container` y no breakpoints: los marcadores se miden en `cqw`, así que
    // escalan con el ancho real de la cancha —que en móvil vive dentro de un
    // scroll horizontal— y no con el de la ventana.
    <div className="@container relative" ref={root}>
      <Pitch markers={false} />
      <div className="absolute inset-0">
        {MARKER_ORDER.map((position) => {
          const group = positionGroup(position);
          const { x, y } = POSITION_COORDS[position];
          const depth = byPosition[position].length;
          const isSelected = selected === position;
          const dimmed = selected !== null && !isSelected;

          return (
            // El envoltorio centra y el botón se anima: si GSAP escribiera el
            // `transform` del mismo nodo que lleva el `-translate-x-1/2`, los
            // marcadores saltarían a la esquina durante la entrada.
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              key={position}
              style={
                {
                  left: `${x}%`,
                  top: `${y}%`,
                  "--line": GROUP_COLOR[group],
                } as CSSProperties
              }
            >
              {isSelected ? (
                <span
                  aria-hidden="true"
                  className="position-ping pointer-events-none absolute inset-0 rounded-full opacity-0"
                  style={{ backgroundColor: GROUP_COLOR[group] }}
                />
              ) : null}
              <button
                aria-label={`${position} · ${POSITION_NAME[position]}: ${depth} ${depth === 1 ? "jugador" : "jugadores"}`}
                aria-pressed={isSelected}
                className={cn(
                  "position-marker relative grid size-[6.8cqw] place-items-center rounded-full font-bold text-white transition duration-200",
                  // El toque real es mayor que el círculo: en el teléfono los
                  // marcadores quedan a 38 px y sin esto se falla el tiro.
                  "before:absolute before:-inset-2 before:content-['']",
                  "hover:scale-110 focus-visible:scale-110 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none",
                  depth > 0
                    ? "bg-[var(--line)] ring-2 ring-white/70"
                    : "ring-dashed bg-[var(--line)]/35 ring-2 ring-white/40",
                  isSelected && "scale-115 ring-4 ring-white",
                  dimmed && "opacity-45 saturate-50"
                )}
                onClick={() => onSelect(isSelected ? null : position)}
                type="button"
              >
                <span className="text-[2.4cqw] leading-none">{position}</span>
                {depth > 0 ? (
                  <span
                    className="absolute -top-[1.4cqw] -right-[1.4cqw] grid size-[3.2cqw] place-items-center rounded-full bg-white text-[1.8cqw] leading-none text-[var(--line)] tabular-nums"
                    // El número ya lo dice el `aria-label` del botón.
                    aria-hidden="true"
                  >
                    {depth}
                  </span>
                ) : null}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
