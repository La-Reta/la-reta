"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { toast } from "sonner";
import {
  PlusIcon,
  MinusIcon,
  PlayIcon,
  FlagIcon,
  XIcon,
  SearchIcon,
  UserIcon,
} from "lucide-react";
import {
  liveMatchAtom,
  EMPTY_LIVE_MATCH,
  type LiveGoal,
} from "@/lib/state/atoms";
import { createMatch } from "@/app/actions/matches";
import { formatDuration } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type LivePlayer = { id: number; name: string };

export function LiveMatch({ players }: { players: LivePlayer[] }) {
  const router = useRouter();
  const [live, setLive] = useAtom(liveMatchAtom);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Ticking clock that visually drives the "live" feel.
  const [nowTick, setNowTick] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!live.active) return;
    setNowTick(Date.now());
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [live.active]);
  const elapsedSec = live.startedAt
    ? Math.max(0, Math.floor((nowTick - live.startedAt) / 1000))
    : 0;

  const [aName, setAName] = React.useState("Equipo A");
  const [bName, setBName] = React.useState("Equipo B");
  const [attrId, setAttrId] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const scoreA = live.goals.filter((g) => g.team === "A").length;
  const scoreB = live.goals.filter((g) => g.team === "B").length;

  const nameOf = (id: number | null) =>
    id == null ? "Anónimo" : (players.find((p) => p.id === id)?.name ?? "Jugador");

  // Short scorer list per team for the scoreboard, e.g. ["Pastor", "Cruz ×2"].
  const shortName = (full: string) => full.trim().split(/\s+/).slice(-1)[0];
  const scorersFor = (team: "A" | "B") => {
    const tally = new Map<number, number>();
    for (const g of live.goals) {
      if (g.team === team && g.playerId != null)
        tally.set(g.playerId, (tally.get(g.playerId) ?? 0) + 1);
    }
    return [...tally].map(
      ([pid, n]) => `${shortName(nameOf(pid))}${n > 1 ? ` ×${n}` : ""}`,
    );
  };

  const minute = (at: number) =>
    live.startedAt ? `${Math.max(0, Math.floor((at - live.startedAt) / 60000))}'` : "";
  const clock = (at: number) =>
    new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  function start() {
    setLive({
      active: true,
      teamA: aName.trim() || "Equipo A",
      teamB: bName.trim() || "Equipo B",
      startedAt: Date.now(),
      goals: [],
    });
  }

  // Goal time is locked to the moment +1 is tapped; scorer is assigned after.
  function addGoal(team: "A" | "B") {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${team}-${live.goals.length}`;
    setLive((s) => ({
      ...s,
      goals: [...s.goals, { id, team, playerId: null, at: Date.now() }],
    }));
    setAttrId(id);
    setFilter("");
  }

  function removeLast(team: "A" | "B") {
    setLive((s) => {
      let lastIdx = -1;
      s.goals.forEach((g, i) => {
        if (g.team === team) lastIdx = i;
      });
      if (lastIdx === -1) return s;
      return { ...s, goals: s.goals.filter((_, i) => i !== lastIdx) };
    });
  }

  function removeGoal(id: string) {
    setLive((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }));
  }

  function attribute(id: string, playerId: number | null) {
    setLive((s) => ({
      ...s,
      goals: s.goals.map((g) => (g.id === id ? { ...g, playerId } : g)),
    }));
    setAttrId(null);
  }

  function discard() {
    if (!confirm("¿Descartar el partido en vivo? No se guardará.")) return;
    setLive(EMPTY_LIVE_MATCH);
  }

  function finalize() {
    startTransition(async () => {
      const tally = new Map<number, number>();
      for (const g of live.goals) {
        if (g.playerId != null)
          tally.set(g.playerId, (tally.get(g.playerId) ?? 0) + 1);
      }
      const durationSec = live.startedAt
        ? Math.floor((Date.now() - live.startedAt) / 1000)
        : null;
      const res = await createMatch({
        playedAt: new Date(live.startedAt ?? Date.now()).toISOString().slice(0, 10),
        teamAName: live.teamA,
        teamBName: live.teamB,
        scoreA,
        scoreB,
        balance: 50,
        durationSec,
        notes: "",
        scorers: [...tally].map(([playerId, goals]) => ({ playerId, goals })),
      });
      if (res.ok) {
        toast.success("Partido finalizado y guardado en el registro");
        setLive(EMPTY_LIVE_MATCH);
        router.push("/matches");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  if (!mounted) {
    return <div className="mx-auto h-72 max-w-md animate-pulse rounded-lg bg-muted/50" />;
  }

  // ── Start screen ──────────────────────────────────────────────────────────
  if (!live.active) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <div className="space-y-4 bg-card p-5 rounded-lg ring-1 ring-foreground/10">
          <p className="text-sm text-muted-foreground">
            Nombra a los dos equipos que van a jugar y arranca el marcador.
          </p>
          <div className="grid gap-3">
            <div>
              <Label className="mb-1.5 block text-xs">Equipo local</Label>
              <Input value={aName} onChange={(e) => setAName(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Equipo visitante</Label>
              <Input value={bName} onChange={(e) => setBName(e.target.value)} />
            </div>
          </div>
          <Button size="lg" className="h-12 w-full text-base" onClick={start}>
            <PlayIcon />
            Iniciar partido en vivo
          </Button>
        </div>
      </div>
    );
  }

  // ── Live screen ───────────────────────────────────────────────────────────
  const attrGoal = live.goals.find((g) => g.id === attrId);
  const attrTeam = attrGoal ? (attrGoal.team === "A" ? live.teamA : live.teamB) : "";
  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(filter.trim().toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-md space-y-4">
      {/* Scoreboard */}
      <div className="relative overflow-hidden rounded-2xl bg-neutral-950 text-white shadow-lg ring-1 ring-white/10">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r from-sky-500/20 via-sky-500/5 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-2/5 bg-gradient-to-l from-rose-500/20 via-rose-500/5 to-transparent" />

        {/* Live + timer */}
        <div className="relative flex flex-col items-center gap-1 pt-4">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-red-500" />
            </span>
            <span className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-red-400">
              En vivo
            </span>
          </div>
          <span
            className="font-mono text-xl font-bold tabular-nums text-white/90"
            aria-label="Tiempo de juego"
          >
            {formatDuration(elapsedSec)}
          </span>
        </div>

        {/* Teams + score */}
        <div
          className="relative grid grid-cols-[1fr_auto_1fr] items-start gap-2 px-4 pb-5 pt-3"
          role="status"
          aria-live="polite"
          aria-label={`${live.teamA} ${scoreA}, ${live.teamB} ${scoreB}`}
        >
          {(["A", "B"] as const).map((team, idx) => {
            const isA = team === "A";
            const scorers = scorersFor(team);
            return (
              <React.Fragment key={team}>
                <div className="min-w-0 text-center">
                  <p
                    className={cn(
                      "truncate font-display text-sm font-bold uppercase tracking-wide",
                      isA ? "text-sky-300" : "text-rose-300",
                    )}
                  >
                    {isA ? live.teamA : live.teamB}
                  </p>
                  <span
                    className={cn(
                      "mx-auto mt-1 block h-0.5 w-8 rounded-full",
                      isA ? "bg-sky-400" : "bg-rose-400",
                    )}
                  />
                  {scorers.length > 0 && (
                    <p className="mt-1.5 line-clamp-2 text-[10px] leading-snug text-white/55">
                      {scorers.join(", ")}
                    </p>
                  )}
                </div>
                {idx === 0 && (
                  <p className="px-1 font-mono text-6xl font-black leading-none tabular-nums">
                    {scoreA}
                    <span className="mx-1 text-white/30">:</span>
                    {scoreB}
                  </p>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* +1 / -1 controls */}
      <div className="grid grid-cols-2 gap-3">
        {(["A", "B"] as const).map((team) => {
          const name = team === "A" ? live.teamA : live.teamB;
          const score = team === "A" ? scoreA : scoreB;
          return (
            <div key={team} className="space-y-2">
              <Button
                className={cn(
                  "h-20 w-full flex-col gap-0.5 rounded-xl text-base text-white shadow-sm transition-transform active:scale-[0.98]",
                  team === "A"
                    ? "bg-sky-600 hover:bg-sky-700"
                    : "bg-rose-600 hover:bg-rose-700",
                )}
                onClick={() => addGoal(team)}
                aria-label={`Gol de ${name}`}
              >
                <PlusIcon className="size-5" />
                <span className="font-bold">GOL</span>
                <span className="max-w-full truncate text-[11px] font-normal opacity-90">
                  {name}
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-9 w-full"
                onClick={() => removeLast(team)}
                disabled={score === 0}
                aria-label={`Quitar último gol de ${name}`}
              >
                <MinusIcon />
                Quitar gol
              </Button>
            </div>
          );
        })}
      </div>

      {/* Goal timeline */}
      <div className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground">
          <span className="h-4 w-1 rounded-full bg-primary" />
          Goles · {live.goals.length}
        </h2>
        {live.goals.length === 0 ? (
          <p className="bg-card p-6 text-center text-sm text-muted-foreground rounded-lg ring-1 ring-foreground/10">
            Sin goles aún. Marca el primero ⚽
          </p>
        ) : (
          <ul className="divide-y divide-border bg-card rounded-lg ring-1 ring-foreground/10">
            {[...live.goals].reverse().map((g) => (
              <li key={g.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                <span
                  className={cn(
                    "inline-flex min-w-9 justify-center rounded-sm px-1.5 py-0.5 text-[10px] font-bold text-white",
                    g.team === "A" ? "bg-sky-600" : "bg-rose-600",
                  )}
                >
                  {g.team === "A" ? live.teamA : live.teamB}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAttrId(g.id);
                    setFilter("");
                  }}
                  className="flex min-w-0 flex-1 items-center gap-1 truncate text-left hover:underline"
                >
                  <UserIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className={cn("truncate", g.playerId == null && "text-muted-foreground")}>
                    {nameOf(g.playerId)}
                  </span>
                </button>
                <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                  {minute(g.at)} · {clock(g.at)}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeGoal(g.id)}
                  aria-label="Eliminar gol"
                >
                  <XIcon />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Finalize / discard */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button size="lg" className="h-12 flex-1 text-base" disabled={pending}>
                <FlagIcon />
                Finalizar partido
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Finalizar y guardar</AlertDialogTitle>
              <AlertDialogDescription>
                {live.teamA} {scoreA} – {scoreB} {live.teamB}. Se guardará en el
                registro de partidos con sus goleadores.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending}>Seguir jugando</AlertDialogCancel>
              <AlertDialogAction onClick={finalize} disabled={pending}>
                {pending ? "Guardando…" : "Finalizar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button
          variant="ghost"
          className="h-12 sm:h-12"
          onClick={discard}
          disabled={pending}
        >
          Descartar
        </Button>
      </div>

      {/* Scorer picker (bottom sheet) */}
      <Drawer
        open={attrId != null}
        onOpenChange={(open) => {
          if (!open) setAttrId(null);
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>¿Quién anotó para {attrTeam}?</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-3 overflow-y-auto px-4 pb-6">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Buscar jugador…"
                className="pl-8"
                autoFocus
              />
            </div>
            <div className="grid max-h-[45vh] grid-cols-2 gap-2 overflow-y-auto">
              <Button
                variant="outline"
                className="col-span-2 justify-start"
                onClick={() => attrId && attribute(attrId, null)}
              >
                <UserIcon />
                Anónimo / sin asignar
              </Button>
              {filteredPlayers.map((p) => (
                <Button
                  key={p.id}
                  variant="outline"
                  className="justify-start truncate"
                  onClick={() => attrId && attribute(attrId, p.id)}
                >
                  <span className="truncate">{p.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
