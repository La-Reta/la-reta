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

export function FloatingActionBar({
  selected,
  allFilteredSelected,
  toggleAllFiltered,
  addToTeams,
  isAdmin,
  pending,
  bulkDelete,
  clear,
}: {
  selected: Set<number>;
  allFilteredSelected: boolean;
  toggleAllFiltered: () => void;
  addToTeams: () => void;
  isAdmin: boolean;
  pending: boolean;
  bulkDelete: () => void;
  clear: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <div className="bg-card/95 ring-foreground/10 flex items-center gap-2 rounded-full border px-3 py-2 shadow-lg ring-1 backdrop-blur">
        <span className="truncate px-1 text-sm font-medium">
          {selected.size} seleccionado{selected.size === 1 ? "" : "s"}
        </span>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {selected.size >= 3 && !allFilteredSelected && (
            <Button variant="secondary" onClick={toggleAllFiltered}>
              <ListChecksIcon />
              Seleccionar todos
            </Button>
          )}
          <Button variant="secondary" onClick={addToTeams}>
            <ShieldHalfIcon />A equipos
          </Button>

          {isAdmin && (
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
          )}

          <Button variant="secondary" onClick={clear}>
            <XIcon />
            Limpiar selección
          </Button>
        </div>
      </div>
    </div>
  );
}
