"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { MoreVerticalIcon, CheckCircle2Icon, Trash2Icon } from "lucide-react";
import { setIdeaStatus, deleteIdea } from "@/app/actions/ideas";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function IdeaRowActions({ id, status }: { id: number; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(ok);
        router.refresh();
      } else {
        toast.error(res.error ?? "Algo salió mal");
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Acciones"
            disabled={pending}
          >
            <MoreVerticalIcon />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className={"w-fit"}>
        <DropdownMenuItem
          disabled={status === "hecha"}
          onClick={() =>
            run(
              () => setIdeaStatus(id, "hecha"),
              "Idea marcada como completada",
            )
          }
        >
          <CheckCircle2Icon />
          Marcar como completada
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => run(() => deleteIdea(id), "Idea eliminada")}
        >
          <Trash2Icon />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
