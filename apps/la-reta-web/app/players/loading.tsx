import { Skeleton } from "@/components/ui/skeleton";

/**
 * El esqueleto imita la vista real (cabecera + barra de filtros + rejilla con
 * las mismas columnas por breakpoint) para que al llegar los datos no salte el
 * layout. `aria-busy` evita que un lector de pantalla lea las cajas vacías.
 */
const Loading = () => {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando jugadores…"
      className="space-y-6 xl:container xl:mx-auto"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-9 w-full sm:max-w-xs" />
        <div className="flex flex-wrap gap-1 sm:justify-end">
          {["todos", "gk", "def", "mid", "fwd", "sel"].map((key) => (
            <Skeleton key={key} className="h-8 w-16" />
          ))}
        </div>
      </div>

      <Skeleton className="h-3 w-24" />

      <div className="3xl:grid-cols-7 4xl:grid-cols-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {Array.from({ length: 12 }, (_, i) => `card-${i}`).map((key) => (
          <Skeleton key={key} className="aspect-7/10 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
};

export default Loading;
