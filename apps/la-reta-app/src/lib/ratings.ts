/**
 * Nivel de la carta según el overall.
 *
 * Los umbrales son los de la web (apps/la-reta-web/lib/ratings.ts), calibrados
 * para una reta amateur: si se usaran los de FIFA, aquí sería todo bronce y la
 * carta dejaría de decir nada.
 */

export type CardTier = "special" | "gold" | "silver" | "bronze";

export function cardTier(overall: number): CardTier {
  if (overall >= 57) return "special";
  if (overall >= 40) return "gold";
  if (overall >= 26) return "silver";
  return "bronze";
}

export const TIER_LABEL: Record<CardTier, string> = {
  special: "Especial",
  gold: "Oro",
  silver: "Plata",
  bronze: "Bronce",
};

export interface TierStyle {
  /** Degradado del fondo, de arriba a abajo. */
  gradient: [string, string, string];
  /** Tinta principal sobre la carta. */
  ink: string;
  /** Color del overall y de los remates. */
  accent: string;
  /** Etiquetas de atributo, un punto por debajo de la tinta. */
  muted: string;
  /** Filete interior que le da el canto metálico. */
  edge: string;
}

export const TIER_STYLES: Record<CardTier, TierStyle> = {
  special: {
    gradient: ["#173382", "#10245A", "#0B1434"],
    ink: "#F9FBFF",
    accent: "#FFE58F",
    muted: "#C8D6F5",
    edge: "rgba(255, 234, 163, 0.72)",
  },
  gold: {
    gradient: ["#F5C70F", "#E0A60F", "#B16F0B"],
    ink: "#FFFDF7",
    accent: "#FFF7DB",
    muted: "#FFF0C4",
    edge: "rgba(255, 245, 208, 0.58)",
  },
  silver: {
    gradient: ["#768499", "#5F6C80", "#3D4656"],
    ink: "#FFFFFF",
    accent: "#FFFFFF",
    muted: "#E1E9F5",
    edge: "rgba(255, 255, 255, 0.34)",
  },
  bronze: {
    gradient: ["#B46C4D", "#9D573A", "#73402B"],
    ink: "#FFFAF6",
    accent: "#FFF2E8",
    muted: "#F6DCCC",
    edge: "rgba(255, 232, 220, 0.34)",
  },
};
