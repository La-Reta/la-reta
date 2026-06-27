import { cn } from "@/lib/utils";
import { flagEmoji, initials } from "@/lib/format";
import { cardTier, type CardTier } from "@/lib/ratings";
import { STAT_ABBR, STAT_KEYS } from "@/lib/constants";
import type { Player } from "@/lib/db/schema";

type TierStyle = {
  text: string;
  base: string;
  overlay: string;
  accent: string;
  accentSoft: string;
  divider: string;
  ring: string;
  frame: string;
  stripe: string;
  statValue: string;
  statLabel: string;
  badgeBg: string;
};

const LIGHT_HALO =
  "[text-shadow:0_1px_2px_rgba(0,0,0,0.2),0_0_8px_rgba(255,255,255,0.18)]";
const DARK_HALO = "[text-shadow:0_1px_3px_rgba(0,0,0,0.38)]";

const SIZE_STYLES = {
  sm: {
    shell: "rounded-[1.45rem]",
    top: "px-3 pt-3",
    bottom: "px-3 pb-3",
    overall: "text-[2rem]",
    position: "text-[11px]",
    position2: "text-[9px]",
    flag: "text-lg",
    fallback: "top-7 text-6xl",
    name: "text-[1.25rem]",
    subname: "text-[10px]",
    statsWrap: "gap-x-2 gap-y-1 pt-1.5",
    statValue: "text-[12px]",
    statLabel: "text-[8px]",
    bottomFade: "h-[36%]",
  },
  md: {
    shell: "rounded-[1.55rem]",
    top: "px-4 pt-4",
    bottom: "px-4 pb-4",
    overall: "text-[2.25rem]",
    position: "text-xs",
    position2: "text-[10px]",
    flag: "text-xl",
    fallback: "top-8 text-7xl",
    name: "text-[1.45rem]",
    subname: "text-[11px]",
    statsWrap: "gap-x-3 gap-y-1.5 pt-2",
    statValue: "text-[13px]",
    statLabel: "text-[9px]",
    bottomFade: "h-[38%]",
  },
  lg: {
    shell: "rounded-[1.65rem]",
    top: "px-4 pt-4",
    bottom: "px-4 pb-4",
    overall: "text-[2.55rem]",
    position: "text-sm",
    position2: "text-[10px]",
    flag: "text-xl",
    fallback: "top-8 text-7xl",
    name: "text-[1.65rem]",
    subname: "text-xs",
    statsWrap: "gap-x-3.5 gap-y-1.5 pt-2.5",
    statValue: "text-[14px]",
    statLabel: "text-[10px]",
    bottomFade: "h-[40%]",
  },
} as const;

const TIER_STYLES: Record<CardTier, TierStyle> = {
  special: {
    text: "text-[#f9fbff]",
    base: "linear-gradient(180deg, #173382 0%, #10245a 52%, #0b1434 100%)",
    overlay:
      "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 28%), repeating-linear-gradient(145deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 14px), linear-gradient(180deg, rgba(6,12,32,0.02) 0%, rgba(6,12,32,0.18) 100%)",
    accent: "text-[#ffe58f]",
    accentSoft: "text-[#f4f8ff]",
    divider: "bg-white/18",
    ring: "ring-[#e3c56d]/26",
    frame:
      "shadow-[inset_0_0_0_1px_rgba(255,234,163,0.75),0_18px_32px_-24px_rgba(7,16,42,0.75)]",
    stripe: "from-[#2f57cf]/0 via-[#56a9ff]/10 to-[#2f57cf]/0",
    statValue: "text-[#fff6c7]",
    statLabel: "text-[#dce8ff]",
    badgeBg: "bg-white/10",
  },
  gold: {
    text: "text-[#fffdf7]",
    base: "linear-gradient(180deg, #f5c70f 0%, #e0a60f 56%, #b16f0b 100%)",
    overlay:
      "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 28%), repeating-linear-gradient(145deg, rgba(255,255,255,0.045) 0 2px, transparent 2px 14px), linear-gradient(180deg, rgba(70,40,0,0.02) 0%, rgba(70,40,0,0.14) 100%)",
    accent: "text-[#fff7db]",
    accentSoft: "text-[#fff9ea]",
    divider: "bg-white/18",
    ring: "ring-white/12",
    frame:
      "shadow-[inset_0_0_0_1px_rgba(255,245,208,0.58),0_18px_32px_-24px_rgba(109,66,5,0.35)]",
    stripe: "from-[#fff1be]/0 via-white/8 to-[#fff1be]/0",
    statValue: "text-[#fffdf6]",
    statLabel: "text-[#fff3cf]",
    badgeBg: "bg-white/10",
  },
  silver: {
    text: "text-[#ffffff]",
    base: "linear-gradient(180deg, #768499 0%, #5f6c80 52%, #3d4656 100%)",
    overlay:
      "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 28%), repeating-linear-gradient(145deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 14px), linear-gradient(180deg, rgba(12,18,28,0.02) 0%, rgba(12,18,28,0.18) 100%)",
    accent: "text-[#ffffff]",
    accentSoft: "text-[#f5f8fc]",
    divider: "bg-white/16",
    ring: "ring-white/10",
    frame:
      "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.32),0_18px_32px_-24px_rgba(34,41,52,0.42)]",
    stripe: "from-white/0 via-white/8 to-white/0",
    statValue: "text-white",
    statLabel: "text-[#e6edf7]",
    badgeBg: "bg-white/9",
  },
  bronze: {
    text: "text-[#fffaf6]",
    base: "linear-gradient(180deg, #b46c4d 0%, #9d573a 52%, #73402b 100%)",
    overlay:
      "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 28%), repeating-linear-gradient(145deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 14px), linear-gradient(180deg, rgba(35,18,10,0.02) 0%, rgba(35,18,10,0.18) 100%)",
    accent: "text-[#fff2e8]",
    accentSoft: "text-[#fff8f4]",
    divider: "bg-white/16",
    ring: "ring-white/10",
    frame:
      "shadow-[inset_0_0_0_1px_rgba(255,232,220,0.32),0_18px_32px_-24px_rgba(65,31,16,0.42)]",
    stripe: "from-white/0 via-white/7 to-white/0",
    statValue: "text-[#fffdfb]",
    statLabel: "text-[#ffede2]",
    badgeBg: "bg-white/8",
  },
};

