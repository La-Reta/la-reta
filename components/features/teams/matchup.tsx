"use client";

import {
  EXPORT_BOARD_WIDTH,
  EXPORT_LIST_WIDTH,
  TEAM_A,
  TEAM_B,
} from "@/components/features/teams/constants";
import type { MatchupView } from "@/components/features/teams/control-bar";
import { MatchupList } from "@/components/features/teams/matchup-list";
import { MatchupPitch } from "@/components/features/teams/matchup-pitch";
import { TeamSheet } from "@/components/features/teams/team-sheet";
import { useMatchupDownload } from "@/components/features/teams/use-matchup-download";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BalancedTeams } from "@/lib/team-balancer";
import { cn } from "@/lib/utils";
import { DownloadIcon } from "lucide-react";

export function Matchup({
  result,
  view,
  nameA,
  nameB,
}: {
  result: BalancedTeams;
  view: MatchupView;
  nameA: string;
  nameB: string;
}) {
  const { ratingA, ratingB, diff, teamA, teamB } = result;
  const { pitchRef, exportPitchRef, listRef, exportListRef, busy, download } =
    useMatchupDownload(view);

  return (
    <section className="ring-foreground/10 overflow-hidden rounded-xl ring-1">
      <ScoreboardHeader
        ratingA={ratingA}
        ratingB={ratingB}
        countA={teamA.length}
        countB={teamB.length}
      />
      <BalanceMeter ratingA={ratingA} ratingB={ratingB} diff={diff} />

      {/* Alineación: tablero o lista */}
      <div className="bg-card space-y-3 px-4 py-4">
        <div className="flex items-center justify-between">
          <span className="font-display text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Alineación
          </span>
          <Button variant="default" onClick={download} disabled={busy}>
            <DownloadIcon />
            {busy ? "Generando…" : "Descargar imagen"}
          </Button>
        </div>

        {view === "list" ? (
          <>
            <MatchupList
              ref={listRef}
              teamA={teamA}
              teamB={teamB}
              ratingA={ratingA}
              ratingB={ratingB}
              nameA={nameA}
              nameB={nameB}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none fixed top-0"
              style={{ left: -10000, width: EXPORT_LIST_WIDTH }}
            >
              <MatchupList
                ref={exportListRef}
                teamA={teamA}
                teamB={teamB}
                ratingA={ratingA}
                ratingB={ratingB}
                nameA={nameA}
                nameB={nameB}
              />
            </div>
            <ExportSizeHint />
          </>
        ) : (
          <>
            <MatchupPitch
              ref={pitchRef}
              teamA={teamA}
              teamB={teamB}
              ratingA={ratingA}
              ratingB={ratingB}
              nameA={nameA}
              nameB={nameB}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none fixed top-0"
              style={{ left: -10000, width: EXPORT_BOARD_WIDTH }}
            >
              <MatchupPitch
                ref={exportPitchRef}
                teamA={teamA}
                teamB={teamB}
                ratingA={ratingA}
                ratingB={ratingB}
                nameA={nameA}
                nameB={nameB}
              />
            </div>
            <ExportSizeHint />
          </>
        )}
      </div>

      {/* Team sheets (solo en modo tablero; la lista ya los muestra) */}
      {view === "board" && (
        <div className="bg-border grid gap-px md:grid-cols-2">
          <TeamSheet
            team={nameA.trim() || "Equipo A"}
            color={TEAM_A}
            lineups={teamA}
            rating={ratingA}
          />
          <TeamSheet
            team={nameB.trim() || "Equipo B"}
            color={TEAM_B}
            lineups={teamB}
            rating={ratingB}
          />
        </div>
      )}
    </section>
  );
}

function ScoreboardHeader({
  ratingA,
  ratingB,
  countA,
  countB,
}: {
  ratingA: number;
  ratingB: number;
  countA: number;
  countB: number;
}) {
  return (
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
          {countA} jugadores · OVR prom.
        </p>
      </div>
      <span className="font-display text-2xl font-black text-white/30">VS</span>
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
          {countB} jugadores · OVR prom.
        </p>
      </div>
    </div>
  );
}

function BalanceMeter({
  ratingA,
  ratingB,
  diff,
}: {
  ratingA: number;
  ratingB: number;
  diff: number;
}) {
  const aPct = Math.round((ratingA / (ratingA + ratingB || 1)) * 100);
  const verdict =
    diff <= 1.5
      ? { label: "Muy parejos ⚖️", className: "text-emerald-500" }
      : diff <= 3
        ? { label: "Balance aceptable", className: "text-amber-500" }
        : { label: "Algo disparejo", className: "text-rose-500" };

  return (
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
  );
}

function ExportSizeHint() {
  return (
    <div className="flex items-center justify-center lg:hidden">
      <Badge variant="outline">La descarga se genera en tamaño desktop.</Badge>
    </div>
  );
}
