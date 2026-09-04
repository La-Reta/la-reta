"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { TEAM_COLORS, type TeamKey } from "@/lib/teams";
import { PencilIcon, UserPlusIcon, XIcon } from "lucide-react";
import * as React from "react";

// value + label, así el trigger del Select muestra la posición completa.
const POSITION_ITEMS = POSITIONS.map((p) => ({
  value: p,
  label: `${p} · ${POSITION_NAME[p]}`,
}));

/** Valor del select cuando el invitado no va a ningún equipo todavía. */
const NO_TEAM = "none";

export type GuestInput = {
  name: string;
  overall: number;
  position: Position;
  /** Equipo al que se manda; null lo deja "por asignar". */
  team: TeamKey | null;
};

/**
 * Add last-minute ("de última hora") guest players for this generation only.
 * They're client-only (never saved to the roster) and get added to the pool.
 * Con un tablero ya generado, el formulario también asigna equipo: al editar
 * arranca en el que ya tiene, así que mover a alguien es un solo paso.
 */
export function GuestManager({
  guests,
  teams = [],
  teamOf,
  onAdd,
  onEdit,
  onRemove,
}: {
  guests: Player[];
  /** Equipos del tablero actual; vacío = todavía no se genera nada. */
  teams?: { key: TeamKey; name: string }[];
  teamOf?: (guestId: number) => TeamKey | null;
  onAdd: (input: GuestInput) => void;
  onEdit: (id: number, input: GuestInput) => void;
  onRemove: (id: number) => void;
}) {
  const [name, setName] = React.useState("");
  // String so the field can be emptied while typing; native required/min/max
  // guard the submit instead of coercing an empty value to a number.
  const [overall, setOverall] = React.useState("38");
  const [position, setPosition] = React.useState<Position>("CM");
  const [team, setTeam] = React.useState<string>(NO_TEAM);
  // When set, the form edits that guest instead of adding a new one.
  const [editingId, setEditingId] = React.useState<number | null>(null);

  const teamItems = [
    { value: NO_TEAM, label: "Sin asignar" },
    ...teams.map((t) => ({ value: t.key as string, label: t.name })),
  ];

  function reset() {
    setName("");
    setOverall("38");
    setPosition("CM");
    setTeam(NO_TEAM);
    setEditingId(null);
  }

  function startEdit(g: Player) {
    setEditingId(g.id);
    setName(g.name);
    setOverall(String(g.overall));
    setPosition(g.position as Position);
    setTeam(teamOf?.(g.id) ?? NO_TEAM);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    const input: GuestInput = {
      name: n,
      overall: Number(overall),
      position,
      team: team === NO_TEAM ? null : (team as TeamKey),
    };
    if (editingId !== null) onEdit(editingId, input);
    else onAdd(input);
    reset();
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium">Invitados de última hora</p>
          <p className="text-muted-foreground text-xs">
            Jugadores ocasionales para esta reta. No se guardan en la plantilla.
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-40 flex-1 flex-col gap-1">
            <Label htmlFor="guest-name" className="text-xs">
              Nombre
            </Label>
            <Input
              id="guest-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Carlos"
              maxLength={60}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="guest-overall" className="text-xs">
              Nivel (OVR)
            </Label>
            <Input
              id="guest-overall"
              type="number"
              required
              min={1}
              max={99}
              value={overall}
              onChange={(e) => setOverall(e.target.value)}
              className="w-20 text-center"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="guest-position" className="text-xs">
              Posición
            </Label>
            <Select
              items={POSITION_ITEMS}
              value={position}
              onValueChange={(v) => setPosition(v as Position)}
            >
              <SelectTrigger id="guest-position" className="min-w-44">
                <SelectValue />
              </SelectTrigger>
              {/* alignItemWithTrigger=false + w-auto: dropdown normal debajo del
                  trigger y ancho por contenido, para no cortar los labels largos. */}
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

          {teams.length > 0 ? (
            <div className="flex flex-col gap-1">
              <Label htmlFor="guest-team" className="text-xs">
                Equipo
              </Label>
              <Select
                items={teamItems}
                value={team}
                onValueChange={(v) => setTeam(v ?? NO_TEAM)}
              >
                <SelectTrigger id="guest-team" className="min-w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className="w-auto min-w-40"
                >
                  {teamItems.map((it) => (
                    <SelectItem key={it.value} value={it.value}>
                      <span className="flex items-center gap-2">
                        {it.value === NO_TEAM ? null : (
                          <span
                            aria-hidden="true"
                            className="size-2 rounded-full"
                            style={{
                              backgroundColor: TEAM_COLORS[it.value as TeamKey],
                            }}
                          />
                        )}
                        {it.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <Button type="submit" disabled={!name.trim()}>
            {editingId !== null ? <PencilIcon /> : <UserPlusIcon />}
            {editingId !== null ? "Guardar" : "Agregar"}
          </Button>
          {editingId !== null ? (
            <Button type="button" variant="secondary" onClick={reset}>
              Cancelar
            </Button>
          ) : null}
        </form>

        {guests.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {guests.map((g) => (
              <span
                key={g.id}
                className="bg-muted flex items-center gap-1.5 rounded-full py-1 pr-1 pl-2.5 text-xs"
              >
                <span className="font-mono font-bold tabular-nums">
                  {g.overall}
                </span>
                <span className="font-medium">{g.name}</span>
                <span className="text-muted-foreground">{g.position}</span>
                <button
                  type="button"
                  onClick={() => startEdit(g)}
                  aria-label={`Editar ${g.name}`}
                  className="hover:bg-background text-muted-foreground hover:text-foreground flex size-5 items-center justify-center rounded-full transition-colors"
                >
                  <PencilIcon className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(g.id)}
                  aria-label={`Quitar ${g.name}`}
                  className="hover:bg-background text-muted-foreground hover:text-foreground flex size-5 items-center justify-center rounded-full transition-colors"
                >
                  <XIcon className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
