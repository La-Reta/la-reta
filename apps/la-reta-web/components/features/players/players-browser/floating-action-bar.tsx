import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  ListChecksIcon,
  ShieldHalfIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";

export const FloatingActionBar = ({
  selected,
  allFilteredSelected,
  toggleAllFiltered,
  addToTeams,
  isAdmin,
  pending,
  bulkDelete,
  clear,
}: {
  readonly selected: Set<number>;
  readonly allFilteredSelected: boolean;
  readonly toggleAllFiltered: () => void;
  readonly addToTeams: () => void;
  readonly isAdmin: boolean;
  readonly pending: boolean;
  readonly bulkDelete: () => void;
  readonly clear: () => void;
}) => {
  return (
    // pb con safe-area: en iPhone la barra quedaba debajo del indicador de
    // inicio. En móvil el contenido se envuelve en vez de desbordar a lo ancho.
    <section
      aria-label="Acciones sobre la selección"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="bg-card/95 ring-foreground/10 motion-safe:animate-in motion-safe:slide-in-from-bottom-2 motion-safe:fade-in pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-2 rounded-3xl border px-3 py-2 shadow-lg ring-1 backdrop-blur sm:rounded-full">
        <span className="truncate px-1 text-sm font-medium tabular-nums">
          {selected.size} seleccionado{selected.size === 1 ? "" : "s"}
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
          {selected.size >= 3 && !allFilteredSelected && (
            <Button variant="secondary" onClick={toggleAllFiltered}>
              <ListChecksIcon />
              Seleccionar todos
            </Button>
          )}
          <Button variant="secondary" onClick={addToTeams}>
            <ShieldHalfIcon />A equipos
          </Button>

          {isAdmin ? (
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="destructive" disabled={pending}>
                    <Trash2Icon />
                    Eliminar
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    ¿Eliminar {selected.size} jugador
                    {selected.size === 1 ? "" : "es"}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se quitarán de la base de
                    datos, de los equipos y del registro de goles.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={pending}>
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={bulkDelete}
                    disabled={pending}
                  >
                    {pending ? "Eliminando…" : "Sí, eliminar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}

          <Button variant="secondary" onClick={clear}>
            <XIcon />
            Limpiar selección
          </Button>
        </div>
      </div>
    </section>
  );
};
