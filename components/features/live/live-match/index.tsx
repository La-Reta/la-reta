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
import {
  EMPTY_LIVE_MATCH,
  liveMatchAtom,
  teamNameAAtom,
  teamNameBAtom,
} from "@/lib/state/atoms";
import { useAtom } from "jotai";
import { FlagIcon, PlayIcon } from "lucide-react";
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
  // Team names are shared with the "armar equipos" flow (persisted), so a
  // matchup generated there lands here prefilled.
  const [nameA, setNameA] = useAtom(teamNameAAtom);
  const [nameB, setNameB] = useAtom(teamNameBAtom);
  const hydrated = useHydrated();
  const elapsedSec = useLiveMatchClock(live.active, live.startedAt);
  const [attrId, setAttrId] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState("");
  const deferredFilter = React.useDeferredValue(filter.trim().toLowerCase());
  const [pending, startTransition] = React.useTransition();

  const playersById = React.useMemo(
    () => new Map(players.map((player) => [player.id, player.name])),
    [players],
  );

  const scoreA = countGoalsFor(live.goals, "A");
  const scoreB = countGoalsFor(live.goals, "B");

  const scorersA = getScorersSummary(live.goals, "A", playersById);
  const scorersB = getScorersSummary(live.goals, "B", playersById);

  const filteredPlayers = React.useMemo(() => {
    if (!deferredFilter) return players;
    return players.filter((player) =>
      player.name.toLowerCase().includes(deferredFilter),
    );
  }, [players, deferredFilter]);

  const attrGoal = live.goals.find((goal) => goal.id === attrId);
  const attrTeam = attrGoal
    ? attrGoal.team === "A"
      ? live.teamA
      : live.teamB
    : "";

  function swapTeams() {
    setNameA(nameB);
    setNameB(nameA);
  }

  function start() {
    setLive({
      active: true,
      teamA: nameA.trim() || "Equipo A",
      teamB: nameB.trim() || "Equipo B",
      startedAt: Date.now(),
      goals: [],
    });
  }

  function addGoal(team: "A" | "B") {
    const goal = createGoalEvent(team, live.goals.length);
    setLive((state) => ({
      ...state,
      goals: [...state.goals, { ...goal, playerId: null }],
    }));
    setAttrId(goal.id);
    setFilter("");
  }

  function removeLast(team: "A" | "B") {
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

  function finalize() {
    startTransition(async () => {
      const durationSec = live.startedAt
        ? Math.floor((Date.now() - live.startedAt) / 1000)
        : null;
      const res = await createMatch({
        playedAt: formatApiDate(live.startedAt ?? Date.now()),
        teamAName: live.teamA,
        teamBName: live.teamB,
        scoreA,
        scoreB,
        balance: 50,
        durationSec,
        notes: "",
        scorers: tallyGoalsByPlayer(live.goals),
      });

      if (res.ok) {
        toast.success("Partido finalizado y guardado en el registro");
        setLive(EMPTY_LIVE_MATCH);
        router.push("/matches");
        router.refresh();
        return;
      }

      toast.error(res.error);
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
        teamA={nameA}
        teamB={nameB}
        onTeamAChange={setNameA}
        onTeamBChange={setNameB}
        onSwapTeams={swapTeams}
        onStart={start}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <LiveScoreboard
        teamA={live.teamA}
        teamB={live.teamB}
        scoreA={scoreA}
        scoreB={scoreB}
        elapsedSec={elapsedSec}
        scorersA={scorersA}
        scorersB={scorersB}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {(["A", "B"] as const).map((team) => {
          const name = team === "A" ? live.teamA : live.teamB;
          const score = team === "A" ? scoreA : scoreB;

          return (
            <Button
              key={team}
              className={
                team === "A"
                  ? "h-24 flex-col gap-1 rounded-2xl bg-sky-600 text-white shadow-sm transition-transform hover:bg-sky-700 active:scale-[0.99] dark:bg-sky-500 dark:hover:bg-sky-400"
                  : "h-24 flex-col gap-1 rounded-2xl bg-rose-600 text-white shadow-sm transition-transform hover:bg-rose-700 active:scale-[0.99] dark:bg-rose-500 dark:hover:bg-rose-400"
              }
              onClick={() => addGoal(team)}
              aria-label={`Gol de ${name}`}
            >
              <PlayIcon className="size-5 rotate-90" />
              <span className="font-bold">Agregar gol</span>
              <span className="max-w-full truncate text-xs font-medium opacity-90">
                {name}
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
        teamA={live.teamA}
        teamB={live.teamB}
        getPlayerName={(id) => getPlayerName(playersById, id)}
        formatMinute={(at) => formatGoalMinute(at, live.startedAt)}
        formatClock={formatGoalClock}
        onAssign={setAttrId}
        onRemove={removeGoal}
        onRemoveLast={removeLast}
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button size="lg" className="flex-1" disabled={pending}>
                <FlagIcon />
                Finalizar partido
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Finalizar y guardar</AlertDialogTitle>
              <AlertDialogDescription>
                {live.teamA} {scoreA} - {scoreB} {live.teamB}. Se guardará en el
                registro de partidos con duración y goleadores.
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
                variant="secondary"
                className="sm:w-auto"
                disabled={pending}
              >
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
