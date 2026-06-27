"use client";

import * as React from "react";
import { useAtom } from "jotai";
import { toast } from "sonner";
import {
  CheckIcon,
  ListChecksIcon,
  ShuffleIcon,
  XIcon,
  UsersIcon,
  ScaleIcon,
  DownloadIcon,
} from "lucide-react";
import { selectedIdsAtom } from "@/lib/state/atoms";
import { MatchupPitch } from "@/components/features/teams/matchup-pitch";
import {
  balanceTeams,
  type BalancedTeams,
  type Lineup,
} from "@/lib/team-balancer";
import {
  positionGroup,
  GROUP_LABEL,
  GROUP_COLOR,
  type PositionGroup,
} from "@/lib/constants";
import { flagEmoji, playerPositions } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Player } from "@/lib/db/schema";

const TEAM_A = "#0ea5e9"; // sky
const TEAM_B = "#f43f5e"; // rose

export function TeamBuilder({ players }: { players: Player[] }) {
  const [selected, setSelected] = useAtom(selectedIdsAtom);
  const [result, setResult] = React.useState<BalancedTeams | null>(null);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const byId = React.useMemo(
    () => new Map(players.map((p) => [p.id, p])),
    [players],
  );
  const selectedPlayers = selected
    .map((id) => byId.get(id))
    .filter((p): p is Player => Boolean(p));

  function toggle(id: number) {
    setResult(null);
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function generate() {
    if (selectedPlayers.length < 2) return;
    setResult(balanceTeams(selectedPlayers));
  }

  const allSelected = players.length > 0 && selected.length === players.length;

  function toggleAll() {
    setResult(null);
    setSelected(allSelected ? [] : players.map((p) => p.id));
  }

  if (!mounted) {
    return <div className="bg-muted/50 h-64 animate-pulse rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Control bar */}
      <div className="bg-card ring-foreground/10 flex flex-wrap items-center justify-between gap-3 rounded-lg p-3 ring-1">
        <div className="flex items-center gap-2 text-sm">
          <UsersIcon className="text-muted-foreground size-4" />
          <span className="font-mono text-lg font-bold tabular-nums">
            {selectedPlayers.length}
          </span>
          <span className="text-muted-foreground">convocados</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleAll}>
            <ListChecksIcon />
            {allSelected ? "Quitar todos" : "Todos"}
          </Button>
          {selected.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelected([]);
                setResult(null);
              }}
            >
              <XIcon />
              Limpiar
            </Button>
          )}
          <Button onClick={generate} disabled={selectedPlayers.length < 2}>
            <ShuffleIcon />
            {result ? "Regenerar" : "Generar equipos"}
          </Button>
        </div>
      </div>

      {/* Matchup */}
      {result ? (
        <Matchup result={result} />
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-center">
          <ScaleIcon className="text-muted-foreground size-8" />
          <p className="text-muted-foreground text-sm">
            Convoca al menos 2 jugadores y genera dos equipos parejos.
          </p>
        </div>
      )}

      {/* Convocatoria */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-between">
            <span>Convocatoria</span>
            <span className="text-muted-foreground text-xs font-normal">
              Toca para convocar
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {(["GK", "DEF", "MID", "FWD"] as PositionGroup[]).map((g) => {
            const groupPlayers = players.filter(
              (p) => positionGroup(p.position) === g,
            );
            if (groupPlayers.length === 0) return null;
            const picked = groupPlayers.filter((p) =>
              selected.includes(p.id),
            ).length;
            return (
              <div key={g} className="space-y-2">
                <p className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold uppercase">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: GROUP_COLOR[g] }}
                  />
                  {GROUP_LABEL[g]}
                  <span className="text-muted-foreground/60">
                    · {picked}/{groupPlayers.length}
                  </span>
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {groupPlayers.map((p) => {
                    const isSel = selected.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggle(p.id)}
                        className={cn(
                          "flex items-center gap-2 rounded-md border px-2.5 py-2 text-left text-xs transition-colors",
                          isSel
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-muted",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-sm border",
                            isSel
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/40",
                          )}
                        >
                          {isSel && <CheckIcon className="size-3.5" />}
                        </span>
                        <span className="w-9 shrink-0 font-mono font-bold tabular-nums">
                          {p.overall}
                        </span>
                        <span className="truncate font-medium">{p.name}</span>
                        <span className="ml-auto shrink-0">
                          {flagEmoji(p.nationality)}
                        </span>
                        <Badge variant="outline" className="shrink-0">
                          {playerPositions(p).join("/")}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function Matchup({ result }: { result: BalancedTeams }) {
  const { ratingA, ratingB, diff, teamA, teamB } = result;
  const total = ratingA + ratingB || 1;
  const aPct = Math.round((ratingA / total) * 100);

  const pitchRef = React.useRef<HTMLDivElement>(null);
  const [busy, setBusy] = React.useState(false);

  async function download() {
    if (!pitchRef.current) return;
    setBusy(true);
    try {
      const { toPng } = await import("html-to-image");
      const url = await toPng(pitchRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#0a1330",
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = "reta-vs.png";
      a.click();
      toast.success("Imagen generada 📸");
    } catch {
      toast.error("No se pudo generar la imagen");
    } finally {
      setBusy(false);
    }
  }
  const verdict =
    diff <= 1.5
      ? { label: "Muy parejos ⚖️", className: "text-emerald-500" }
      : diff <= 3
        ? { label: "Balance aceptable", className: "text-amber-500" }
        : { label: "Algo disparejo", className: "text-rose-500" };

  return (
    <section className="ring-foreground/10 overflow-hidden rounded-xl ring-1">
      {/* Scoreboard VS header */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 bg-neutral-950 px-5 py-6 text-white">
        <div className="text-right">
          <p
            className="font-display text-xs font-semibold tracking-[0.2em] uppercase"
            style={{ color: TEAM_A }}
          >
            Equipo A
          </p>
          <p className="font-mono text-5xl leading-none font-black tabular-nums">
            {ratingA}
          </p>
          <p className="mt-1 text-[11px] text-white/50">
            {teamA.length} jugadores · OVR prom.
          </p>
        </div>
        <span className="font-display text-2xl font-black text-white/30">
          VS
        </span>
        <div className="text-left">
          <p
            className="font-display text-xs font-semibold tracking-[0.2em] uppercase"
            style={{ color: TEAM_B }}
          >
            Equipo B
          </p>
          <p className="font-mono text-5xl leading-none font-black tabular-nums">
            {ratingB}
          </p>
          <p className="mt-1 text-[11px] text-white/50">
            {teamB.length} jugadores · OVR prom.
          </p>
        </div>
      </div>

      {/* Balance meter */}
      <div className="bg-card space-y-1.5 px-5 py-4">
        <div className="relative flex h-2.5 overflow-hidden rounded-full">
          <div style={{ width: `${aPct}%`, backgroundColor: TEAM_A }} />
          <div style={{ width: `${100 - aPct}%`, backgroundColor: TEAM_B }} />
          {/* center 50% tick */}
          <span className="bg-background/80 absolute top-1/2 left-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-muted-foreground text-center text-xs">
          Diferencia de nivel{" "}
          <span className="text-foreground font-bold">{diff}</span> ·{" "}
          <span className={cn("font-medium", verdict.className)}>
            {verdict.label}
          </span>
        </p>
      </div>

      {/* Pitch (capturable) */}
      <div className="bg-card space-y-3 px-4 py-4">
        <div className="flex items-center justify-between">
          <span className="font-display text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Alineación
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={download}
            disabled={busy}
          >
            <DownloadIcon />
            {busy ? "Generando…" : "Descargar imagen"}
          </Button>
        </div>
        <MatchupPitch
          ref={pitchRef}
          teamA={teamA}
          teamB={teamB}
          ratingA={ratingA}
          ratingB={ratingB}
        />
      </div>

      {/* Team sheets */}
      <div className="bg-border grid gap-px md:grid-cols-2">
        <TeamSheet
          team="Equipo A"
          color={TEAM_A}
          lineups={teamA}
          rating={ratingA}
        />
        <TeamSheet
          team="Equipo B"
          color={TEAM_B}
          lineups={teamB}
          rating={ratingB}
        />
      </div>
    </section>
  );
}

function TeamSheet({
  team,
  color,
  lineups,
  rating,
}: {
  team: string;
  color: string;
  lineups: Lineup[];
  rating: number;
}) {
  return (
    <div className="bg-card" style={{ borderTop: `3px solid ${color}` }}>
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <span className="flex items-center gap-2">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="font-display text-base font-bold tracking-wide uppercase">
            {team}
          </span>
        </span>
        <span className="text-muted-foreground text-xs">
          OVR{" "}
          <span className="text-foreground font-mono font-bold">{rating}</span>
        </span>
      </div>
      <ul className="divide-border divide-y border-t">
        {lineups.map(({ player, role }) => {
          const flexed = role !== player.position;
          return (
            <li
              key={player.id}
              className="flex items-center gap-2.5 px-4 py-2 text-sm"
            >
              <span
                className="grid size-7 shrink-0 place-items-center rounded-md font-mono text-xs font-bold tabular-nums"
                style={{ backgroundColor: `${color}1f`, color }}
              >
                {player.overall}
              </span>
              <Badge
                variant={role === "GK" ? "secondary" : "outline"}
                className="shrink-0"
              >
                {role}
              </Badge>
              <span className="truncate font-medium">{player.name}</span>
              {flexed && (
                <span className="text-muted-foreground shrink-0 text-[10px]">
                  ({playerPositions(player).join("/")})
                </span>
              )}
              <span className="ml-auto shrink-0">
                {flagEmoji(player.nationality)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
