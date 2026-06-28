"use client";

import { deletePlayers } from "@/app/actions/players";
import { FifaCard } from "@/components/shared/fifa-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { playersKey, usePlayers } from "@/hooks/use-players";
import {
  GROUP_LABEL,
  positionGroup,
  type PositionGroup,
} from "@/lib/constants";
import type { Player } from "@/lib/db/schema";
import { selectedIdsAtom } from "@/lib/state/atoms";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { ListChecksIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { FloatingActionBar } from "./floating-action-bar";

const GROUPS: (PositionGroup | "ALL")[] = ["ALL", "GK", "DEF", "MID", "FWD"];

export function PlayersBrowser({
  players: initialPlayers,
  isAdmin = false,
}: {
  players: Player[];
  isAdmin?: boolean;
}) {
  // Server-rendered roster seeds the React Query cache; mutations invalidate it.
  const { data: players } = usePlayers(initialPlayers);
  const queryClient = useQueryClient();
  const router = useRouter();

  // The QueryClient persists across navigations, so on each RSC navigation
  // (after create/edit/delete elsewhere) push the fresh server data into the
  // cache — otherwise the gallery would keep showing stale cached rows.
  React.useEffect(() => {
    queryClient.setQueryData(playersKey, initialPlayers);
  }, [initialPlayers, queryClient]);
  const [query, setQuery] = React.useState("");
  const [group, setGroup] = React.useState<PositionGroup | "ALL">("ALL");
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const [, setPool] = useAtom(selectedIdsAtom);

  const filtered = players.filter((p) => {
    const matchesGroup = group === "ALL" || positionGroup(p.position) === group;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.displayName.toLowerCase().includes(q);
    return matchesGroup && matchesQuery;
  });

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
      if (allFilteredSelected) filtered.forEach((p) => next.delete(p.id));
      else filtered.forEach((p) => next.add(p.id));
      return next;
    });
  }

  function clear() {
    setSelected(new Set());
  }

  function addToTeams() {
    const ids = [...selected];
    setPool((prev) => Array.from(new Set([...prev, ...ids])));
    toast.success(
      `${ids.length} jugador${ids.length === 1 ? "" : "es"} en el pool · armando equipos`,
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
        `${res.count} jugador${res.count === 1 ? "" : "es"} eliminado${res.count === 1 ? "" : "s"}`,
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar jugador…"
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {GROUPS.map((g) => (
            <Button
              key={g}
              size="sm"
              variant={group === g ? "default" : "outline"}
              onClick={() => setGroup(g)}
            >
              {g === "ALL" ? "Todos" : GROUP_LABEL[g]}
            </Button>
          ))}
          <Button size="sm" variant="secondary" onClick={toggleAllFiltered}>
            <ListChecksIcon />
            {allFilteredSelected ? "Quitar" : "Seleccionar"}
          </Button>
        </div>
      </div>

      <p className="text-muted-foreground text-xs">
        {filtered.length} jugador{filtered.length === 1 ? "" : "es"}
        {selected.size > 0
          ? ` · ${selected.size} seleccionado${selected.size === 1 ? "" : "s"}`
          : ""}
      </p>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center text-sm">
          No hay jugadores que coincidan.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((player) => {
            const isSel = selected.has(player.id);
            return (
              <div key={player.id} className="group relative">
                {/* Selection checkbox — only on hover (or when already selected) */}
                <label
                  className={cn(
                    "bg-background/85 ring-foreground/10 absolute top-2 left-2 z-10 flex cursor-pointer items-center justify-center rounded-md p-1 shadow ring-1 backdrop-blur transition-opacity",
                    "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
                    isSel && "opacity-100",
                  )}
                  aria-label={`Seleccionar ${player.name}`}
                >
                  <Checkbox
                    checked={isSel}
                    onCheckedChange={() => toggle(player.id)}
                  />
                </label>
                <Link
                  href={`/players/${player.id}`}
                  className={cn(
                    "block rounded-[1.4rem] transition-transform duration-200 hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline-none",
                    isSel &&
                      "ring-primary ring-offset-background ring-2 ring-offset-2",
                  )}
                >
                  <FifaCard player={player} />
                </Link>
              </div>
            );
          })}
        </div>
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
}
