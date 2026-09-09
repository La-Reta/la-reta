"use client";

import { PreviewStage } from "@/components/features/players/preview-stage";
import { SPRING_POP } from "@/components/motion/motion-tokens";
import { FifaCard } from "@/components/shared/fifa-card";
import type { Player } from "@/lib/db/schema";
import { cardTier } from "@/lib/ratings";
import type { PhotoUpload } from "@/lib/upload-photo";
import { m } from "motion/react";

/**
 * La carta que se está editando, en vivo.
 *
 * Es el único sitio donde se ve la foto: el campo de la izquierda solo dice en
 * qué estado está (ver `PlayerPhotoField`). Por eso aquí pasan las dos cosas
 * que le importan a quien rellena el formulario —la foto que llega y la subida
 * que avanza— y por eso vale la pena animarlas.
 *
 * El movimiento (tilt, barrido, velo de subida) vive en `PreviewStage`, que
 * comparte con la vista previa del registro.
 */
export const PlayerPreviewCard = ({
  player,
  upload,
}: {
  readonly player: Player;
  readonly upload: PhotoUpload | null;
}) => {
  /**
   * El object URL local se queda puesto aunque la subida ya haya terminado. La
   * URL de Blob es exactamente la misma imagen, pero pedirla otra vez deja la
   * carta en blanco mientras viaja — justo después de haberla enseñado.
   */
  const photoUrl = upload?.preview ?? player.photoUrl;
  const shown = photoUrl === player.photoUrl ? player : { ...player, photoUrl };

  /**
   * El barrido se dispara cuando llega (o cambia) la foto y cuando la carta
   * cambia de tier —bronce → plata → oro—, que son los dos momentos en que la
   * carta pasa a ser otra. Los atributos sueltos no: el OVR ya lo cuenta.
   */
  const changeKey = `${photoUrl ?? ""}|${cardTier(player.overall)}`;

  return (
    <m.div
      className="lg:sticky lg:top-16"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_POP}
    >
      {/* El OVR no se anima: la carta ya lo enseña en grande, y un conteo suave
          aquí hacía que los dos números dijeran cosas distintas durante medio
          segundo. Se lee como un fallo, no como una animación. */}
      <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
        Vista previa · OVR{" "}
        <span className="text-foreground tabular-nums">{player.overall}</span>
      </p>

      <PreviewStage changeKey={changeKey} upload={upload}>
        <FifaCard player={shown} sizes="240px" />
      </PreviewStage>
    </m.div>
  );
};
