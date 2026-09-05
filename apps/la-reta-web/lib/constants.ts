/**
 * Constantes de dominio que usan el esquema, el motor de rating y la interfaz.
 *
 * Las posiciones ya no se definen aquí: viven en `@repo/reta` porque la app
 * móvil necesita exactamente la misma tabla. Se reexportan para que los
 * cientos de `import { positionGroup } from "@/lib/constants"` sigan valiendo y
 * haya un solo sitio donde añadir una posición nueva.
 */

export {
  POSITIONS,
  isPosition,
  positionGroup,
  type Position,
  type PositionGroup,
} from "@repo/reta/positions";
import { type Position, type PositionGroup } from "@repo/reta/positions";

export const FEET = ["left", "right", "both"] as const;
export type Foot = (typeof FEET)[number];

export const GROUP_LABEL: Record<PositionGroup, string> = {
  GK: "Portero",
  DEF: "Defensa",
  MID: "Mediocampo",
  FWD: "Delantero",
};

/** Marker color per line, chosen for contrast against the green pitch. */
export const GROUP_COLOR: Record<PositionGroup, string> = {
  GK: "#f59e0b", // amber
  DEF: "#0ea5e9", // sky
  MID: "#8b5cf6", // violet
  FWD: "#f43f5e", // rose
};

/**
 * Nombre de cada posición como se dice en México (no en España): "contención"
 * en vez de mediocentro defensivo, "volante ofensivo" en vez de mediapunta,
 * "delantero centro" para el nueve. Se usa en los selects de posición
 * principal/secundaria, la leyenda de la cancha y los tooltips.
 */
export const POSITION_NAME: Record<Position, string> = {
  GK: "Portero",
  RB: "Lateral derecho",
  RWB: "Carrilero derecho",
  CB: "Defensa central",
  LB: "Lateral izquierdo",
  LWB: "Carrilero izquierdo",
  CDM: "Contención",
  CM: "Volante central",
  CAM: "Volante ofensivo",
  RM: "Volante derecho",
  LM: "Volante izquierdo",
  RW: "Extremo derecho",
  LW: "Extremo izquierdo",
  CF: "Segundo delantero",
  ST: "Delantero centro",
};

/**
 * Where each position sits on a landscape pitch, as percentages.
 * x: 0 = own goal (left) … 100 = rival goal (right). y: 0 = top … 100 = bottom.
 */
export const POSITION_COORDS: Record<Position, { x: number; y: number }> = {
  GK: { x: 6, y: 50 },
  LB: { x: 22, y: 18 },
  CB: { x: 17, y: 50 },
  RB: { x: 22, y: 82 },
  LWB: { x: 31, y: 11 },
  RWB: { x: 31, y: 89 },
  CDM: { x: 36, y: 50 },
  LM: { x: 50, y: 16 },
  CM: { x: 50, y: 50 },
  RM: { x: 50, y: 84 },
  CAM: { x: 64, y: 50 },
  LW: { x: 82, y: 17 },
  RW: { x: 82, y: 83 },
  CF: { x: 77, y: 50 },
  ST: { x: 91, y: 50 },
};

// The six FIFA attributes, in display order, with their 3-letter labels.
export const STAT_KEYS = [
  "pace",
  "shooting",
  "passing",
  "dribbling",
  "defending",
  "physical",
] as const;

export type StatKey = (typeof STAT_KEYS)[number];

export const STAT_ABBR: Record<StatKey, string> = {
  pace: "PAC",
  shooting: "SHO",
  passing: "PAS",
  dribbling: "DRI",
  defending: "DEF",
  physical: "PHY",
};

export const STAT_LABEL: Record<StatKey, string> = {
  pace: "Ritmo",
  shooting: "Tiro",
  passing: "Pase",
  dribbling: "Regate",
  defending: "Defensa",
  physical: "Físico",
};

// Ideas
export const IDEA_CATEGORIES = [
  "mejora",
  "cancha",
  "social",
  "reglas",
  "otro",
] as const;
export type IdeaCategory = (typeof IDEA_CATEGORIES)[number];