export function FifaCard({
  player,
  className,
  size = "lg",
  showSubname: showSubnameProp = false,
}: {
  player: Player;
  className?: string;
  /**
   * sm – only overall / position / flag (no stats, no name)
   * md – stats visible, name hidden
   * lg – everything (default)
   */
  size?: "sm" | "md" | "lg";
  showSubname?: boolean;
}) {
  const showStats = size !== "sm";
  const showName = size === "lg";
  const showSubname = size !== "sm" && showSubnameProp;
  const showSecondaryPosition = size !== "sm" && Boolean(player.position2);
  const tier = cardTier(player.overall);
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
        className,
      )}
      style={{ backgroundImage: s.base }}
    >
      {player.photoUrl ?
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={player.photoUrl}
            alt={player.name}
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
        </div>
      : <div
          className={cn(
            "absolute inset-x-0 z-0 flex h-[52%] items-center justify-center font-black opacity-20",
            s.accentSoft,
            z.fallback,
          )}
        >
          {initials(player.name)}
        </div>
      }

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{ backgroundImage: s.overlay }}
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/56 via-black/22 to-transparent",
          z.bottomFade,
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-[2px] z-[2] rounded-[inherit] border border-white/8",
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 z-[2] bg-linear-to-br",
          s.stripe,
        )}
      />

      <div
        className={cn(
          "relative z-10 flex items-start justify-between",
          z.top,
          textShadow,
        )}
      >
        <div className={cn("rounded-md px-1.5 py-1 leading-none", s.badgeBg)}>
          <span className={cn("block font-semibold tracking-wide", z.position)}>
            {player.position}
          </span>
          {showSecondaryPosition ?
            <span className={cn("mt-1 block opacity-70", z.position2)}>
              {player.position2}
            </span>
          : null}
        </div>

        <div className="flex flex-col items-end gap-1 leading-none">
          <span
            className={cn("font-black tracking-tight", s.accent, z.overall)}
          >
            {player.overall}
          </span>
          <span className={cn("opacity-90", z.flag)}>
            {flagEmoji(player.nationality)}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "relative z-10 mt-auto flex flex-col",
          z.bottom,
          textShadow,
        )}
      >
        <div className="min-w-0">
          <h3
            className={cn(
              "truncate font-black tracking-tight text-white",
              z.name,
            )}
          >
            {showName ? player.displayName : "\u00a0"}
          </h3>
          {showSubname ?
            <p className={cn("mt-0.5 truncate text-white/82", z.subname)}>
              {player.name}
            </p>
          : null}
        </div>

        {showStats ?
          <>
            <div className={cn("mt-2 h-px w-full", s.divider)} />
            <div className={cn("grid grid-cols-3", z.statsWrap)}>
              {STAT_KEYS.map((key) => (
                <div key={key} className="min-w-0">
                  <div
                    className={cn(
                      "font-black leading-none",
                      s.statValue,
                      z.statValue,
                    )}
                  >
                    {player[key]}
                  </div>
                  <div
                    className={cn(
                      "mt-0.5 truncate font-semibold leading-none uppercase",
                      s.statLabel,
                      z.statLabel,
                    )}
                  >
                    {STAT_ABBR[key]}
                  </div>
                </div>
              ))}
            </div>
          </>
        : null}
      </div>
    </article>
  );
}
