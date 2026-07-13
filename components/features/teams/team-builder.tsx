"use client";

import { saveGeneratedReta } from "@/app/actions/retas";
import {
  ControlBar,
  type MatchupView,
} from "@/components/features/teams/control-bar";
import { Convocatoria } from "@/components/features/teams/convocatoria";
import { GuestManager } from "@/components/features/teams/guest-manager";
import { Matchup } from "@/components/features/teams/matchup";
import { TeamNameInputs } from "@/components/features/teams/team-name-inputs";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { Position } from "@/lib/constants";
import type { Player } from "@/lib/db/schema";
import { isGuest, makeGuestPlayer } from "@/lib/guests";
import type { RecentSplit } from "@/lib/queries";
import {
  currentGeneratedRetaIdAtom,
  guestsAtom,
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
    // Guests (negative id) aren't in the roster → null id + their name inline.
    playerId: isGuest(l.player) ? null : l.player.id,
    guestName: isGuest(l.player) ? l.player.name : undefined,
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
  const [guests, setGuests] = useAtom(guestsAtom);
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

  // Roster + guests share the pool; guests carry negative ids.
  const allPlayers = React.useMemo(
    () => [...players, ...guests],
    [players, guests],
  );
  const byId = React.useMemo(
    () => new Map(allPlayers.map((p) => [p.id, p])),
    [allPlayers],
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

  function addGuest(input: {
    name: string;
    overall: number;
    position: Position;
  }) {
    setResult(null);
    const guest = makeGuestPlayer(input, guests);
    setGuests((prev) => [...prev, guest]);
    setSelected((prev) => [...prev, guest.id]); // auto-convocar
  }

  function removeGuest(id: number) {
    setResult(null);
    setGuests((prev) => prev.filter((g) => g.id !== id));
    setSelected((prev) => prev.filter((x) => x !== id));
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

  const allSelected =
    allPlayers.length > 0 && selected.length === allPlayers.length;

  function toggleAll() {
    setResult(null);
    setSelected(allSelected ? [] : allPlayers.map((p) => p.id));
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
        <Matchup
          result={result}
          view={view}
          nameA={nameA}
          nameB={nameB}
          onViewChange={setView}
          hasResult={result !== null}
        />
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ScaleIcon />
            </EmptyMedia>
            <EmptyTitle>Aún no hay equipos</EmptyTitle>
            <EmptyDescription>
              Convoca al menos 2 jugadores y genera dos equipos parejos.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <GuestManager guests={guests} onAdd={addGuest} onRemove={removeGuest} />

      <Convocatoria
        players={allPlayers}
        selected={selected}
        onToggle={toggle}
        selectedCount={selectedPlayers.length}
      />
    </div>
  );
}
