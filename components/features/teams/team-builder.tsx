"use client";

import { saveGeneratedReta } from "@/app/actions/retas";
import {
  ControlBar,
  type MatchupView,
} from "@/components/features/teams/control-bar";
import { Convocatoria } from "@/components/features/teams/convocatoria";
import { Matchup } from "@/components/features/teams/matchup";
import { TeamNameInputs } from "@/components/features/teams/team-name-inputs";
import type { Player } from "@/lib/db/schema";
import type { RecentSplit } from "@/lib/queries";
import {
  currentGeneratedRetaIdAtom,
  selectedIdsAtom,
  teamNameAAtom,
  teamNameBAtom,
} from "@/lib/state/atoms";
import {
  balanceTeamsVaried,
  type BalancedTeams,
  type Lineup,
} from "@/lib/team-balancer";
import { useAtom, useSetAtom } from "jotai";
import { ScaleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

const sideRows = (lineups: Lineup[], team: "A" | "B") =>
  lineups.map((l) => ({
    playerId: l.player.id,
    team,
    role: l.role,
    overall: l.player.overall,
  }));

export function TeamBuilder({
  players,
  recentSplits = [],
}: {
  players: Player[];
  recentSplits?: RecentSplit[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useAtom(selectedIdsAtom);
  const [result, setResult] = React.useState<BalancedTeams | null>(null);
  const [view, setView] = React.useState<MatchupView>("board");
  const [nameA, setNameA] = useAtom(teamNameAAtom);
  const [nameB, setNameB] = useAtom(teamNameBAtom);
  const setCurrentRetaId = useSetAtom(currentGeneratedRetaIdAtom);
  const [mounted, setMounted] = React.useState(false);
  // Splits generated this session, so consecutive regenerations vary even
  // before the server round-trip lands.
  const [sessionSplits, setSessionSplits] = React.useState<RecentSplit[]>([]);
  const [, startSave] = React.useTransition();
  // eslint-disable-next-line react-hooks/set-state-in-effect
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

    const teams = balanceTeamsVaried(selectedPlayers, [
      ...sessionSplits,
      ...recentSplits,
    ]);
    setResult(teams);

    const teamAIds = teams.teamA.map((l) => l.player.id);
    const teamBIds = teams.teamB.map((l) => l.player.id);
    setSessionSplits((prev) => [{ teamAIds, teamBIds }, ...prev].slice(0, 30));

    // Persist the generation (fire-and-forget) and remember its id for the live
    // flow. A failed save just leaves the matchup unlinked — non-blocking.
    setCurrentRetaId(null);
    startSave(async () => {
      const res = await saveGeneratedReta({
        teamAName: nameA,
        teamBName: nameB,
        ratingA: teams.ratingA,
        ratingB: teams.ratingB,
        diff: teams.diff,
        players: [...sideRows(teams.teamA, "A"), ...sideRows(teams.teamB, "B")],
      });
      if (res.ok) setCurrentRetaId(res.id);
    });
  }

  const allSelected = players.length > 0 && selected.length === players.length;

  function toggleAll() {
    setResult(null);
    setSelected(allSelected ? [] : players.map((p) => p.id));
  }

  function clear() {
    setSelected([]);
    setResult(null);
  }

  if (!mounted) {
    return <div className="bg-muted/50 h-64 animate-pulse rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      <ControlBar
        selectedCount={selectedPlayers.length}
        allSelected={allSelected}
        hasSelection={selected.length > 0}
        hasResult={result !== null}
        view={view}
        onViewChange={setView}
        onToggleAll={toggleAll}
        onClear={clear}
        onGenerate={generate}
        generateDisabled={selectedPlayers.length < 2}
        onGoLive={() => router.push("/live")}
        onRegistro={() => router.push("/teams/registro")}
      />

      <TeamNameInputs
        nameA={nameA}
        nameB={nameB}
        onNameAChange={setNameA}
        onNameBChange={setNameB}
      />

      {result ? (
        <Matchup result={result} view={view} nameA={nameA} nameB={nameB} />
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-center">
          <ScaleIcon className="text-muted-foreground size-8" />
          <p className="text-muted-foreground text-sm">
            Convoca al menos 2 jugadores y genera dos equipos parejos.
          </p>
        </div>
      )}

      <Convocatoria players={players} selected={selected} onToggle={toggle} />
    </div>
  );
}
