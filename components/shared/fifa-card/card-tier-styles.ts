import { CardTier } from "@/lib/ratings";

export type TierStyle = {
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

export const LIGHT_HALO =
  "[text-shadow:0_1px_2px_rgba(0,0,0,0.2),0_0_8px_rgba(255,255,255,0.18)]";
export const DARK_HALO = "[text-shadow:0_1px_3px_rgba(0,0,0,0.38)]";

export const SIZE_STYLES = {
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
    name: "text-[1.2rem]",
    subname: "text-xs",
    statsWrap: "gap-x-3.5 gap-y-1.5 pt-2.5",
    statValue: "text-[14px]",
    statLabel: "text-[10px]",
    bottomFade: "h-[40%]",
  },
} as const;

export const TIER_STYLES: Record<CardTier, TierStyle> = {
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
