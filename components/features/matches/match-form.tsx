"use client";

import { createMatch, updateMatch } from "@/app/actions/matches";
import { formatApiDate } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Slider } from "@/components/ui/slider";
import { PlusIcon, SaveIcon, TrophyIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

export type MatchPlayer = { id: number; name: string };

export type EditMatch = {
  id: number;
  playedAt: string;
  teamAName: string;
  teamBName: string;
  scoreA: number;
  scoreB: number;
  balance: number;
  durationSec: number | null;
  notes: string | null;
  scorers: { playerId: number; goals: number }[];
};

type ScorerRow = { playerId: string; goals: string };

function subscribe() {
  return () => {};
}

function parseNumberInput(value: string) {
  if (!value.trim()) return Number.NaN;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function useTodayDate() {
  return React.useSyncExternalStore(
    subscribe,
    () => formatApiDate(),
    () => "",
  );
}

function balanceLabel(v: number) {
  if (v >= 80) return "Parejísimo ⚖️";
  if (v >= 60) return "Equilibrado";
  if (v >= 40) return "Algo disparejo";
  if (v >= 20) return "Disparejo";
  return "Paliza 😬";
}

export function MatchForm({
  players,
  match,
}: {
  players: MatchPlayer[];
  match?: EditMatch;
}) {
  const router = useRouter();
  const isEdit = Boolean(match);
  const [pending, startTransition] = React.useTransition();
  const today = useTodayDate();

  const [playedAt, setPlayedAt] = React.useState(match?.playedAt ?? "");
  const [teamAName, setTeamAName] = React.useState(
    match?.teamAName ?? "Equipo A",
  );
  const [teamBName, setTeamBName] = React.useState(
    match?.teamBName ?? "Equipo B",
  );
  const [scoreA, setScoreA] = React.useState(String(match?.scoreA ?? 0));
  const [scoreB, setScoreB] = React.useState(String(match?.scoreB ?? 0));
  const [balance, setBalance] = React.useState(match?.balance ?? 50);
  const [notes, setNotes] = React.useState(match?.notes ?? "");
  const [scorers, setScorers] = React.useState<ScorerRow[]>(
    match?.scorers.map((s) => ({
      playerId: String(s.playerId),
      goals: String(s.goals),
    })) ?? [],
  );

  function addScorer() {
    setScorers((s) => [...s, { playerId: "", goals: "1" }]);
  }
  function updateScorer(i: number, patch: Partial<ScorerRow>) {
    setScorers((s) =>
      s.map((row, idx) => (idx === i ? { ...row, ...patch } : row)),
    );
  }
  function removeScorer(i: number) {
    setScorers((s) => s.filter((_, idx) => idx !== i));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const input = {
        playedAt: playedAt || (!isEdit ? today : ""),
        teamAName,
        teamBName,
        scoreA: parseNumberInput(scoreA),
        scoreB: parseNumberInput(scoreB),
        balance,
        durationSec: match?.durationSec ?? null,
        notes,
        scorers: scorers
          .filter((s) => s.playerId)
          .map((s) => ({
            playerId: Number(s.playerId),
            goals: parseNumberInput(s.goals),
          })),
      };
      const res = isEdit
        ? await updateMatch(match!.id, input)
        : await createMatch(input);
      if (res.ok) {
        toast.success(isEdit ? "Partido actualizado" : "Partido registrado");
        if (isEdit) {
          router.push("/matches");
          router.refresh();
        } else {
          setScoreA("0");
          setScoreB("0");
          setBalance(50);
          setNotes("");
          setScorers([]);
          router.refresh();
        }
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-card ring-foreground/10 space-y-4 rounded-lg p-4 ring-1"
    >
      {/* Marcador */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <div>
          <Label className="mb-1.5 block text-xs">Equipo local</Label>
          <Input
            value={teamAName}
            onChange={(e) => setTeamAName(e.target.value)}
          />
        </div>
        <div className="col-span-2 flex items-end justify-center gap-2 sm:col-span-1">
          <Input
            type="number"
            min={0}
            value={scoreA}
            onChange={(e) => setScoreA(e.target.value)}
            className="w-16 text-center text-lg font-bold"
          />
          <span className="text-muted-foreground pb-2">–</span>
          <Input
            type="number"
            min={0}
            value={scoreB}
            onChange={(e) => setScoreB(e.target.value)}
            className="w-16 text-center text-lg font-bold"
          />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">Equipo visitante</Label>
          <Input
            value={teamBName}
            onChange={(e) => setTeamBName(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 block text-xs">Fecha</Label>
          <Input
            type="date"
            value={playedAt || (!isEdit ? today : "")}
            onChange={(e) => setPlayedAt(e.target.value)}
          />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">Notas (opcional)</Label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Partidazo, lluvia, etc."
          />
        </div>
      </div>

      {/* Balance */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <Label className="text-xs">¿Qué tan balanceado estuvo?</Label>
          <span className="text-xs font-medium">
            <span className="font-mono font-bold tabular-nums">{balance}</span>
            /100 · {balanceLabel(balance)}
          </span>
        </div>
        <Slider
          min={0}
          max={100}
          value={balance}
          onValueChange={(v) =>
            setBalance(Array.isArray(v) ? v[0] : (v as number))
          }
        />
      </div>

      {/* Goleadores */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Goleadores (opcional)</Label>
          <Button type="button" variant="outline" onClick={addScorer}>
            <PlusIcon />
            Añadir
          </Button>
        </div>
        {scorers.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            Si sabes quién anotó, agrégalo para llevar la tabla de goleadores.
          </p>
        ) : (
          <div className="space-y-2">
            {scorers.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <NativeSelect
                  className="flex-1"
                  value={row.playerId}
                  onChange={(e) =>
                    updateScorer(i, { playerId: e.target.value })
                  }
                >
                  <NativeSelectOption value="">— jugador —</NativeSelectOption>
                  {players.map((p) => (
                    <NativeSelectOption key={p.id} value={String(p.id)}>
                      {p.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <Input
                  type="number"
                  min={0}
                  value={row.goals}
                  onChange={(e) => updateScorer(i, { goals: e.target.value })}
                  className="w-16 text-center"
                  aria-label="Goles"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  onClick={() => removeScorer(i)}
                  aria-label="Quitar"
                >
                  <XIcon />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 lg:justify-end">
        <Button type="submit" disabled={pending}>
          {isEdit ? <SaveIcon /> : <TrophyIcon />}
          {pending
            ? "Guardando…"
            : isEdit
              ? "Guardar cambios"
              : "Registrar partido"}
        </Button>
        {isEdit && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            disabled={pending}
          >
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
