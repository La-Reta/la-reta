"use client";

import { createMatch } from "@/app/actions/matches";
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
import { Button } from "@/components/ui/button";
import { formatApiDate } from "@/lib/dates";
import { isGuest } from "@/lib/guests";
import { initialPairing, rotate } from "@/lib/live-rotation";
import {
  currentGeneratedRetaIdAtom,
  EMPTY_LIVE_MATCH,
  guestsAtom,
  liveMatchAtom,
  teamCountAtom,
  teamNamesAtom,
} from "@/lib/state/atoms";
import { TEAM_COLORS, teamKeys, teamName, type TeamKey } from "@/lib/teams";
import { useAtom, useAtomValue } from "jotai";
import { FlagIcon, PlayIcon, RepeatIcon, TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { GoalTimeline } from "./goal-timeline";
import {
  countGoalsFor,
  createGoalEvent,
  formatGoalClock,
  formatGoalMinute,
  getPlayerName,
  getScorersSummary,
  tallyGoalsByPlayer,
} from "./live-match-utils";
import { LiveScoreboard } from "./live-scoreboard";
import { ScorerPickerDrawer } from "./scorer-picker-drawer";
import { StartMatchForm } from "./start-match-form";
import type { LivePlayer } from "./types";
import { useHydrated } from "./use-hydrated";
import { useLiveMatchClock } from "./use-live-match-clock";

export function LiveMatch({ players }: { players: LivePlayer[] }) {
  const router = useRouter();
  const [live, setLive] = useAtom(liveMatchAtom);
  // Nombres y número de equipos se comparten con "armar equipos" (persistidos),
  // así que una reta generada allá llega aquí ya configurada.
  const [names, setNames] = useAtom(teamNamesAtom);
  const [teamCount, setTeamCount] = useAtom(teamCountAtom);
  const [generatedRetaId, setGeneratedRetaId] = useAtom(
    currentGeneratedRetaIdAtom,
  );
  const guests = useAtomValue(guestsAtom);
  const hydrated = useHydrated();
  const elapsedSec = useLiveMatchClock(live.active, live.startedAt);
  const [attrId, setAttrId] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState("");
  const deferredFilter = React.useDeferredValue(filter.trim().toLowerCase());
  const [pending, startTransition] = React.useTransition();

  // Roster + guests (última hora) share the scorer pool. Guests carry negative
  // ids; they're client-only until the match is finalized with their names.
  const pool = React.useMemo<LivePlayer[]>(
    () => [...players, ...guests.map((g) => ({ id: g.id, name: g.name }))],
    [players, guests],
  );

  const playersById = React.useMemo(
    () => new Map(pool.map((player) => [player.id, player.name])),
    [pool],
  );

  const sideOf = React.useCallback(
    (key: TeamKey) =>
      live.teams.find((t) => t.key === key) ?? { key, name: `Equipo ${key}` },
    [live.teams],
  );
  const home = sideOf(live.home);
  const away = sideOf(live.away);

  const scoreHome = countGoalsFor(live.goals, live.home);
  const scoreAway = countGoalsFor(live.goals, live.away);

  const scorersHome = getScorersSummary(live.goals, live.home, playersById);
  const scorersAway = getScorersSummary(live.goals, live.away, playersById);

  const filteredPlayers = React.useMemo(() => {
    if (!deferredFilter) return pool;
    return pool.filter((player) =>
      player.name.toLowerCase().includes(deferredFilter),
    );
  }, [pool, deferredFilter]);

  const attrGoal = live.goals.find((goal) => goal.id === attrId);
  const attrTeam = attrGoal ? sideOf(attrGoal.team).name : "";

  function setName(index: number, value: string) {
    setNames((prev) => {
      const next = [...prev];
      while (next.length <= index) next.push("");
      next[index] = value;
      return next;
    });
  }

  /** Intercambia los dos primeros equipos (quién arranca de local). */
  function swapTeams() {
    setNames((prev) => {
      const next = [...prev];
      while (next.length < 2) next.push("");
      [next[0], next[1]] = [next[1], next[0]];
      return next;
    });
  }

  function start() {
    const keys = teamKeys(teamCount);
    setLive({
      active: true,
      teams: keys.map((key) => ({ key, name: teamName(names, key) })),
      ...initialPairing(keys),
      startedAt: Date.now(),
      goals: [],
    });
  }

  function addGoal(team: TeamKey) {
    const goal = createGoalEvent(team, live.goals.length);
    setLive((state) => ({
      ...state,
      goals: [...state.goals, { ...goal, playerId: null }],
    }));
    setAttrId(goal.id);
    setFilter("");
  }

  function removeLast(team: TeamKey) {
    setLive((state) => {
      const lastIdx = [...state.goals]
        .map((goal, index) => ({ goal, index }))
        .reverse()
        .find(({ goal }) => goal.team === team)?.index;

      if (lastIdx == null) return state;

      return {
        ...state,
        goals: state.goals.filter((_, index) => index !== lastIdx),
      };
    });
  }

  function removeGoal(id: string) {
    setLive((state) => ({
      ...state,
      goals: state.goals.filter((goal) => goal.id !== id),
    }));
  }

  function attributeGoal(id: string, playerId: number | null) {
    setLive((state) => ({
      ...state,
      goals: state.goals.map((goal) =>
        goal.id === id ? { ...goal, playerId } : goal,
      ),
    }));
    setAttrId(null);
  }

  function discard() {
    setLive(EMPTY_LIVE_MATCH);
    setAttrId(null);
    setFilter("");
  }

  /** Guarda el partido actual en el registro. Devuelve si salió bien. */
  async function saveCurrent() {
    const durationSec = live.startedAt
      ? Math.floor((Date.now() - live.startedAt) / 1000)
      : null;
    // El partido siempre se guarda a dos lados: A = local, B = visitante.
    // `teamAKey`/`teamBKey` dicen qué equipos de la reta eran.
    const scorers = tallyGoalsByPlayer(live.goals).map((s) => {
      const team = s.team === live.home ? ("A" as const) : ("B" as const);
      return isGuest({ id: s.playerId })
        ? {
            playerId: null,
            guestName: playersById.get(s.playerId) ?? "Invitado",
            goals: s.goals,
            team,
          }
        : { playerId: s.playerId, goals: s.goals, team };
    });

    const res = await createMatch({
      playedAt: formatApiDate(live.startedAt ?? Date.now()),
      teamAName: home.name,
      teamBName: away.name,
      teamAKey: live.home,
      teamBKey: live.away,
      scoreA: scoreHome,
      scoreB: scoreAway,
      balance: 50,
      durationSec,
      notes: "",
      generatedRetaId,
      scorers,
    });

    if (!res.ok) toast.error(res.error);
    return res.ok;
  }

  function finalize() {
    startTransition(async () => {
      if (!(await saveCurrent())) return;
      toast.success("Partido finalizado y guardado en el registro");
      setLive(EMPTY_LIVE_MATCH);
      setGeneratedRetaId(null);
      router.push("/matches");
      router.refresh();
    });
  }

  /** Guarda el partido y arranca el siguiente de la rotación (gana y se queda). */
  function nextGame() {
    startTransition(async () => {
      if (!(await saveCurrent())) return;
      const next = rotate(
        { home: live.home, away: live.away, queue: live.queue },
        scoreHome,
        scoreAway,
      );
      setLive((state) => ({
        ...state,
        ...next,
        startedAt: Date.now(),
        goals: [],
      }));
      setAttrId(null);
      toast.success(
        `Guardado. Ahora: ${sideOf(next.home).name} vs ${sideOf(next.away).name}`,
      );
      router.refresh();
    });
  }

  if (!hydrated) {
    return (
      <div className="bg-muted/50 mx-auto h-80 max-w-3xl animate-pulse rounded-3xl" />
    );
  }

  if (!live.active) {
    return (
      <StartMatchForm
        count={teamCount}
        names={names}
        onCountChange={setTeamCount}
        onNameChange={setName}
        onSwapTeams={swapTeams}
        onStart={start}
      />
    );
  }

  const hasRotation = live.queue.length > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <LiveScoreboard
        home={home}
        away={away}
        scoreHome={scoreHome}
        scoreAway={scoreAway}
        elapsedSec={elapsedSec}
        scorersHome={scorersHome}
        scorersAway={scorersAway}
        queue={live.queue.map(sideOf)}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {[home, away].map((side) => {
          const score = side.key === live.home ? scoreHome : scoreAway;
          return (
            <Button
              key={side.key}
              className="h-24 flex-col gap-1 rounded-xl text-white shadow-sm transition-transform hover:brightness-110 active:scale-[0.99]"
              style={{ backgroundColor: TEAM_COLORS[side.key] }}
              onClick={() => addGoal(side.key)}
              aria-label={`Gol de ${side.name}`}
            >
              <PlayIcon className="size-5 rotate-90" />
              <span className="font-bold">Agregar gol</span>
              <span className="max-w-full truncate text-xs font-medium opacity-90">
                {side.name}
              </span>
              <span className="text-[11px] opacity-75">
                {score === 0
                  ? "Sin goles aún"
                  : `${score} gol${score === 1 ? "" : "es"}`}
              </span>
            </Button>
          );
        })}
      </div>

      <GoalTimeline
        goals={live.goals}
        home={home}
        away={away}
        getPlayerName={(id) => getPlayerName(playersById, id)}
        formatMinute={(at) => formatGoalMinute(at, live.startedAt)}
        formatClock={formatGoalClock}
        onAssign={setAttrId}
        onRemove={removeGoal}
        onRemoveLast={removeLast}
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        {hasRotation && (
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button size="lg" className="flex-1" disabled={pending}>
                  <RepeatIcon />
                  Guardar y siguiente
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cerrar este partido</AlertDialogTitle>
                <AlertDialogDescription>
                  {home.name} {scoreHome} - {scoreAway} {away.name}. Se guarda
                  en el registro y entra {sideOf(live.queue[0]).name}: gana y se
                  queda, empate y se va el local.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={pending}>
                  Seguir jugando
                </AlertDialogCancel>
                <AlertDialogAction onClick={nextGame} disabled={pending}>
                  {pending ? "Guardando..." : "Siguiente"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                size="lg"
                className="flex-1"
                variant={hasRotation ? "outline" : "default"}
                disabled={pending}
              >
                <FlagIcon />
                {hasRotation ? "Terminar la reta" : "Finalizar partido"}
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Finalizar y guardar</AlertDialogTitle>
              <AlertDialogDescription>
                {home.name} {scoreHome} - {scoreAway} {away.name}. Se guardará
                en el registro de partidos con duración y goleadores
                {hasRotation ? " y se cerrará la rotación." : "."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending}>
                Seguir jugando
              </AlertDialogCancel>
              <AlertDialogAction onClick={finalize} disabled={pending}>
                {pending ? "Guardando..." : "Finalizar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="destructive"
                className="sm:w-auto"
                disabled={pending}
                size={"lg"}
              >
                <TrashIcon />
                Descartar
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Descartar partido en vivo</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminará el marcador actual y no se guardará nada en el
                registro.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={discard} disabled={pending}>
                Descartar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <ScorerPickerDrawer
        open={attrId != null}
        attrTeam={attrTeam}
        filter={filter}
        players={filteredPlayers}
        onFilterChange={setFilter}
        onOpenChange={(open) => {
          if (!open) setAttrId(null);
        }}
        onSelectAnonymous={() => {
          if (attrId) attributeGoal(attrId, null);
        }}
        onSelectPlayer={(playerId) => {
          if (attrId) attributeGoal(attrId, playerId);
        }}
      />
    </div>
  );
}
