"use client";

import { saveGeneratedReta } from "@/app/actions/retas";
import {
  ControlBar,
  type MatchupView,
} from "@/components/features/teams/control-bar";
import { Convocatoria } from "@/components/features/teams/convocatoria";
import {
  GuestManager,
  type GuestInput,
} from "@/components/features/teams/guest-manager";
import { Matchup } from "@/components/features/teams/matchup";
import { TeamNameInputs } from "@/components/features/teams/team-name-inputs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { Player } from "@/lib/db/schema";
import { isGuest, makeGuestPlayer } from "@/lib/guests";
import type { RecentSplit } from "@/lib/queries";
import {
  currentGeneratedRetaIdAtom,
  guestsAtom,
  resetTeamsOnEditAtom,
  selectedIdsAtom,
  teamCountAtom,
  teamNamesAtom,
} from "@/lib/state/atoms";
import {
  addToTeam,
  balanceTeamsVaried,
  lightestTeam,
  removeFromTeams,
  replacePlayer,
  swapPlayers,
  type BalancedTeams,
  type TeamSplit,
} from "@/lib/team-balancer";
import { MAX_TEAMS, TEAM_COLORS, teamName, type TeamKey } from "@/lib/teams";
import { useAtom, useSetAtom } from "jotai";
import { ScaleIcon, ShuffleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

const teamRows = (team: TeamSplit) =>
  team.lineups.map((l) => ({
    // Guests (negative id) aren't in the roster → null id + their name inline.
    playerId: isGuest(l.player) ? null : l.player.id,
    guestName: isGuest(l.player) ? l.player.name : undefined,
    team: team.key,
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
  const [names, setNames] = useAtom(teamNamesAtom);
  const [teamCount, setTeamCount] = useAtom(teamCountAtom);
  const [resetOnEdit, setResetOnEdit] = useAtom(resetTeamsOnEditAtom);
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

  // Nunca más equipos que convocados: cada equipo necesita al menos un jugador.
  const maxTeams = Math.max(2, Math.min(MAX_TEAMS, selectedPlayers.length));
  const effectiveCount = Math.min(teamCount, maxTeams);

  /**
   * Editar la convocatoria no tira el tablero: quien entra queda "por asignar"
   * y quien sale se retira de su equipo. Con "Reiniciar al editar" encendido
   * vuelve a repartir desde cero, como antes.
   */
  function afterEdit(mutate: (teams: BalancedTeams) => BalancedTeams) {
    setResult((r) => (r && !resetOnEdit ? mutate(r) : null));
  }

  function toggle(id: number) {
    const leaving = selected.includes(id);
    afterEdit((teams) => (leaving ? removeFromTeams(teams, id) : teams));
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function setName(index: number, value: string) {
    setNames((prev) => {
      const next = [...prev];
      while (next.length <= index) next.push("");
      next[index] = value;
      return next;
    });
  }

  function addGuest(input: GuestInput) {
    const guest = makeGuestPlayer(input, guests);
    setGuests((prev) => [...prev, guest]);
    setSelected((prev) => [...prev, guest.id]); // auto-convocar
    // Si el formulario ya trae equipo, entra directo; si no, queda por asignar.
    afterEdit((teams) =>
      input.team ? addToTeam(teams, guest, input.team) : teams,
    );
  }

  function editGuest(id: number, input: GuestInput) {
    // Rebuild the guest (recomputing stats from overall) but keep its id so it
    // stays selected and its board/live references don't break.
    const updated: Player = { ...makeGuestPlayer(input, guests), id };
    setGuests((prev) => prev.map((g) => (g.id === id ? updated : g)));
    // El tablero se queda: se refresca la ficha (nombre/OVR) y, si el select
    // cambió de equipo, se mueve — "Sin asignar" lo saca del tablero.
    afterEdit((teams) => {
      const synced = replacePlayer(teams, updated);
      return input.team
        ? addToTeam(synced, updated, input.team)
        : removeFromTeams(synced, id);
    });
  }

  function removeGuest(id: number) {
    afterEdit((teams) => removeFromTeams(teams, id));
    setGuests((prev) => prev.filter((g) => g.id !== id));
    setSelected((prev) => prev.filter((x) => x !== id));
  }

  function generate() {
    if (selectedPlayers.length < 2) return;

    const teams = balanceTeamsVaried(
      selectedPlayers,
      [...sessionSplits, ...recentSplits],
      effectiveCount,
    );
    setResult(teams);

    const sides = teams.teams.map((t) => t.lineups.map((l) => l.player.id));
    setSessionSplits((prev) => [{ sides }, ...prev].slice(0, 30));

    // Persist the generation (fire-and-forget) and remember its id for the live
    // flow. A failed save just leaves the matchup unlinked — non-blocking.
    setCurrentRetaId(null);
    startSave(async () => {
      const res = await saveGeneratedReta({
        teams: teams.teams.map((t) => ({
          key: t.key,
          name: teamName(names, t.key),
          rating: t.rating,
        })),
        diff: teams.diff,
        players: teams.teams.flatMap(teamRows),
      });
      if (res.ok) setCurrentRetaId(res.id);
    });
  }

  // Convocados que aún no están en ningún equipo del tablero actual.
  const assignedIds = new Set(
    result?.teams.flatMap((t) => t.lineups.map((l) => l.player.id)) ?? [],
  );
  const pending = result
    ? selectedPlayers.filter((p) => !assignedIds.has(p.id))
    : [];

  function assign(player: Player, key: TeamKey) {
    setResult((r) => (r ? addToTeam(r, player, key) : r));
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
        teamCount={effectiveCount}
        maxTeams={maxTeams}
        resetOnEdit={resetOnEdit}
        onResetOnEditChange={setResetOnEdit}
        onTeamCountChange={(n) => {
          setResult(null);
          setTeamCount(n);
        }}
        onToggleAll={toggleAll}
        onClear={clear}
        onGenerate={generate}
        generateDisabled={selectedPlayers.length < 2}
        onGoLive={() => router.push("/live")}
        onRegistro={() => router.push("/teams/registro")}
      />

      <Convocatoria
        players={allPlayers}
        selected={selected}
        onToggle={toggle}
        selectedCount={selectedPlayers.length}
      />

      <GuestManager
        guests={guests}
        // Con "Reiniciar al editar" encendido, cualquier cambio vuelve a
        // repartir: elegir equipo aquí no significaría nada, así que no se ofrece.
        teams={
          resetOnEdit
            ? []
            : (result?.teams.map((t) => ({
                key: t.key,
                name: teamName(names, t.key),
              })) ?? [])
        }
        teamOf={(id) =>
          result?.teams.find((t) => t.lineups.some((l) => l.player.id === id))
            ?.key ?? null
        }
        onAdd={addGuest}
        onEdit={editGuest}
        onRemove={removeGuest}
      />

      <TeamNameInputs count={effectiveCount} names={names} onChange={setName} />

      {result ? (
        <Matchup
          result={result}
          view={view}
          names={names}
          onViewChange={setView}
          hasResult={result !== null}
          // ponytail: swap edita solo el tablero en memoria; la reta ya guardada
          // en DB (y el flujo /live) no se re-persiste. Añadir re-save si importa.
          onSwap={(fromId, toId) =>
            setResult((r) => (r ? swapPlayers(r, fromId, toId) : r))
          }
        />
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ScaleIcon />
            </EmptyMedia>
            <EmptyTitle>Aún no hay equipos</EmptyTitle>
            <EmptyDescription>
              Convoca al menos 2 jugadores y genera {effectiveCount} equipos
              parejos.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {result && pending.length > 0 ? (
        <PendingAssignments
          pending={pending}
          teams={result.teams}
          names={names}
          onAssign={assign}
          onAuto={() =>
            setResult((r) =>
              pending.reduce(
                (acc, p) => addToTeam(acc, p, lightestTeam(acc)),
                r!,
              ),
            )
          }
        />
      ) : null}
    </div>
  );
}

/**
 * Quien llegó después de generar (invitado de última hora o alguien que se
 * convocó tarde) espera aquí hasta que se le asigne equipo — a mano o con
 * "Repartir", que lo manda al equipo con menos gente.
 */
function PendingAssignments({
  pending,
  teams,
  names,
  onAssign,
  onAuto,
}: {
  pending: Player[];
  teams: TeamSplit[];
  names: string[];
  onAssign: (player: Player, key: TeamKey) => void;
  onAuto: () => void;
}) {
  return (
    <Card size="sm" className="border-dashed">
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">
            Por asignar
            <span className="text-muted-foreground ml-1.5 text-xs font-normal">
              · {pending.length} sin equipo
            </span>
          </p>
          <Button variant="outline" onClick={onAuto}>
            <ShuffleIcon />
            Repartir
          </Button>
        </div>
        <ul className="space-y-2">
          {pending.map((player) => (
            <li
              key={player.id}
              className="flex flex-wrap items-center gap-2 text-sm"
            >
              <span className="min-w-0 flex-1 truncate font-medium">
                {player.name}
                <span className="text-muted-foreground ml-1.5 font-mono text-xs">
                  {player.overall}
                </span>
              </span>
              {teams.map((team) => (
                <Button
                  key={team.key}
                  variant="outline"
                  size="sm"
                  onClick={() => onAssign(player, team.key)}
                >
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full"
                    style={{ backgroundColor: TEAM_COLORS[team.key] }}
                  />
                  {teamName(names, team.key)}
                </Button>
              ))}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
