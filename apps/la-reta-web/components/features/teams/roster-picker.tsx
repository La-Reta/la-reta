"use client";

import { GuestDialog } from "@/components/features/teams/guest-dialog";
import type { GuestInput } from "@/components/features/teams/guest-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  GROUP_COLOR,
  GROUP_LABEL,
  positionGroup,
  type PositionGroup,
} from "@/lib/constants";
import type { Player } from "@/lib/db/schema";
import { playerPositions } from "@/lib/format";
import { isGuest } from "@/lib/guests";
import { cn } from "@/lib/utils";
import {
  CheckIcon,
  ChevronDownIcon,
  PencilIcon,
  SearchIcon,
  UserPlusIcon,
  XIcon,
} from "lucide-react";
import * as React from "react";

const GROUPS: PositionGroup[] = ["GK", "DEF", "MID", "FWD"];

/**
 * Normaliza para buscar: sin acentos y en minúsculas.
 *
 * Nadie teclea "Álvarez" con tilde, y sin esto el buscador parece roto — es la
 * misma razón por la que `searchKey()` existe en el marcador en vivo.
 */
const searchKey = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/**
 * A quién convocas.
 *
 * Es el paso que más tiempo consume, así que va primero y con las tres cosas
 * que faltaban: un buscador (con veinte nombres, encontrar a alguien a ojo
 * cuesta), atajos por línea (convocar a los cuatro defensas es un toque, no
 * cuatro) y los invitados dentro, no en una tarjeta aparte con un formulario
 * siempre desplegado.
 */
