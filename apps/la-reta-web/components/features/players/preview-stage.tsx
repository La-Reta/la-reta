"use client";

import { gsap, NO_REDUCED_MOTION, useGSAP } from "@/components/motion/gsap";
import { FADE_DURATION } from "@/components/motion/motion-tokens";
import { TiltCard } from "@/components/motion/tilt-card";
import type { PhotoUpload } from "@/lib/upload-photo";
import { AnimatePresence, m } from "motion/react";
import * as React from "react";

/** El barrido de luz que marca que la carta se acaba de "imprimir" de nuevo. */
const SHINE =
  "linear-gradient(105deg, transparent 40%, rgb(255 255 255 / 55%) 50%, transparent 60%)";

/**
 * El escenario de una carta en vista previa: el tilt, el barrido cuando la carta
 * pasa a ser otra, y el velo de la subida.
 *
 * Lo comparten el alta (`PlayerPreviewCard`) y el registro
 * (`SignupPreviewCard`): las dos enseñan la misma carta al mismo tamaño y con el
 * mismo movimiento, y lo único que cambia entre ellas es **qué** carta va dentro
 * y qué se considera un cambio. Si cada una tuviera su copia del barrido, el
 * mismo gesto acabaría durando distinto según la pantalla.
 *
 * `changeKey` es lo que dispara el barrido: quien lo usa decide qué cuenta como
 * "la carta ya es otra".
 */
export const PreviewStage = ({
  changeKey,
  upload,
  children,
}: {
  readonly changeKey: string;
  readonly upload: PhotoUpload | null;
  readonly children: React.ReactNode;
}) => {
  const root = React.useRef<HTMLDivElement>(null);

  /**
   * `revertOnUpdate` hace dos cosas que aquí importan: mata el barrido anterior
   * si llega otro antes de terminar (tres fotos seguidas no dejan tres barridos
   * solapados sobre el mismo nodo), y **vuelve a buscar los elementos en cada
   * pasada**. Lo segundo no es un detalle: un timeline creado una sola vez se
   * queda con los nodos de ese momento, y aquí los nodos cambian.
   */
  useGSAP(
    () => {
      gsap.matchMedia().add(NO_REDUCED_MOTION, () => {
        gsap
          .timeline()
          .fromTo(
            ".preview-shine",
            { xPercent: -160, opacity: 0 },
            { xPercent: 160, opacity: 1, duration: 0.8, ease: "power2.inOut" },
            0
          )
          .to(".preview-shine", { opacity: 0, duration: 0.25 }, 0.55)
          .fromTo(
            ".preview-stage",
            { scale: 0.97 },
            { scale: 1, duration: 0.6, ease: "back.out(1.8)" },
            0
          );
      });
    },
    { dependencies: [changeKey], revertOnUpdate: true, scope: root }
  );

  return (
    <div ref={root}>
      {/* Lo que anima GSAP va FUERA de `TiltCard` a propósito. TiltCard cambia
          de `<div>` a `m.div` en cuanto `useFinePointer` confirma que hay ratón
          —después de hidratar—, y cambiar el tipo de elemento remonta todo su
          subárbol: los nodos de dentro son otros a partir de ese instante. Un
          timeline creado antes se queda animando los viejos, ya desconectados
          del documento, y no se ve absolutamente nada. */}
      <div className="preview-stage relative mx-auto max-w-[240px]">
        <TiltCard className="rounded-xl">{children}</TiltCard>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-xl"
        >
          <span
            className="preview-shine absolute inset-0 opacity-0"
            style={{ backgroundImage: SHINE }}
          />
        </span>
        <AnimatePresence>
          {upload && upload.stage !== "done" ? (
            <UploadProgress key="progress" progress={upload.progress} />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};

/**
 * La barra es un timeline pausado que se **busca** con `progress`, no un tween
 * nuevo por cada tick: una subida que se acelera dejaría tweens encolados
 * peleándose por el mismo nodo.
 *
 * No lleva `matchMedia`: buscar un timeline es posicionar, no animar, y la
 * barra es información, no adorno. Quien sí anima —el velo que entra y sale—
 * es Motion, que ya respeta la preferencia por su cuenta.
 */
const UploadProgress = ({ progress }: { readonly progress: number }) => {
  const root = React.useRef<HTMLDivElement>(null);
  const bar = React.useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      bar.current = gsap
        .timeline({ paused: true })
        .fromTo(
          ".preview-progress-bar",
          { scaleX: 0 },
          { scaleX: 1, ease: "none", duration: 1 }
        );
    },
    { scope: root }
  );

  useGSAP(
    () => {
      bar.current?.progress(progress);
    },
    { dependencies: [progress], scope: root }
  );

  return (
    <m.div
      ref={root}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: FADE_DURATION }}
      className="absolute inset-0 z-20 flex items-end overflow-hidden rounded-xl bg-black/55 p-3"
    >
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/25">
        <div className="preview-progress-bar h-full origin-left rounded-full bg-white" />
      </div>
    </m.div>
  );
};
