"use client";

import * as React from "react";

/**
 * Autoplaying video at 50% volume (not muted). There's no HTML `volume`
 * attribute, so we set it on the element. Browsers may block autoplay with
 * sound; if so we retry muted so it still plays, and the controls let the user
 * unmute — volume is already at 0.5 so it never blasts.
 */
export const LegendVideo = ({
  src,
  className,
}: {
  readonly src: string;
  readonly className?: string;
}) => {
  const ref = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.volume = 0.25;
    v.play().catch(() => {
      v.muted = true;
      v.play().catch(() => {});
    });
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      className={className}
      // `muted` en el markup y no solo por JS: sin él el navegador bloquea el
      // autoplay, y la regla avisa con razón de que reproducir con sonido sin
      // que nadie lo pida es hostil.
      muted
      autoPlay
      loop
      playsInline
      controls
      preload="metadata"
      aria-label="Vídeo de la leyenda de la reta"
    >
      {/* El vídeo no lleva diálogo, pero la pista tiene que existir para que un
          lector de pantalla sepa que no hay nada que subtitular. */}
      <track kind="captions" label="Sin diálogo" />
    </video>
  );
};
