"use client";

import { deleteMatch } from "@/app/actions/matches";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

export const DeleteMatchButton = ({ id }: { readonly id: number }) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleDeleteMatch = () => {
    startTransition(async () => {
      const res = await deleteMatch(id);
      if (res.ok) {
        toast.success("Partido eliminado");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <ConfirmDialog
      pending={pending}
      onConfirm={handleDeleteMatch}
      title="¿Eliminar este partido?"
      description="Esta acción no se puede deshacer. Se borra del historial junto con sus goles y asistencias, y la tabla de goleadores se recalcula."
      trigger={
        <Button
          variant="destructive"
          size="icon-sm"
          aria-label="Eliminar partido"
          disabled={pending}
        >
          <Trash2Icon />
        </Button>
      }
    />
  );
};
