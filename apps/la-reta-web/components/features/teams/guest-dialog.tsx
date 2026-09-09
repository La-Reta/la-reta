"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { POSITION_NAME, POSITIONS, type Position } from "@/lib/constants";
import type { Player } from "@/lib/db/schema";
import * as React from "react";

const POSITION_ITEMS = POSITIONS.map((p) => ({
  value: p,
  label: `${p} · ${POSITION_NAME[p]}`,
}));

const DEFAULT_OVERALL = "38";
const DEFAULT_POSITION: Position = "CM";

export type GuestInput = {
  name: string;
  overall: number;
  position: Position;
};

/**
 * Alta y edición de un invitado, en diálogo.
 *
 * Era un formulario de cuatro campos siempre desplegado en su propia tarjeta,
 * entre la convocatoria y el resultado. La mayoría de las retas no llevan
 * invitados, así que ese hueco separaba lo que sí se usa —elegir gente y ver
 * los equipos— sin dar nada a cambio. El campo de equipo se fue con él: mover a
 * alguien de equipo se hace en el tablero, que es donde se está mirando.
 *
 * El diálogo lo controla quien lo usa (`open`/`onOpenChange`) porque el lápiz
 * de cada invitado vive fuera, en la lista. Y el formulario va **con `key`**:
 * así sus `useState` arrancan del invitado que toca sin ningún efecto que
 * sincronice props con estado — que es lo que hacía ver un fotograma con los
 * datos del invitado anterior.
 */
export const GuestDialog = ({
  open,
  onOpenChange,
  editing,
  onSubmit,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** Invitado que se está editando, o `null` para dar de alta uno nuevo. */
  readonly editing: Player | null;
  readonly onSubmit: (input: GuestInput) => void;
}) => {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar invitado" : "Invitado de última hora"}
          </DialogTitle>
          <DialogDescription>
            Juega esta reta pero no se guarda en la plantilla.
          </DialogDescription>
        </DialogHeader>
        <GuestForm
          editing={editing}
          key={editing?.id ?? "new"}
          onSubmit={(input) => {
            onSubmit(input);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

const GuestForm = ({
  editing,
  onSubmit,
}: {
  readonly editing: Player | null;
  readonly onSubmit: (input: GuestInput) => void;
}) => {
  const [name, setName] = React.useState(editing?.name ?? "");
  // Cadena y no número: el campo tiene que poder quedarse vacío mientras se
  // teclea, y del envío se encargan `required`/`min`/`max`.
  const [overall, setOverall] = React.useState(
    editing ? String(editing.overall) : DEFAULT_OVERALL
  );
  const [position, setPosition] = React.useState<Position>(
    (editing?.position as Position | undefined) ?? DEFAULT_POSITION
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed === "") return;
    onSubmit({ name: trimmed, overall: Number(overall), position });
  }

  return (
    <>
      <form className="space-y-4" id="guest-form" onSubmit={submit}>
        <div className="space-y-1.5">
          <Label htmlFor="guest-name">Nombre</Label>
          <Input
            autoFocus
            id="guest-name"
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Carlos"
            value={name}
          />
        </div>

        <div className="grid grid-cols-[6rem_1fr] gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="guest-overall">Nivel</Label>
            <Input
              className="text-center"
              id="guest-overall"
              max={99}
              min={1}
              onChange={(e) => setOverall(e.target.value)}
              required
              type="number"
              value={overall}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="guest-position">Posición</Label>
            <Select
              items={POSITION_ITEMS}
              onValueChange={(v) => setPosition(v as Position)}
              value={position}
            >
              <SelectTrigger className="w-full" id="guest-position">
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                alignItemWithTrigger={false}
                className="w-auto min-w-52"
              >
                {POSITION_ITEMS.map((it) => (
                  <SelectItem key={it.value} value={it.value}>
                    {it.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </form>

      <DialogFooter>
        <DialogClose render={<Button variant="outline">Cancelar</Button>} />
        <Button disabled={name.trim() === ""} form="guest-form" type="submit">
          {editing ? "Guardar" : "Agregar"}
        </Button>
      </DialogFooter>
    </>
  );
};
