"use client";

import { createMatch, updateMatch } from "@/app/actions/matches";
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
import { matchPrefillAtom } from "@/lib/state/atoms";
import { useAtom } from "jotai";
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
    assists?: number;
    team?: string | null;
  }[];
};

type ScorerRow = {
  playerId: string;
  team: string;
  goals: string;
  assists: string;
};
type GuestRow = {
  guestName: string;
  team: string;
  goals: string;
  assists: string;
};
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
        assists: String(s.assists ?? 0),
      })) ?? [],
  );
  // Guests aren't in the roster picker, so they get their own editable rows
  // (name/team/goals/asistencias) — a guest who didn't show up can be edited or removed.
  const [guestScorers, setGuestScorers] = React.useState<GuestRow[]>(
    () =>
      match?.scorers
        .filter((s) => s.playerId == null)
        .map((s) => ({
          guestName: s.guestName ?? "Invitado",
          team: s.team ?? "",
          goals: String(s.goals),
          assists: String(s.assists ?? 0),
        })) ?? [],
  );
  // Set when the form was prefilled from a generated reta, so the created match
  // links back to it (like the live flow).
  const [generatedRetaId, setGeneratedRetaId] = React.useState<number | null>(
    null,
  );
  // Qué equipos de esa reta son el lado A y el lado B (solo con 3+ equipos).
  const [retaKeys, setRetaKeys] = React.useState<{
    a: string | null;
    b: string | null;
  }>({ a: null, b: null });

  // Prefill (create only) from a reta handed off by /teams/registro. Read once
  // on mount, apply, and clear the atom — nothing is submitted automatically.
  const [prefill, setPrefill] = useAtom(matchPrefillAtom);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => {
    if (isEdit || !prefill) return;
    setTeamAName(prefill.teamAName || "Equipo A");
    setTeamBName(prefill.teamBName || "Equipo B");
    if (prefill.playedAt) setPlayedAt(prefill.playedAt);
    setGeneratedRetaId(prefill.generatedRetaId ?? null);
    setRetaKeys({ a: prefill.teamAKey ?? null, b: prefill.teamBKey ?? null });
    setScorers(
      prefill.scorers
        .filter((s) => s.playerId != null)
        .map((s) => ({
          playerId: String(s.playerId),
          team: s.team ?? "",
          goals: String(s.goals),
          assists: "0",
        })),
    );
    setGuestScorers(
      prefill.scorers
        .filter((s) => s.playerId == null)
        .map((s) => ({
          guestName: s.guestName ?? "Invitado",
          team: s.team ?? "",
          goals: String(s.goals),
          assists: "0",
        })),
    );
    setPrefill(null);
    toast.success("Reta cargada. Ajusta los detalles y registra el partido.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Goles de un equipo = jugadores con jugador elegido + invitados de ese equipo.
  // ponytail: no cubre goles en propia; el marcador sigue siendo editable a mano.
  function teamGoals(rows: ScorerRow[], guests: GuestRow[], team: MatchTeam) {
    const roster = rows
      .filter((r) => r.playerId && r.team === team)
      .reduce((n, r) => n + (parseNumberInput(r.goals) || 0), 0);
    const guest = guests
      .filter((g) => g.team === team)
      .reduce((n, g) => n + (parseNumberInput(g.goals) || 0), 0);
    return roster + guest;
  }
  // Refleja los goles asignados en el marcador general. Se llama solo cuando el
  // usuario edita participantes, no al montar/editar (para no pisar el marcador
  // cargado de un partido existente).
  function syncScoreboard(rows: ScorerRow[], guests: GuestRow[]) {
    setScoreA(String(teamGoals(rows, guests, "A")));
    setScoreB(String(teamGoals(rows, guests, "B")));
  }

  function addScorer() {
    if (scorers.length >= 22) {
      toast.error("No puedes agregar más de 22 participantes");
      return;
    }
    if (scorers.length >= players.length) {
      toast.error("Ya agregaste a todos los jugadores");
      return;
    }
    // Fila nueva sin jugador aún → no altera el marcador todavía.
    setScorers((s) => [
      ...s,
      { playerId: "", team: "A", goals: "1", assists: "0" },
    ]);
  }
  function updateScorer(i: number, patch: Partial<ScorerRow>) {
    const next = scorers.map((row, idx) =>
      idx === i ? { ...row, ...patch } : row,
    );
    setScorers(next);
    syncScoreboard(next, guestScorers);
  }
  function removeScorer(i: number) {
    const next = scorers.filter((_, idx) => idx !== i);
    setScorers(next);
    syncScoreboard(next, guestScorers);
  }

  function addGuest() {
    setGuestScorers((g) => [
      ...g,
      { guestName: "", team: "A", goals: "0", assists: "0" },
    ]);
  }
  function updateGuest(i: number, patch: Partial<GuestRow>) {
    const next = guestScorers.map((row, idx) =>
      idx === i ? { ...row, ...patch } : row,
    );
    setGuestScorers(next);
    syncScoreboard(scorers, next);
  }
  function removeGuest(i: number) {
    const next = guestScorers.filter((_, idx) => idx !== i);
    setGuestScorers(next);
    syncScoreboard(scorers, next);
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
        generatedRetaId,
        teamAKey: retaKeys.a,
        teamBKey: retaKeys.b,
        scorers: [
          ...scorers
            .filter((s) => s.playerId)
            .map((s) => ({
              playerId: Number(s.playerId),
              team: parseTeam(s.team),
              goals: parseNumberInput(s.goals),
              assists: parseNumberInput(s.assists),
            })),
          // Guests carry their own editable name/team/goals/asistencias; drop blanks.
          ...guestScorers
            .filter((g) => g.guestName.trim())
            .map((g) => ({
              playerId: null,
              guestName: g.guestName.trim(),
              team: parseTeam(g.team),
              goals: parseNumberInput(g.goals),
              assists: parseNumberInput(g.assists),
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
          setGuestScorers([]);
          setGeneratedRetaId(null);
          setRetaKeys({ a: null, b: null });
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
          <p className="text-muted-foreground text-center text-xs">
            El marcador suma los goles que asignes a los jugadores. Ajústalo a
            mano si hubo goles en propia.
          </p>

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
                Jugadores (goles y asistencias)
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
                Agrega a quienes jugaron y asígnalos a un equipo. Deja goles y
                asistencias en 0 para registrar solo su presencia.
              </p>
            ) : (
              <div className="space-y-1.5">
                <div className="text-muted-foreground hidden grid-cols-[1.5rem_1fr_9rem_3.5rem_3.5rem_2.25rem] items-center gap-2 text-[10px] font-semibold tracking-wide uppercase sm:grid">
                  <span className="text-center">#</span>
                  <span>Jugador</span>
                  <span>Equipo</span>
                  <span className="text-center">Goles</span>
                  <span className="text-center">Asist.</span>
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
                      className="grid items-center gap-2 sm:grid-cols-[1.5rem_1fr_9rem_3.5rem_3.5rem_2.25rem]"
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
                      <Input
                        type="number"
                        min={0}
                        value={row.assists}
                        onChange={(e) =>
                          updateScorer(i, { assists: e.target.value })
                        }
                        className="w-full text-center"
                        aria-label="Asistencias"
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

            {/* Invitados: fuera de la plantilla, con sus propias filas editables. */}
            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">
                  Invitados
                  {guestScorers.length > 0 ? (
                    <span className="text-muted-foreground ml-1 font-normal">
                      · {guestScorers.length}
                    </span>
                  ) : null}
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addGuest}
                  disabled={!admin}
                >
                  <PlusIcon />
                  Añadir invitado
                </Button>
              </div>
              {guestScorers.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                  Jugadores de última hora que no están en la plantilla. Edita
                  su nombre, equipo, goles o asistencias; quítalos si al final
                  no jugaron.
                </p>
              ) : (
                <div className="space-y-1.5">
                  <div className="text-muted-foreground hidden grid-cols-[1fr_9rem_3.5rem_3.5rem_2.25rem] items-center gap-2 text-[10px] font-semibold tracking-wide uppercase sm:grid">
                    <span>Invitado</span>
                    <span>Equipo</span>
                    <span className="text-center">Goles</span>
                    <span className="text-center">Asist.</span>
                    <span className="sr-only">Quitar</span>
                  </div>
                  {guestScorers.map((g, i) => (
                    <div
                      key={i}
                      className="grid items-center gap-2 sm:grid-cols-[1fr_9rem_3.5rem_3.5rem_2.25rem]"
                    >
                      <Input
                        value={g.guestName}
                        onChange={(e) =>
                          updateGuest(i, { guestName: e.target.value })
                        }
                        placeholder="Nombre del invitado"
                        maxLength={60}
                        aria-label="Nombre del invitado"
                      />
                      <NativeSelect
                        className="w-full"
                        value={g.team}
                        onChange={(e) =>
                          updateGuest(i, { team: e.target.value })
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
                        value={g.goals}
                        onChange={(e) =>
                          updateGuest(i, { goals: e.target.value })
                        }
                        className="w-full text-center"
                        aria-label="Goles"
                      />
                      <Input
                        type="number"
                        min={0}
                        value={g.assists}
                        onChange={(e) =>
                          updateGuest(i, { assists: e.target.value })
                        }
                        className="w-full text-center"
                        aria-label="Asistencias"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeGuest(i)}
                        aria-label="Quitar invitado"
                      >
                        <XIcon />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 lg:justify-end">
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
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
