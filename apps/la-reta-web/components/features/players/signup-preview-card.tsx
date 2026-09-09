"use client";

import { PreviewStage } from "@/components/features/players/preview-stage";
import { SPRING_POP } from "@/components/motion/motion-tokens";
import { FifaCard } from "@/components/shared/fifa-card";
import type { Player } from "@/lib/db/schema";
import type { PhotoUpload } from "@/lib/upload-photo";
import { m } from "motion/react";

/**
 * La carta de la solicitud, en vivo.
 *
 * Misma carta, mismo tamaño y mismo movimiento que la del alta —comparten
 * `FifaCard` y `PreviewStage`—, pero **sin notas**: los atributos los pone el
 * admin al dar de alta, así que aquí no hay OVR que enseñar. `FifaCard` lo
 * deduce de que no venga `overall` y se pinta con marco neutro, un guion en
 * lugar del número y una línea donde irían los atributos.
 *
 * Ese hueco es deliberado. Un 0 es una nota, y un número inventado con cara de
 * dato es justo lo que no se hace aquí; además la propia página promete que "el
 * nivel lo define el equipo", y la carta tiene que decir lo mismo.
 */
export const SignupPreviewCard = ({
  name,
  displayName,
  position,
  position2,
  photoUrl,
  upload,
}: {
  readonly name: string;
  readonly displayName: string;
  readonly position: string;
  readonly position2: string;
  readonly photoUrl: string;
  readonly upload: PhotoUpload | null;
}) => {
  // Igual que en el alta: mientras se sube manda el object URL local, porque
  // pedir la de Blob deja la carta en blanco justo después de enseñarla.
  const shownPhoto = upload?.preview ?? (photoUrl || null);

  return (
    <m.div
      className="lg:sticky lg:top-16"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_POP}
    >
      <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
        Así quedará tu carta
      </p>

      {/* Solo la foto dispara el barrido: sin tier, es lo único que convierte la
          carta en otra. Teclear el nombre no lo es. */}
      <PreviewStage changeKey={shownPhoto ?? ""} upload={upload}>
        <FifaCard
          player={{
            name,
            displayName: (displayName || name || "JUGADOR").toUpperCase(),
            position: position as Player["position"],
            position2:
              position2 && position2 !== position
                ? (position2 as Player["position"])
                : null,
            photoUrl: shownPhoto,
          }}
          sizes="240px"
        />
      </PreviewStage>

      <p className="text-muted-foreground mt-3 text-center text-xs text-balance">
        Un admin define tus atributos al darte de alta. Entonces la carta
        estrena color: bronce, plata u oro.
      </p>
    </m.div>
  );
};
