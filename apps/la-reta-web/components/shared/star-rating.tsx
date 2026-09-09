import { cn } from "@/lib/utils";
import { StarIcon } from "lucide-react";

/**
 * Fila de cinco estrellas de solo lectura, con relleno fraccionario.
 *
 * Vive aquí y no dentro de `player-comments` porque la ficha la pinta desde el
 * servidor: importarla de allí arrastraba al bundle el formulario de reseñas
 * entero —con su `useComments`, su textarea y sus acciones— para enseñar cinco
 * iconos.
 */
export const StarRating = ({
  value,
  className,
}: {
  readonly value: number;
  readonly className?: string;
}) => {
  const pct = Math.max(0, Math.min(1, value / 5)) * 100;
  return (
    <span className={cn("relative inline-flex w-fit", className)}>
      <span
        aria-hidden="true"
        className="text-muted-foreground/30 flex gap-0.5"
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <StarIcon className="size-4" key={i} />
        ))}
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-0 flex gap-0.5 overflow-hidden text-amber-400"
        style={{ width: `${pct}%` }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <StarIcon className="size-4 shrink-0 fill-current" key={i} />
        ))}
      </span>
      <span className="sr-only">{value.toFixed(1)} de 5 estrellas</span>
    </span>
  );
};
