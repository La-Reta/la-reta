"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { deleteMatch } from "@/app/actions/matches";
import { Button } from "@/components/ui/button";

export function DeleteMatchButton({ id }: { id: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      size="icon-sm"
      aria-label="Eliminar partido"
      disabled={pending}
      onClick={() => {
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
      }}
    >
      <Trash2Icon />
    </Button>
  );
}