export const IDEA_CATEGORY_LABEL: Record<IdeaCategory, string> = {
  mejora: "Mejora de la app",
  cancha: "Cancha / lugar",
  social: "Convivio / social",
  reglas: "Reglas del juego",
  otro: "Otro",
};

export const IDEA_STATUSES = [
  "nueva",
  "planeada",
  "en_progreso",
  "hecha",
  "descartada",
] as const;
export type IdeaStatus = (typeof IDEA_STATUSES)[number];

export const IDEA_STATUS_LABEL: Record<IdeaStatus, string> = {
  nueva: "Nueva",
  planeada: "Planeada",
  en_progreso: "En progreso",
  hecha: "Hecha",
  descartada: "Descartada",
};

// Tailwind classes per status badge (literal so they're emitted).
export const IDEA_STATUS_CLASS: Record<IdeaStatus, string> = {
  nueva: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  planeada: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  en_progreso: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  hecha: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  descartada: "bg-muted text-muted-foreground",
};

/** Color sólido del estado, para puntos y barras de acento en las listas. */
export const IDEA_STATUS_DOT: Record<IdeaStatus, string> = {
  nueva: "bg-sky-500",
  planeada: "bg-violet-500",
  en_progreso: "bg-amber-500",
  hecha: "bg-emerald-500",
  descartada: "bg-muted-foreground/40",
};

/** Estados terminales: ya no son trabajo pendiente, se muestran atenuados. */
export const IDEA_STATUS_DONE: Record<IdeaStatus, boolean> = {
  nueva: false,
  planeada: false,
  en_progreso: false,
  hecha: true,
  descartada: true,
};

export const IDEA_PRIORITIES = ["baja", "media", "alta", "critica"] as const;
export type IdeaPriority = (typeof IDEA_PRIORITIES)[number];

export const IDEA_PRIORITY_LABEL: Record<IdeaPriority, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  critica: "Crítica",
};

export const IDEA_PRIORITY_CLASS: Record<IdeaPriority, string> = {
  baja: "bg-muted text-muted-foreground",
  media: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  alta: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  critica: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
};

// Reports
export const REPORT_CATEGORIES = [
  "ayuda",
  "bug",
  "privacidad",
  "conducta",
  "datos",
  "otro",
] as const;
export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export const REPORT_CATEGORY_LABEL: Record<ReportCategory, string> = {
  ayuda: "Ayuda general",
  bug: "Error de la app",
  privacidad: "Privacidad / imagen",
  conducta: "Conducta o seguridad",
  datos: "Datos incorrectos",
  otro: "Otro",
};

export const REPORT_STATUSES = [
  "nuevo",
  "revisando",
  "resuelto",
  "descartado",
] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  nuevo: "Nuevo",
  revisando: "Revisando",
  resuelto: "Resuelto",
  descartado: "Descartado",
};

export const REPORT_STATUS_CLASS: Record<ReportStatus, string> = {
  nuevo: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  revisando: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  resuelto: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  descartado: "bg-muted text-muted-foreground",
};

// Player signups (solicitudes para registrarse como jugador)
export const SIGNUP_STATUSES = [
  "pendiente",
  "aprobado",
  "registrado",
  "rechazado",
] as const;
export type SignupStatus = (typeof SIGNUP_STATUSES)[number];

export const SIGNUP_STATUS_LABEL: Record<SignupStatus, string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  registrado: "Registrado",
  rechazado: "Rechazado",
};

export const SIGNUP_STATUS_CLASS: Record<SignupStatus, string> = {
  pendiente: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  aprobado: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  registrado: "bg-green-500/15 text-green-600 dark:text-green-400",
  rechazado: "bg-muted text-muted-foreground",
};

/** Emojis offered in the comment reaction picker. */
export const REACTION_EMOJIS = ["⚽", "🔥", "👏", "😂", "💪", "🐐"] as const;

/** Max distinct emojis per comment (each one can still be reacted infinitely). */
export const MAX_DISTINCT_REACTIONS = 15;