export const RosterPicker = ({
  players,
  selected,
  guests,
  open,
  onOpenChange,
  onToggle,
  onToggleMany,
  onClear,
  onAddGuest,
  onEditGuest,
  onRemoveGuest,
}: {
  readonly players: Player[];
  readonly selected: number[];
  readonly guests: Player[];
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onToggle: (id: number) => void;
  /** Convoca (o retira) una línea entera de una vez. */
  readonly onToggleMany: (ids: number[], next: boolean) => void;
  readonly onClear: () => void;
  readonly onAddGuest: (input: GuestInput) => void;
  readonly onEditGuest: (id: number, input: GuestInput) => void;
  readonly onRemoveGuest: (id: number) => void;
}) => {
  const [query, setQuery] = React.useState("");
  // El diálogo de invitado lo controla esta lista porque su disparador (el
  // botón de arriba) y el lápiz de cada chip están en sitios distintos.
  const [guestOpen, setGuestOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Player | null>(null);
  // El React Compiler no está activado en `next.config.ts`, así que sin el
  // `useMemo` este Set se reconstruye en cada tecla del buscador.
  // eslint-disable-next-line react-doctor/react-compiler-no-manual-memoization -- ver arriba
  const selectedSet = React.useMemo(() => new Set(selected), [selected]);

  const needle = searchKey(query.trim());
  // `String.includes`, no `Array.includes`: es una subcadena dentro del nombre
  // ya normalizado, no una búsqueda dentro de una lista.
  const visible = needle
    ? players.filter((p) =>
        // eslint-disable-next-line react-doctor/js-set-map-lookups -- ver arriba
        searchKey(`${p.name} ${p.displayName}`).includes(needle)
      )
    : players;

  const sections = GROUPS.map((group) => ({
    group,
    items: visible.filter((p) => positionGroup(p.position) === group),
  })).filter((s) => s.items.length > 0);

  return (
    <Collapsible onOpenChange={onOpenChange} open={open} render={<Card />}>
      <CardHeader className="border-b">
        <CardTitle className="flex flex-wrap items-center justify-between gap-2">
          <CollapsibleTrigger
            className="hover:text-foreground -m-1 flex items-center gap-2 rounded-lg p-1 text-left transition-colors"
            nativeButton
          >
            <span>Convocatoria</span>
            <Badge variant="secondary">{selected.length}</Badge>
            <ChevronDownIcon
              className={cn(
                "text-muted-foreground size-4 transition-transform",
                open && "rotate-180"
              )}
            />
          </CollapsibleTrigger>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setEditing(null);
                setGuestOpen(true);
              }}
              size="sm"
              variant="outline"
            >
              <UserPlusIcon />
              <span className="hidden sm:inline">Invitado</span>
            </Button>
            {selected.length > 0 ? (
              <Button onClick={onClear} size="sm" variant="ghost">
                <XIcon />
                <span className="hidden sm:inline">Limpiar</span>
              </Button>
            ) : null}
          </div>
        </CardTitle>
      </CardHeader>

      <CollapsibleContent>
        <CardContent className="space-y-4 pt-4">
          <div className="relative">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              className="pl-9"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar jugador…"
              value={query}
            />
          </div>

          {guests.length > 0 ? (
            <GuestChips
              guests={guests}
              onEdit={(guest) => {
                setEditing(guest);
                setGuestOpen(true);
              }}
              onRemove={onRemoveGuest}
              selectedSet={selectedSet}
              onToggle={onToggle}
            />
          ) : null}

          {sections.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              Nadie coincide con “{query}”.
            </p>
          ) : null}

          {sections.map(({ group, items }) => {
            const ids = items.map((p) => p.id);
            const picked = ids.filter((id) => selectedSet.has(id)).length;
            const allPicked = picked === ids.length;
            return (
              <section className="space-y-2" key={group}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold uppercase">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: GROUP_COLOR[group] }}
                    />
                    {GROUP_LABEL[group]}
                    <span className="text-muted-foreground/60 font-mono tabular-nums">
                      {picked}/{ids.length}
                    </span>
                  </p>
                  {/* Convocar una línea entera de un toque: con cuatro defensas
                      eran cuatro toques y es lo que más se repite. */}
                  <Button
                    onClick={() => onToggleMany(ids, !allPicked)}
                    size="xs"
                    variant="ghost"
                  >
                    {allPicked ? "Quitar" : "Todos"}
                  </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((player) => (
                    <PlayerToggle
                      key={player.id}
                      onToggle={onToggle}
                      player={player}
                      selected={selectedSet.has(player.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </CardContent>
      </CollapsibleContent>

      <GuestDialog
        editing={editing}
        onOpenChange={setGuestOpen}
        onSubmit={(input) => {
          if (editing) onEditGuest(editing.id, input);
          else onAddGuest(input);
        }}
        open={guestOpen}
      />
    </Collapsible>
  );
};

/**
 * Una ficha convocable.
 *
 * El estado se lee por el color y la marca, no solo por el borde: en la cancha,
 * con el sol de frente, un borde de 1 px no se ve.
 */
const PlayerToggle = ({
  player,
  selected,
  onToggle,
}: {
  readonly player: Player;
  readonly selected: boolean;
  readonly onToggle: (id: number) => void;
}) => {
  return (
    <button
      aria-pressed={selected}
      className={cn(
        "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm",
        "transition-[background-color,border-color,scale] motion-safe:active:scale-[0.98]",
        selected
          ? "border-primary bg-primary/10"
          : "border-border hover:bg-muted"
      )}
      key={player.id}
      onClick={() => onToggle(player.id)}
      type="button"
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/40"
        )}
      >
        {selected ? <CheckIcon className="size-3.5" /> : null}
      </span>
      <span className="w-8 shrink-0 font-mono text-sm font-bold tabular-nums">
        {player.overall}
      </span>
      <span className="min-w-0 flex-1 truncate font-medium">{player.name}</span>
      <Badge className="shrink-0" variant="outline">
        {playerPositions(player).join("/")}
      </Badge>
    </button>
  );
};

const GuestChips = ({
  guests,
  selectedSet,
  onToggle,
  onEdit,
  onRemove,
}: {
  readonly guests: Player[];
  readonly selectedSet: Set<number>;
  readonly onToggle: (id: number) => void;
  readonly onEdit: (guest: Player) => void;
  readonly onRemove: (id: number) => void;
}) => {
  return (
    <section className="space-y-2">
      <p className="text-muted-foreground text-xs font-semibold uppercase">
        Invitados
        <span className="text-muted-foreground/60 ml-1.5 font-mono tabular-nums">
          {guests.length}
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        {guests.map((guest) => {
          const selected = selectedSet.has(guest.id);
          return (
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full border py-1 pr-1 pl-2.5 text-xs transition-colors",
                selected ? "border-primary bg-primary/10" : "border-border"
              )}
              key={guest.id}
            >
              <button
                className="flex items-center gap-1.5"
                onClick={() => onToggle(guest.id)}
                type="button"
              >
                <span className="font-mono font-bold tabular-nums">
                  {guest.overall}
                </span>
                <span className="font-medium">{guest.name}</span>
                <span className="text-muted-foreground">{guest.position}</span>
              </button>
              <button
                aria-label={`Editar ${guest.name}`}
                className="hover:bg-background text-muted-foreground hover:text-foreground grid size-5 place-items-center rounded-full transition-colors"
                onClick={() => onEdit(guest)}
                type="button"
              >
                <PencilIcon className="size-3" />
              </button>
              <button
                aria-label={`Quitar ${guest.name}`}
                className="hover:bg-background text-muted-foreground hover:text-foreground grid size-5 place-items-center rounded-full transition-colors"
                onClick={() => onRemove(guest.id)}
                type="button"
              >
                <XIcon className="size-3.5" />
              </button>
            </span>
          );
        })}
      </div>
    </section>
  );
};
