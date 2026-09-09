"use client";

import * as React from "react";

/**
 * Full-page loading state: a random animated loader from `gifs` + a message.
 *
 * The pick AND a cache-busting query happen on the CLIENT at mount, so every
 * time the loader appears it re-rolls and the animation restarts from frame 0.
 * Doing this on the server froze the choice (Next caches the loading.tsx RSC)
 * and the browser resumed the cached animation — "same gif until it finishes".
 *
 * Plain <img> so the animated GIF/WebP keeps playing and no remotePatterns
 * config is needed; `gifs` can be local paths or remote URLs.
 */
export const GifLoader = ({
  gifs,
  alt = "",
  message = "Cargando…",
  sub,
}: {
  readonly gifs: string[];
  readonly alt?: string;
  readonly message?: string;
  readonly sub?: string;
}) => {
  // El gif se elige una vez al montar, con `useState` perezoso y no en un
  // efecto: en un efecto se pintaba el hueco vacío primero y el gif entraba en
  // un segundo render. Va aquí y no en el cuerpo del render para que no cambie
  // en cada repintado.
  const [src] = React.useState<string | null>(() => {
    if (gifs.length === 0) {
      return null;
    }
    const pick = gifs[Math.floor(Math.random() * gifs.length)];
    return `${pick}?r=${Math.random().toString(36).slice(2)}`;
  });

  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center gap-5 text-center">
      <div className="bg-muted ring-border/60 relative size-96 overflow-hidden rounded-2xl shadow-lg ring-1">
        {src ? (
          /*
           * `<img>` y no `next/image`: el optimizador de Next devuelve un
           * fotograma estático de un GIF animado, y aquí la animación es todo
           * el punto. La URL lleva un sufijo aleatorio para forzar que reinicie.
           */
          // eslint-disable-next-line @next/next/no-img-element, react-doctor/nextjs-no-img-element -- el optimizador congela los GIF
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover"
            aria-hidden={alt === ""}
          />
        ) : null}
      </div>
      <div className="space-y-1">
        <p className="flex items-center justify-center gap-1 text-lg font-semibold tracking-tight">
          {message}
          <span className="inline-flex gap-1" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="bg-primary size-1.5 animate-bounce rounded-full"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </span>
        </p>
        {sub ? <p className="text-muted-foreground text-sm">{sub}</p> : null}
      </div>
    </div>
  );
};
