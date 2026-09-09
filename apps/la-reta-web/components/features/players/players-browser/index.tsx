"use client";

import { deletePlayers } from "@/app/actions/players";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { playersKey, usePlayers } from "@/hooks/use-players";
import {
  GROUP_LABEL,
  positionGroup,
  type PositionGroup,
} from "@/lib/constants";
import type { Player } from "@/lib/db/schema";
import { playerPositions } from "@/lib/format";
import { selectedIdsAtom } from "@/lib/state/atoms";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { ListChecksIcon, SearchIcon, SearchXIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { PlayersFilterBar } from "./filter-bar";
import { PlayerGrid } from "./player-grid";
import { FloatingActionBar } from "./floating-action-bar";

/** Espera a que el usuario deje de teclear antes de reescribir la URL. */
const URL_SYNC_DELAY_MS = 300;

function isGroup(value: string | null): value is PositionGroup {
  return (
    value === "GK" || value === "DEF" || value === "MID" || value === "FWD"
  );
}

export const PlayersBrowser = ({
  players: initialPlayers,
  isAdmin = false,
}: {
  readonly players: Player[];
  readonly isAdmin?: boolean;
}) => {
  // Server-rendered roster seeds the React Query cache; mutations invalidate it.
  const { data: players } = usePlayers(initialPlayers);
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The QueryClient persists across navigations, so on each RSC navigation
  // (after create/edit/delete elsewhere) push the fresh server data into the
  // cache — otherwise the gallery would keep showing stale cached rows.
  React.useEffect(() => {
    queryClient.setQueryData(playersKey, initialPlayers);
  }, [initialPlayers, queryClient]);

  // Los filtros viven en la URL (?q= y ?pos=): así una plantilla filtrada se
  // comparte por link, el botón "atrás" la deshace y recargar no la pierde.
  const urlQuery = searchParams.get("q") ?? "";
  const urlGroup = searchParams.get("pos");
  const group: PositionGroup | "ALL" = isGroup(urlGroup) ? urlGroup : "ALL";

  // El input se mantiene local para que teclear sea instantáneo; la URL se
  // actualiza en diferido.
  const [query, setQuery] = React.useState(urlQuery);
  // Si la URL cambia por fuera (atrás/adelante, link compartido) el input se
  // resincroniza durante el render, no en un efecto: hacerlo en un efecto
  // provoca un render extra con el valor viejo ya pintado.
  const [syncedQuery, setSyncedQuery] = React.useState(urlQuery);
  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery);
    setQuery(urlQuery);
  }

  function writeParams(next: { q?: string; pos?: PositionGroup | "ALL" }) {
    const params = new URLSearchParams(searchParams.toString());

    if (next.q !== undefined) {
      if (next.q.trim()) params.set("q", next.q.trim());
      else params.delete("q");
    }
    if (next.pos !== undefined) {
      if (next.pos === "ALL") params.delete("pos");
      else params.set("pos", next.pos);
    }

    const search = params.toString();
    // replace + scroll:false: filtrar no debe llenar el historial de pasos
    // intermedios ni saltar al inicio de la galería.
    router.replace(search ? `${pathname}?${search}` : pathname, {
      scroll: false,
    });
  }

  // El debounce vive en el handler, no en un efecto: así no se resuscribe en
  // cada render y no hay setState dentro de un efecto.
  const urlSyncTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (urlSyncTimer.current) clearTimeout(urlSyncTimer.current);
    },
    []
  );

  function onQueryChange(value: string) {
    setQuery(value);
    if (urlSyncTimer.current) clearTimeout(urlSyncTimer.current);
    urlSyncTimer.current = setTimeout(
      () => writeParams({ q: value }),
      URL_SYNC_DELAY_MS
    );
  }

  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const [, setPool] = useAtom(selectedIdsAtom);

  const filtered = players.filter((p) => {
    // Match on primary AND secondary position, so a GK/CB shows under both GK
    // and DEF. filter() yields each player once, so no card is duplicated.
    const matchesGroup =
      group === "ALL" ||
      playerPositions(p).some((pos) => positionGroup(pos) === group);
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.displayName.toLowerCase().includes(q);
    return matchesGroup && matchesQuery;
  });

  const hasFilters = query.trim() !== "" || group !== "ALL";

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  function toggleAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of filtered) {
        if (allFilteredSelected) next.delete(p.id);
        else next.add(p.id);
      }
      return next;
    });
  }

  function clear() {
    setSelected(new Set());
  }

  function clearFilters() {
    setQuery("");
    writeParams({ q: "", pos: "ALL" });
  }

  function addToTeams() {
    const ids = [...selected];
    setPool((prev) => Array.from(new Set([...prev, ...ids])));
    toast.success(
      `${ids.length} jugador${ids.length === 1 ? "" : "es"} en el pool · armando equipos`
    );
    setSelected(new Set());
    router.push("/teams");
  }

  const deleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await deletePlayers(ids);
      if (!res.ok) throw new Error(res.error);
      return res;
    },
    onSuccess: (res) => {
      toast.success(
        `${res.count} jugador${res.count === 1 ? "" : "es"} eliminado${res.count === 1 ? "" : "s"}`
      );
      clear();
      queryClient.invalidateQueries({ queryKey: playersKey });
    },
    onError: (err: Error) => toast.error(err.message),
  });
  const pending = deleteMutation.isPending;

  function bulkDelete() {
    deleteMutation.mutate([...selected]);
  }

  return (
    <div className="space-y-4">
      <PlayersFilterBar
        query={query}
        group={group}
        allFilteredSelected={allFilteredSelected}
        onQueryChange={onQueryChange}
        onClearQuery={() => {
          setQuery("");
          writeParams({ q: "" });
        }}
        onGroupChange={(g) => writeParams({ pos: g })}
        onToggleAll={toggleAllFiltered}
      />

      {/* aria-live: al filtrar, un lector de pantalla anuncia cuántos quedan
          en vez de dejar el cambio en silencio. */}
      <p aria-live="polite" className="text-muted-foreground text-xs">
        <span className="tabular-nums">{filtered.length}</span> jugador
        {filtered.length === 1 ? "" : "es"}
        {selected.size > 0
          ? ` · ${selected.size} seleccionado${selected.size === 1 ? "" : "s"}`
          : ""}
      </p>

      {filtered.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon />
            </EmptyMedia>
            <EmptyTitle>No hay jugadores que coincidan</EmptyTitle>
            <EmptyDescription>
              Prueba con otro nombre o quita el filtro de posición.
            </EmptyDescription>
          </EmptyHeader>
          {hasFilters ? (
            <Button variant="outline" onClick={clearFilters}>
              <XIcon />
              Limpiar filtros
            </Button>
          ) : null}
        </Empty>
      ) : (
        <PlayerGrid onToggle={toggle} players={filtered} selected={selected} />
      )}

      {/* Floating bulk-action bar */}
      {selected.size > 0 && (
        <FloatingActionBar
          selected={selected}
          allFilteredSelected={allFilteredSelected}
          toggleAllFiltered={toggleAllFiltered}
          addToTeams={addToTeams}
          isAdmin={isAdmin}
          pending={pending}
          bulkDelete={bulkDelete}
          clear={clear}
        />
      )}
    </div>
  );
};
