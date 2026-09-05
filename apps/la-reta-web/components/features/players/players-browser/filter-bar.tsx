"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GROUP_LABEL, type PositionGroup } from "@/lib/constants";
import { ListChecksIcon, SearchIcon, XIcon } from "lucide-react";

const GROUPS: (PositionGroup | "ALL")[] = ["ALL", "GK", "DEF", "MID", "FWD"];

/**
 * Buscador + filtro por posición de la galería. Vive aparte para que
 * `PlayersBrowser` no crezca sin control; el estado sigue arriba porque la URL
 * es la fuente de verdad.
 */
export const PlayersFilterBar = ({
  query,
  group,
  allFilteredSelected,
  onQueryChange,
  onClearQuery,
  onGroupChange,
  onToggleAll,
}: {
  readonly query: string;
  readonly group: PositionGroup | "ALL";
  readonly allFilteredSelected: boolean;
  readonly onQueryChange: (value: string) => void;
  readonly onClearQuery: () => void;
  readonly onGroupChange: (group: PositionGroup | "ALL") => void;
  readonly onToggleAll: () => void;
}) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="relative w-full sm:max-w-xs">
      <SearchIcon
        aria-hidden="true"
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
      />
      <Input
        type="search"
        name="jugador"
        aria-label="Buscar jugador por nombre"
        autoComplete="off"
        spellCheck={false}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Buscar jugador… ej. Toño"
        className="pr-8 pl-8"
      />
      {query ? (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Limpiar búsqueda"
          onClick={onClearQuery}
          className="absolute top-1/2 right-1.5 -translate-y-1/2"
        >
          <XIcon />
        </Button>
      ) : null}
    </div>
    {/* <fieldset> en vez de role="group": mismo agrupado semántico con el
        elemento nativo. Sin borde ni margen por defecto. */}
    <fieldset
      aria-label="Filtrar por posición"
      className="m-0 flex min-w-0 flex-wrap items-center gap-1 border-0 p-0 sm:justify-end"
    >
      {GROUPS.map((g) => (
        <Button
          key={g}
          size="sm"
          variant={group === g ? "default" : "outline"}
          aria-pressed={group === g}
          onClick={() => onGroupChange(g)}
        >
          {g === "ALL" ? "Todos" : GROUP_LABEL[g]}
        </Button>
      ))}
      <Button size="sm" variant="secondary" onClick={onToggleAll}>
        <ListChecksIcon />
        {allFilteredSelected ? "Quitar" : "Seleccionar"}
      </Button>
    </fieldset>
  </div>
);
