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
export function GifLoader({
  gifs,
  alt = "",
  message = "Cargando…",
  sub,
}: {
  gifs: string[];
  alt?: string;
  message?: string;
  sub?: string;
}) {
  const [src, setSrc] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (gifs.length === 0) return;
    const pick = gifs[Math.floor(Math.random() * gifs.length)];
    setSrc(`${pick}?r=${Math.random().toString(36).slice(2)}`);
  }, [gifs]);

  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center gap-5 text-center">
      <div className="bg-muted ring-border/60 relative size-96 overflow-hidden rounded-2xl shadow-lg ring-1">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
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
}
