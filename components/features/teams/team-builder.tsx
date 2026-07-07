"use client";

import {
  ControlBar,
  type MatchupView,
} from "@/components/features/teams/control-bar";
import { Convocatoria } from "@/components/features/teams/convocatoria";
import { Matchup } from "@/components/features/teams/matchup";
import { TeamNameInputs } from "@/components/features/teams/team-name-inputs";
import type { Player } from "@/lib/db/schema";
import {
  selectedIdsAtom,
  teamNameAAtom,
  teamNameBAtom,
} from "@/lib/state/atoms";
import { balanceTeams, type BalancedTeams } from "@/lib/team-balancer";
import { useAtom } from "jotai";
import { ScaleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

export function TeamBuilder({ players }: { players: Player[] }) {
  const router = useRouter();
  const [selected, setSelected] = useAtom(selectedIdsAtom);
  const [result, setResult] = React.useState<BalancedTeams | null>(null);
  const [view, setView] = React.useState<MatchupView>("board");
  const [nameA, setNameA] = useAtom(teamNameAAtom);
  const [nameB, setNameB] = useAtom(teamNameBAtom);
  const [mounted, setMounted] = React.useState(false);
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
    setResult(balanceTeams(selectedPlayers));
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
