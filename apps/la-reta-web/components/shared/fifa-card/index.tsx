import { STAT_ABBR, STAT_KEYS, type StatKey } from "@/lib/constants";
import type { Player } from "@/lib/db/schema";
import { initials } from "@/lib/format";
import { cardTier } from "@/lib/ratings";
import { cn } from "@/lib/utils";
import { isOptimizablePhoto } from "@/lib/photo";
import Image from "next/image";
import {
  DARK_HALO,
  LIGHT_HALO,
  SIZE_STYLES,
  TIER_STYLES,
} from "./card-tier-styles";

/**
 * Lo que la carta necesita de verdad.
 *
 * Las notas van opcionales porque **una solicitud de registro todavía no las
 * tiene** —las pone el admin al dar de alta— y ese caso también quiere ver su
 * carta. `Player` cumple esta forma tal cual, así que quien ya la usaba no
 * cambia nada.
 *
 * Sin `overall` la carta se pinta "pendiente": marco neutro, un guion donde va
 * el OVR y una línea en lugar de los atributos. Lo decide el dato y no un flag
 * aparte, que es lo que evita el caso imposible de "pendiente con notas".
 */
export type FifaCardPlayer = Pick<
  Player,
  "name" | "displayName" | "position" | "position2" | "photoUrl"
> &
  Partial<Pick<Player, "overall" | StatKey>>;

export const FifaCard = ({
  player,
  className,
  sizes,
  size = "lg",
  showSubname: showSubnameProp = false,
}: {
  readonly player: FifaCardPlayer;
  readonly className?: string;
  /**
   * Ancho al que se pinta la carta, en la sintaxis de `sizes` de next/image.
   * Es obligatorio a propósito: sin él el navegador se baja el original —1054×1492
   * en el roster real— para una carta de 182 px, y con veinte cartas eso son
   * cientos de MB de bitmaps decodificados. Cada sitio que usa la carta sabe su
   * ancho; ninguno puede heredarlo de otro.
   */
  readonly sizes: string;
  /**
   * sm – only overall / position / flag (no stats, no name)
   * md – stats visible, name hidden
   * lg – everything (default)
   */
  readonly size?: "sm" | "md" | "lg";
  readonly showSubname?: boolean;
}) => {
  const showStats = size !== "sm";
  const showName = size === "lg";
  const showSubname = size !== "sm" && showSubnameProp;
  const showSecondaryPosition = size !== "sm" && Boolean(player.position2);
  // Sin nota no hay nivel: ni tier ni número. Ver `FifaCardPlayer`.
  const rated = player.overall != null;
  const tier = rated ? cardTier(player.overall ?? 0) : "pending";
  const s = TIER_STYLES[tier];
  const z = SIZE_STYLES[size];
  const textShadow = tier === "gold" ? LIGHT_HALO : DARK_HALO;

  return (
    <article
      data-tier={tier}
      className={cn(
        "relative isolate flex aspect-[7/10] w-full flex-col overflow-hidden ring-1",
        z.shell,
        s.text,
        s.ring,
        s.frame,
        className
      )}
      style={{ backgroundImage: s.base }}
    >
      {player.photoUrl ? (
        <div className="absolute inset-0 z-0">
          <Image
            src={player.photoUrl}
            alt={player.name}
            fill
            sizes={sizes}
            unoptimized={!isOptimizablePhoto(player.photoUrl)}
            className="object-cover object-top"
          />
        </div>
      ) : (
        <div
          className={cn(
            "absolute inset-x-0 z-0 flex h-[52%] items-center justify-center font-black opacity-20",
            s.accentSoft,
            z.fallback
          )}
        >
          {initials(player.name)}
        </div>
      )}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{ backgroundImage: s.overlay }}
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/56 via-black/22 to-transparent",
          z.bottomFade
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-[2px] z-[2] rounded-[inherit] border border-white/8"
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 z-[2] bg-linear-to-br",
          s.stripe
        )}
      />

      <div
        className={cn(
          "relative z-10 flex items-start justify-end",
          z.top,
          textShadow
        )}
      >
        <div className="flex flex-col items-end gap-1 leading-none">
          {rated ? null : (
            <span
              className={cn(
                "font-semibold tracking-widest uppercase opacity-70",
                s.statLabel,
                z.statLabel
              )}
            >
              OVR
            </span>
          )}
          <span
            className={cn("font-black tracking-tight", s.accent, z.overall)}
          >
            {/* Un guion y no un 0: cero es una nota, y aquí no hay ninguna. */}
            {rated ? player.overall : "—"}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "relative z-10 mt-auto flex flex-col",
          z.bottom,
          textShadow
        )}
      >
        <div className="flex min-w-0 justify-between gap-2">
          <h3
            className={cn(
              "truncate font-black tracking-tight text-white",
              z.name
            )}
          >
            {showName ? player.displayName : "\u00a0"}
          </h3>
          {showSubname ? (
            <p className={cn("mt-0.5 truncate text-white/82", z.subname)}>
              {player.name}
            </p>
          ) : null}

          {showStats ? (
            <div
              className={cn(
                "inline-flex gap-2 rounded-md px-1.5 py-1 leading-none",
                s.badgeBg
              )}
            >
              <span
                className={cn("block font-semibold tracking-wide", z.position)}
              >
                {player.position}
              </span>
              {showSecondaryPosition ? (
                <span className={cn("mt-1 block opacity-70", z.position2)}>
                  {player.position2}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {showStats && !rated ? (
          <>
            <div className={cn("mt-2 h-px w-full", s.divider)} />
            <p
              className={cn(
                "pt-2 leading-snug font-semibold text-balance",
                s.statLabel,
                z.statLabel
              )}
            >
              Tus atributos los define el equipo al darte de alta
            </p>
          </>
        ) : null}

        {showStats && rated ? (
          <>
            <div className={cn("mt-2 h-px w-full", s.divider)} />
            <div className={cn("grid grid-cols-3", z.statsWrap)}>
              {STAT_KEYS.map((key) => (
                <div key={key} className="min-w-0">
                  <div
                    className={cn(
                      "leading-none font-black",
                      s.statValue,
                      z.statValue
                    )}
                  >
                    {player[key]}
                  </div>
                  <div
                    className={cn(
                      "mt-0.5 truncate leading-none font-semibold uppercase",
                      s.statLabel,
                      z.statLabel
                    )}
                  >
                    {STAT_ABBR[key]}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </article>
  );
};
