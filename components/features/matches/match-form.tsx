"use client";

import { createMatch, updateMatch } from "@/app/actions/matches";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Slider } from "@/components/ui/slider";
import { formatApiDate } from "@/lib/dates";
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
  scorers: {
    playerId: number | null;
    guestName?: string | null;
    goals: number;
    team?: string | null;
  }[];
};

type ScorerRow = { playerId: string; team: string; goals: string };
type MatchTeam = "A" | "B";

function subscribe() {
  return () => {};
}

function parseNumberInput(value: string) {
  if (!value.trim()) return Number.NaN;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function parseTeam(value: string): MatchTeam | null {
  return value === "A" || value === "B" ? value : null;
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
  admin,
}: {
  players: MatchPlayer[];
  match?: EditMatch;
  admin: boolean;
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
  // Se edita en minutos; en la BD viven segundos. Re-guardar una duración del
  // marcador en vivo la redondea al minuto (drift < 60s, aceptable).
  const [durationMin, setDurationMin] = React.useState(
    match?.durationSec != null
      ? String(Math.round(match.durationSec / 60))
      : "",
  );
  const [scorers, setScorers] = React.useState<ScorerRow[]>(
    match?.scorers
      .filter((s) => s.playerId != null)
      .map((s) => ({
        playerId: String(s.playerId),
        team: s.team ?? "",
        goals: String(s.goals),
      })) ?? [],
  );
  // Guest scorers aren't editable via the roster picker; kept as-is and
  // re-submitted so an edit never deletes their goals.
  const [guestScorers] = React.useState(
    () =>
      match?.scorers
        .filter((s) => s.playerId == null)
        .map((s) => ({
          guestName: s.guestName ?? "Invitado",
          team: s.team ?? "",
          goals: s.goals,
        })) ?? [],
  );

  function addScorer() {
    if (scorers.length >= 22) {
      toast.error("No puedes agregar más de 22 participantes");
      return;
    }
    if (scorers.length >= players.length) {
      toast.error("Ya agregaste a todos los jugadores");
      return;
    }
    setScorers((s) => [...s, { playerId: "", team: "A", goals: "1" }]);
  }
  function updateScorer(i: number, patch: Partial<ScorerRow>) {
    setScorers((s) =>
      s.map((row, idx) => (idx === i ? { ...row, ...patch } : row)),
    );
  }
  function removeScorer(i: number) {
    setScorers((s) => s.filter((_, idx) => idx !== i));
  }

  const takenPlayerIds = new Set(
    scorers.map((s) => s.playerId).filter(Boolean),
  );

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
        durationSec: durationMin.trim()
          ? Math.round(parseNumberInput(durationMin) * 60) || null
          : null,
        notes,
        scorers: [
          ...scorers
            .filter((s) => s.playerId)
            .map((s) => ({
              playerId: Number(s.playerId),
              team: parseTeam(s.team),
              goals: parseNumberInput(s.goals),
            })),
          // Preserve guest goals through the edit (roster picker can't hold them).
          ...guestScorers.map((g) => ({
            playerId: null,
            guestName: g.guestName,
            team: parseTeam(g.team),
            goals: g.goals,
          })),
        ],
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
    <form onSubmit={onSubmit}>
      <Card>
        <CardContent className="space-y-4">
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

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="mb-1.5 block text-xs">Fecha</Label>
              <Input
                type="date"
                value={playedAt || (!isEdit ? today : "")}
                onChange={(e) => setPlayedAt(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Duración (min)</Label>
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                placeholder="Ej. 60"
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
              <span className="flex items-center gap-1 text-xs font-medium">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={balance}
                  onChange={(e) =>
                    setBalance(
                      Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                    )
                  }
                  className="h-6 w-14 px-1.5 py-0 text-center font-mono font-bold tabular-nums"
                />
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

          {/* Participantes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">
                Jugadores (goles y asistencia)
                {scorers.length > 0 ? (
                  <span className="text-muted-foreground ml-1 font-normal">
                    · {scorers.length}
                  </span>
                ) : null}
              </Label>
              <Button
                type="button"
                variant="outline"
                onClick={addScorer}
                disabled={!admin}
              >
                <PlusIcon />
                Añadir
              </Button>
            </div>
            {scorers.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                Agrega a quienes jugaron y asígnalos a un equipo. Deja los goles
                en 0 para registrar solo su asistencia.
              </p>
            ) : (
              <div className="space-y-1.5">
                <div className="text-muted-foreground hidden grid-cols-[1.5rem_1fr_9rem_3.5rem_auto] items-center gap-2 text-[10px] font-semibold tracking-wide uppercase sm:grid">
                  <span className="text-center">#</span>
                  <span>Jugador</span>
                  <span>Equipo</span>
                  <span className="text-center">Goles</span>
                  <span className="sr-only">Quitar</span>
                </div>
                {scorers.map((row, i) => {
                  // Hide players already chosen in other rows; keep this row's pick.
                  const available = players.filter(
                    (p) =>
                      String(p.id) === row.playerId ||
                      !takenPlayerIds.has(String(p.id)),
                  );
                  return (
                    <div
                      key={i}
                      className="grid items-center gap-2 sm:grid-cols-[1.5rem_1fr_9rem_3.5rem_auto]"
                    >
                      <span className="text-muted-foreground text-center text-xs font-medium tabular-nums">
                        {i + 1}
                      </span>
                      <NativeSelect
                        className="w-full"
                        value={row.playerId}
                        onChange={(e) =>
                          updateScorer(i, { playerId: e.target.value })
                        }
                      >
                        <NativeSelectOption value="">
                          — jugador —
                        </NativeSelectOption>
                        {available.map((p) => (
                          <NativeSelectOption key={p.id} value={String(p.id)}>
                            {p.name}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                      <NativeSelect
                        className="w-full"
                        value={row.team}
                        onChange={(e) =>
                          updateScorer(i, { team: e.target.value })
                        }
                        aria-label="Equipo"
                      >
                        <NativeSelectOption value="">
                          Sin equipo
                        </NativeSelectOption>
                        <NativeSelectOption value="A">
                          {teamAName}
                        </NativeSelectOption>
                        <NativeSelectOption value="B">
                          {teamBName}
                        </NativeSelectOption>
                      </NativeSelect>
                      <Input
                        type="number"
                        min={0}
                        value={row.goals}
                        onChange={(e) =>
                          updateScorer(i, { goals: e.target.value })
                        }
                        className="w-full text-center"
                        aria-label="Goles"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeScorer(i)}
                        aria-label="Quitar"
                      >
                        <XIcon />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {guestScorers.length > 0 ? (
              <div className="text-muted-foreground space-y-1 pt-1 text-xs">
                <p className="font-medium">
                  Invitados (se conservan, no editables aquí)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {guestScorers.map((g, i) => (
                    <Badge key={i} variant="secondary">
                      {g.guestName}
                      {g.team
                        ? ` · ${g.team === "A" ? teamAName : teamBName}`
                        : ""}
                      {" · "}
                      {g.goals} gol{g.goals === 1 ? "" : "es"}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2 lg:justify-end">
            {admin && (
              <Button type="submit" disabled={pending}>
                {isEdit ? <SaveIcon /> : <TrophyIcon />}
                {pending
                  ? "Guardando…"
                  : isEdit
                    ? "Guardar cambios"
                    : "Registrar partido"}
              </Button>
            )}
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
        </CardContent>
      </Card>
    </form>
  );
}
