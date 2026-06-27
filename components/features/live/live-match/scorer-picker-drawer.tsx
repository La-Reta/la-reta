"use client";

import { SearchIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { LivePlayer } from "./types";

export function ScorerPickerDrawer({
  open,
  attrTeam,
  filter,
  players,
  onFilterChange,
  onOpenChange,
  onSelectAnonymous,
  onSelectPlayer,
}: {
  open: boolean;
  attrTeam: string;
  filter: string;
  players: LivePlayer[];
  onFilterChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSelectAnonymous: () => void;
  onSelectPlayer: (playerId: number) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>¿Quién anotó para {attrTeam}?</DrawerTitle>
        </DrawerHeader>

        <div className="space-y-3 overflow-y-auto px-4 pb-6">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(e) => onFilterChange(e.target.value)}
              placeholder="Buscar jugador..."
              className="pl-8"
              autoFocus
            />
          </div>

          <div className="grid max-h-[45vh] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
            <Button
              variant="outline"
              className="justify-start"
              onClick={onSelectAnonymous}
            >
              <UserIcon />
              Anónimo / sin asignar
            </Button>

            {players.map((player) => (
              <Button
                key={player.id}
                variant="outline"
                className="justify-start truncate"
                onClick={() => onSelectPlayer(player.id)}
              >
                <span className="truncate">{player.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
