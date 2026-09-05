import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Colores de la barra de acento por tono semántico. */
const TONE_BAR = {
  primary: "bg-primary",
  emerald: "bg-emerald-500",
  muted: "bg-muted-foreground",
} as const;

/**
 * Encabezado de sección con barra de acento: título en mayúsculas, conteo
 * opcional y un tono de barra (primary por defecto). Reemplaza los `h2`
 * repetidos con `span` de acento en varias vistas.
 */
export const SectionHeading = ({
  title,
  count,
  tone = "primary",
}: {
  readonly title: ReactNode;
  readonly count?: number;
  readonly tone?: keyof typeof TONE_BAR;
}) => {
  return (
    <h2 className="text-muted-foreground flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
      <span
        aria-hidden="true"
        className={cn("h-4 w-1 shrink-0 rounded-full", TONE_BAR[tone])}
      />
      <span className="min-w-0 truncate">{title}</span>
      {count !== undefined ? (
        <span className="text-muted-foreground/70 font-normal normal-case tabular-nums">
          · {count}
        </span>
      ) : null}
    </h2>
  );
};
