"use client";

import { deleteRetaWord, updateRetaWord } from "@/app/actions/words";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
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
import { Label } from "@/components/ui/label";
import { PencilIcon, TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

export const WordAdminActions = ({
  id,
  word,
  author,
}: {
  readonly id: number;
  readonly word: string;
  readonly author: string | null;
}) => {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(word);
  const [authorValue, setAuthorValue] = React.useState(author ?? "");
  const [pending, startTransition] = React.useTransition();
  const wordId = React.useId();
  const authorId = React.useId();

  function save() {
    const next = value.trim();
    if (!next) {
      toast.error("Escribe una palabra.");
      return;
    }
    startTransition(async () => {
      const res = await updateRetaWord(id, next, authorValue);
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
        size="icon"
        variant="secondary"
        aria-label="Editar palabra"
        onClick={() => {
          setValue(word);
          setAuthorValue(author ?? "");
          setOpen(true);
        }}
      >
        <PencilIcon />
      </Button>
      <ConfirmDialog
        pending={pending}
        onConfirm={remove}
        title="¿Eliminar esta palabra?"
        description={`“${word}” dejará de rotar en el banner del inicio.`}
        trigger={
          <Button
            size="icon"
            variant="destructive"
            aria-label="Eliminar palabra"
            disabled={pending}
          >
            <TrashIcon />
          </Button>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar palabra</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor={wordId} className="text-xs">
              Palabra
            </Label>
            <Input
              value={value}
              id={wordId}
              onChange={(e) => setValue(e.target.value)}
              maxLength={40}
              placeholder="palabra"
              autoFocus
              onKeyDown={(e) => {
                // Con IME (japonés, chino…) Enter confirma el candidato: sin
                // este guard se guardaría a media composición.
                if (e.nativeEvent.isComposing) return;
                if (e.key === "Enter") {
                  e.preventDefault();
                  save();
                }
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={authorId} className="text-xs">
              Nombre (opcional)
            </Label>
            <Input
              value={authorValue}
              id={authorId}
              onChange={(e) => setAuthorValue(e.target.value)}
              maxLength={60}
              placeholder="Anónimo"
              onKeyDown={(e) => {
                // Con IME (japonés, chino…) Enter confirma el candidato: sin
                // este guard se guardaría a media composición.
                if (e.nativeEvent.isComposing) return;
                if (e.key === "Enter") {
                  e.preventDefault();
                  save();
                }
              }}
            />
          </div>
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
};
