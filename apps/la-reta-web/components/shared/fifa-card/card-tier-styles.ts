import type { CardTier } from "@/lib/ratings";

export interface TierStyle {
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
}

/**
 * Tokens que comparten varios tamaños o varios tiers. Extraídos porque el lint
 * corta a la tercera repetición, y porque un radio o un divisor que difiera
 * entre tiers por descuido se ve como un fallo de la carta, no como un matiz.
 */
const SHELL_RADIUS = "rounded-xl";
const SUBLABEL_SIZE = "text-[10px]";
const DIVIDER_SOFT = "bg-white/16";
const RING_SOFT = "ring-white/10";

export const LIGHT_HALO =
  "[text-shadow:0_1px_2px_rgba(0,0,0,0.2),0_0_8px_rgba(255,255,255,0.18)]";
export const DARK_HALO = "[text-shadow:0_1px_3px_rgba(0,0,0,0.38)]";

export const SIZE_STYLES = {
  sm: {
    shell: SHELL_RADIUS,
    top: "px-3 pt-3",
    bottom: "px-3 pb-3",
    overall: "text-[2rem]",
    position: "text-[11px]",
    position2: "text-[9px]",
    flag: "text-lg",
    fallback: "top-7 text-6xl",
    name: "text-[1.25rem]",
    subname: SUBLABEL_SIZE,
    statsWrap: "gap-x-2 gap-y-1 pt-1.5",
    statValue: "text-[12px]",
    statLabel: "text-[8px]",
    bottomFade: "h-[36%]",
  },
  md: {
    shell: SHELL_RADIUS,
    top: "px-4 pt-4",
    bottom: "px-4 pb-4",
    overall: "text-[2.25rem]",
    position: "text-xs",
    position2: SUBLABEL_SIZE,
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
    shell: SHELL_RADIUS,
    top: "px-4 pt-4",
    bottom: "px-4 pb-4",
    overall: "text-[2.55rem]",
    position: "text-sm",
    position2: SUBLABEL_SIZE,
    flag: "text-xl",
    fallback: "top-8 text-7xl",
    name: "text-[1.2rem]",
    subname: "text-xs",
    statsWrap: "gap-x-3.5 gap-y-1.5 pt-2.5",
    statValue: "text-[14px]",
    statLabel: SUBLABEL_SIZE,
    bottomFade: "h-[40%]",
  },
} as const;

/**
 * `"pending"` no entra en `CardTier` (`lib/ratings.ts`) a propósito: allí un
 * tier es el resultado de una valoración, y esto es la ausencia de una. Vive
 * solo aquí, que es donde se pinta.
 */
export type CardTierStyleKey = CardTier | "pending";

export const TIER_STYLES: Record<CardTierStyleKey, TierStyle> = {
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
    divider: DIVIDER_SOFT,
    ring: RING_SOFT,
    frame:
      "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.32),0_18px_32px_-24px_rgba(34,41,52,0.42)]",
    stripe: "from-white/0 via-white/8 to-white/0",
    statValue: "text-white",
    statLabel: "text-[#e6edf7]",
    badgeBg: "bg-white/9",
  },
  /**
   * Una solicitud todavía no tiene nivel: los atributos los pone el admin al dar
   * de alta. Bronce/plata/oro **son** niveles, así que ninguno vale aquí —
   * bronce insinuaría la valoración más baja y nadie ha valorado nada.
   *
   * Pizarra neutra, con la misma gramática que los demás (base, overlay de
   * trama, franja) para que sea la misma carta y no otra cosa.
   */
  pending: {
    text: "text-slate-50",
    base: "linear-gradient(180deg, #5b6472 0%, #464e5a 52%, #2f353e 100%)",
    overlay:
      "linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0) 28%), repeating-linear-gradient(145deg, rgba(255,255,255,0.035) 0 2px, transparent 2px 14px), linear-gradient(180deg, rgba(12,16,22,0.02) 0%, rgba(12,16,22,0.2) 100%)",
    accent: "text-slate-200",
    accentSoft: "text-slate-100",
    divider: DIVIDER_SOFT,
    ring: RING_SOFT,
    frame:
      "shadow-[inset_0_0_0_1px_rgba(226,232,240,0.26),0_18px_32px_-24px_rgba(15,23,42,0.5)]",
    stripe: "from-white/0 via-white/6 to-white/0",
    statValue: "text-slate-50",
    statLabel: "text-slate-200",
    badgeBg: "bg-white/8",
  },
  bronze: {
    text: "text-[#fffaf6]",
    base: "linear-gradient(180deg, #b46c4d 0%, #9d573a 52%, #73402b 100%)",
    overlay:
      "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 28%), repeating-linear-gradient(145deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 14px), linear-gradient(180deg, rgba(35,18,10,0.02) 0%, rgba(35,18,10,0.18) 100%)",
    accent: "text-[#fff2e8]",
    accentSoft: "text-[#fff8f4]",
    divider: DIVIDER_SOFT,
    ring: RING_SOFT,
    frame:
      "shadow-[inset_0_0_0_1px_rgba(255,232,220,0.32),0_18px_32px_-24px_rgba(65,31,16,0.42)]",
    stripe: "from-white/0 via-white/7 to-white/0",
    statValue: "text-[#fffdfb]",
    statLabel: "text-[#ffede2]",
    badgeBg: "bg-white/8",
  },
};
