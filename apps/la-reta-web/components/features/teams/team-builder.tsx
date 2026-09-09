"use client";

import { saveGeneratedReta } from "@/app/actions/retas";
import { BuilderBar } from "@/components/features/teams/builder-bar";
import type { MatchupView } from "@/components/features/teams/constants";
import type { GuestInput } from "@/components/features/teams/guest-dialog";
import { Matchup } from "@/components/features/teams/matchup";
import { RosterPicker } from "@/components/features/teams/roster-picker";
import { TeamNameInputs } from "@/components/features/teams/team-name-inputs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  type BalancedTeams,
  lightestTeam,
  removeFromTeams,
  replacePlayer,
  swapPlayers,
  type TeamSplit,
} from "@/lib/team-balancer";
import { MAX_TEAMS, TEAM_COLORS, teamName, type TeamKey } from "@/lib/teams";
import { useAtom, useSetAtom } from "jotai";
import { ShuffleIcon, UsersRoundIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

/** Default estable: un `[]` en la firma es un array nuevo en cada render. */
const NO_SPLITS: RecentSplit[] = [];

const teamRows = (team: TeamSplit) =>
  team.lineups.map((l) => ({
    // Guests (negative id) aren't in the roster → null id + their name inline.
    playerId: isGuest(l.player) ? null : l.player.id,
    guestName: isGuest(l.player) ? l.player.name : undefined,
    team: team.key,
    role: l.role,
    overall: l.player.overall,
  }));

/**
 * "Armar equipos", en el orden en que se hace de verdad.
 *
 * El montaje anterior iba: barra de controles → convocatoria → invitados →
 * nombres de equipo → resultado. Elegir gente pasaba en el segundo bloque,
 * generar en el primero y ver el resultado en el quinto, así que armar una reta
 * era subir y bajar la página. Ahora hay dos zonas y una barra:
 *
 *  1. La **barra** (pegajosa) lleva lo que se toca a cada rato y no se va nunca.
 *  2. El **resultado**, cuando existe, va arriba del todo — es a lo que se ha
 *     venido— y la convocatoria se pliega sola al generar.
 *  3. La **convocatoria**, debajo, a un toque de volver a abrirse.
 */
export const TeamBuilder = ({
  players,
  recentSplits = NO_SPLITS,
}: {
  readonly players: Player[];
  readonly recentSplits?: RecentSplit[];
}) => {
  const router = useRouter();
  const [selected, setSelected] = useAtom(selectedIdsAtom);
  const [guests, setGuests] = useAtom(guestsAtom);
  const [result, setResult] = React.useState<BalancedTeams | null>(null);
  const [view, setView] = React.useState<MatchupView>("board");
  const [names, setNames] = useAtom(teamNamesAtom);
  const [teamCount, setTeamCount] = useAtom(teamCountAtom);
  const [resetOnEdit, setResetOnEdit] = useAtom(resetTeamsOnEditAtom);
  const setCurrentRetaId = useSetAtom(currentGeneratedRetaIdAtom);
  // Los atoms viven en localStorage, que en el servidor no existe: sin esta
  // compuerta el primer render del cliente no coincide con el del servidor.

  const [mounted, setMounted] = React.useState(false);
  const [rosterOpen, setRosterOpen] = React.useState(true);
  const resultRef = React.useRef<HTMLDivElement>(null);
  // Splits generated this session, so consecutive regenerations vary even
  // before the server round-trip lands. Es una `ref` y no estado porque nadie
  // lo pinta: solo lo lee `generate()`, y como estado forzaba un render de
  // toda la vista por cada reparto sin cambiar un pixel.
  const sessionSplits = React.useRef<RecentSplit[]>([]);
  const [, startSave] = React.useTransition();
  // Los atoms viven en localStorage, que en el servidor no existe: sin esta
  // compuerta el primer render del cliente no coincide con el del servidor y
  // React tira la hidratación. El render de más es el precio.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-doctor/no-initialize-state -- ver arriba
  React.useEffect(() => setMounted(true), []);

  // Roster + guests share the pool; guests carry negative ids.
  // Los dos `useMemo` se quedan: el React Compiler no está activado en
  // `next.config.ts`, así que sin ellos `allPlayers`/`byId` serían objetos
  // nuevos en cada render y arrastrarían a todo lo que dependa de ellos.
  // eslint-disable-next-line react-doctor/react-compiler-no-manual-memoization -- ver arriba
  const allPlayers = React.useMemo(
    () => [...players, ...guests],
    [players, guests]
  );
  // eslint-disable-next-line react-doctor/react-compiler-no-manual-memoization -- ver el comentario de allPlayers
  const byId = React.useMemo(
    () => new Map(allPlayers.map((p) => [p.id, p])),
    [allPlayers]
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
   * vuelve a repartir desde cero.
   */
  function afterEdit(mutate: (teams: BalancedTeams) => BalancedTeams) {
    setResult((r) => (r && !resetOnEdit ? mutate(r) : null));
  }

  function toggle(id: number) {
    const leaving = selected.includes(id);
    afterEdit((teams) => (leaving ? removeFromTeams(teams, id) : teams));
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  /** Una línea entera de una vez, desde el atajo "Todos" de cada sección. */
  function toggleMany(ids: number[], next: boolean) {
    const set = new Set(ids);
    if (!next) {
      afterEdit((teams) =>
        ids.reduce((acc, id) => removeFromTeams(acc, id), teams)
      );
    }
    setSelected((prev) => {
      if (!next) return prev.filter((id) => !set.has(id));
      const already = new Set(prev);
      return [...prev, ...ids.filter((id) => !already.has(id))];
    });
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
    // Sin tablero no hay dónde meterlo; con tablero queda "por asignar", que es
    // justo la lista de abajo.
    afterEdit((teams) => teams);
  }

  function editGuest(id: number, input: GuestInput) {
    // Rebuild the guest (recomputing stats from overall) but keep its id so it
    // stays selected and its board/live references don't break.
    const updated: Player = { ...makeGuestPlayer(input, guests), id };
    setGuests((prev) => prev.map((g) => (g.id === id ? updated : g)));
    afterEdit((teams) => replacePlayer(teams, updated));
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
      [...sessionSplits.current, ...recentSplits],
      effectiveCount
    );
    setResult(teams);
    // La convocatoria se pliega y el resultado queda arriba: es a lo que se ha
    // venido, y así no hay que buscarlo pasando veinte fichas.
    setRosterOpen(false);
    requestAnimationFrame(() =>
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );

    const sides = teams.teams.map((t) => t.lineups.map((l) => l.player.id));
    sessionSplits.current = [{ sides }, ...sessionSplits.current].slice(0, 30);

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
    result?.teams.flatMap((t) => t.lineups.map((l) => l.player.id)) ?? []
  );
  const pending = result
    ? selectedPlayers.filter((p) => !assignedIds.has(p.id))
    : [];

  function assign(player: Player, key: TeamKey) {
    setResult((r) => (r ? addToTeam(r, player, key) : r));
  }

  function clear() {
    setSelected([]);
    setResult(null);
  }

  if (!mounted) {
    return <div className="bg-muted/50 h-64 animate-pulse rounded-xl" />;
  }

  return (
    // `pb-24` en móvil: la barra de acción va fija al borde inferior y sin este
    // hueco la última tarjeta se queda debajo de ella.
    <div className="space-y-6 pb-24 md:pb-0">
      <BuilderBar
        canGenerate={selectedPlayers.length >= 2}
        hasResult={result !== null}
        maxTeams={maxTeams}
        onGenerate={generate}
        onGoLive={() => router.push("/live")}
        onRegistro={() => router.push("/teams/registro")}
        onResetOnEditChange={setResetOnEdit}
        onTeamCountChange={(n) => {
          setResult(null);
          setTeamCount(n);
        }}
        resetOnEdit={resetOnEdit}
        selectedCount={selectedPlayers.length}
        teamCount={effectiveCount}
      />

      {result ? (
        <div className="scroll-mt-32 space-y-4" ref={resultRef}>
          <Matchup
            hasResult
            names={names}
            onSwap={(fromId, toId) =>
              setResult((r) => (r ? swapPlayers(r, fromId, toId) : r))
            }
            onViewChange={setView}
            result={result}
            view={view}
          />

          {pending.length > 0 ? (
            <PendingAssignments
              names={names}
              onAssign={assign}
              onAuto={() =>
                setResult((r) =>
                  r
                    ? pending.reduce(
                        (acc, p) => addToTeam(acc, p, lightestTeam(acc)),
                        r
                      )
                    : r
                )
              }
              pending={pending}
              teams={result.teams}
            />
          ) : null}

          {/* Los nombres viven con el resultado: antes se pedían antes de
              generar, cuando todavía no había ningún equipo que nombrar. */}
          <TeamNameInputs
            count={effectiveCount}
            names={names}
            onChange={setName}
          />
        </div>
      ) : (
        <EmptyBoard
          count={effectiveCount}
          ready={selectedPlayers.length >= 2}
        />
      )}

      <RosterPicker
        guests={guests}
        onAddGuest={addGuest}
        onClear={clear}
        onEditGuest={editGuest}
        onOpenChange={setRosterOpen}
        onRemoveGuest={removeGuest}
        onToggle={toggle}
        onToggleMany={toggleMany}
        open={rosterOpen}
        players={allPlayers}
        selected={selected}
      />
    </div>
  );
};

/**
 * El hueco donde va a salir el tablero. No es un cartel de error: dice
 * exactamente qué falta para llenarlo, que es lo único que hace falta leer aquí.
 */
const EmptyBoard = ({
  ready,
  count,
}: {
  readonly ready: boolean;
  readonly count: number;
}) => {
  return (
    <div className="border-border/70 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center">
      <span className="bg-muted text-muted-foreground grid size-12 place-items-center rounded-2xl">
        <UsersRoundIcon className="size-6" />
      </span>
      <div>
        <p className="font-display text-lg font-bold tracking-wide uppercase">
          Aquí saldrán los equipos
        </p>
        <p className="text-muted-foreground mt-1 text-sm text-balance">
          {ready
            ? `Ya puedes repartir a los convocados en ${count} equipos parejos.`
            : "Convoca al menos a dos jugadores en la lista de abajo."}
        </p>
      </div>
    </div>
  );
};

/**
 * Quien llegó después de generar (invitado de última hora o alguien que se
 * convocó tarde) espera aquí hasta que se le asigne equipo — a mano o con
 * "Repartir", que lo manda al equipo con menos gente.
 */
const PendingAssignments = ({
  pending,
  teams,
  names,
  onAssign,
  onAuto,
}: {
  readonly pending: Player[];
  readonly teams: TeamSplit[];
  readonly names: string[];
  readonly onAssign: (player: Player, key: TeamKey) => void;
  readonly onAuto: () => void;
}) => {
  return (
    <Card className="border-dashed border-amber-500/40" size="sm">
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">
            Por asignar
            <span className="text-muted-foreground ml-1.5 text-xs font-normal">
              · {pending.length} sin equipo
            </span>
          </p>
          <Button onClick={onAuto} size="sm" variant="outline">
            <ShuffleIcon />
            Repartir
          </Button>
        </div>
        <ul className="space-y-2">
          {pending.map((player) => (
            <li
              className="flex flex-wrap items-center gap-2 text-sm"
              key={player.id}
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
                  onClick={() => onAssign(player, team.key)}
                  size="sm"
                  variant="outline"
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
};
