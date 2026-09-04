"use client";

import * as React from "react";

/**
 * Autoplaying video at 50% volume (not muted). There's no HTML `volume`
 * attribute, so we set it on the element. Browsers may block autoplay with
 * sound; if so we retry muted so it still plays, and the controls let the user
 * unmute — volume is already at 0.5 so it never blasts.
 */
export function LegendVideo({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
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
      autoPlay
      loop
      playsInline
      controls
      preload="metadata"
    />
  );
}
