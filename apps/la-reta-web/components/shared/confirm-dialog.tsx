"use client";

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
import type { ReactElement, ReactNode } from "react";

/**
 * Confirmación de acciones destructivas con el diálogo de la app.
 *
 * Sustituye al `confirm()` nativo, que se ve fuera de lugar (ignora el tema y
 * la tipografía), bloquea el hilo y solo admite una línea de texto. Aquí sí se
 * puede explicar qué se pierde antes de aceptar.
 *
 * `trigger` es el botón que abre el diálogo; se le pasa tal cual a
 * `AlertDialogTrigger`, así que conserva su variante, tamaño y aria-label.
 */
export const ConfirmDialog = ({
  trigger,
  title,
  description,
  confirmLabel = "Sí, eliminar",
  pendingLabel = "Eliminando…",
  cancelLabel = "Cancelar",
  onConfirm,
  pending = false,
}: {
  readonly trigger: ReactElement;
  readonly title: ReactNode;
  readonly description: ReactNode;
  readonly confirmLabel?: string;
  readonly pendingLabel?: string;
  readonly cancelLabel?: string;
  readonly onConfirm: () => void;
  readonly pending?: boolean;
}) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? pendingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
