"use client";

import { deleteMatch } from "@/app/actions/matches";
import { Button } from "@/components/ui/button";
import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

export function DeleteMatchButton({ id }: { id: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleDeleteMatch = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();

    if (!confirm("¿Eliminar este partido del registro?")) return;
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
    <Button
      variant="destructive"
      size="icon"
      aria-label="Eliminar partido"
      disabled={pending}
      onClick={handleDeleteMatch}
    >
      <Trash2Icon />
    </Button>
  );
}
