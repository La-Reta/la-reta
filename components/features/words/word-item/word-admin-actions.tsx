"use client";

import { deleteRetaWord, updateRetaWord } from "@/app/actions/words";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PencilIcon, TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

export function WordAdminActions({ id, word }: { id: number; word: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(word);
  const [pending, startTransition] = React.useTransition();

  function save() {
    const next = value.trim();
    if (!next) {
      toast.error("Escribe una palabra.");
      return;
    }
    startTransition(async () => {
      const res = await updateRetaWord(id, next);
      if (res.ok) {
        toast.success("Palabra actualizada");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function remove() {
    if (!confirm("¿Eliminar esta palabra?")) return;
    startTransition(async () => {
      const res = await deleteRetaWord(id);
      if (res.ok) {
        toast.success("Palabra eliminada");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <>
      <Button
        size="icon-sm"
        variant="secondary"
        aria-label="Editar palabra"
        onClick={() => {
          setValue(word);
          setOpen(true);
        }}
      >
        <PencilIcon />
      </Button>
      <Button
        size="icon-sm"
        variant="destructive"
        aria-label="Eliminar palabra"
        disabled={pending}
        onClick={remove}
      >
        <TrashIcon />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar palabra</DialogTitle>
          </DialogHeader>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={40}
            placeholder="palabra"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              }
            }}
          />
          <DialogFooter>
            <DialogClose
              render={<Button variant="secondary" disabled={pending} />}
            >
              Cancelar
            </DialogClose>
            <Button onClick={save} disabled={pending}>
              {pending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
