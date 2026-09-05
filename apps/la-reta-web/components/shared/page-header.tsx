import type { ReactNode } from "react";

/**
 * Cabecera estándar de vista: título, descripción opcional y acciones opcionales
 * a la derecha. Reemplaza el `div > h1 + p (+ botones)` repetido en cada page.
 *
 * En móvil el título y las acciones se apilan (`flex-col`) para que una fila de
 * 3 botones no empuje al título a una sola palabra por renglón; desde `sm` la
 * cabecera vuelve a ser de dos columnas. La descripción se limita a ~70ch: a
 * ancho completo en desktop una línea de texto larga cuesta leerla.
 */
export const PageHeader = ({
  title,
  description,
  actions,
}: {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly actions?: ReactNode;
}) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="text-muted-foreground max-w-[70ch] text-sm leading-relaxed text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
};
