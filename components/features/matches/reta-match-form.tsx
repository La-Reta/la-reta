"use client";

import { createMatch } from "@/app/actions/matches";
import type { MatchPlayer } from "@/components/features/matches/match-form";
import type { RetaToMatchItem } from "@/components/features/teams/registro/reta-to-match-list";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { formatApiDate } from "@/lib/dates";
import {
  DEFAULT_TEAM_COUNT,
  defaultTeamName,
  MAX_TEAMS,
  TEAM_COLORS,
  teamKeys,
  type TeamKey,
} from "@/lib/teams";
import { LayersIcon, PlusIcon, SaveIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

/** Un participante de un equipo: del roster (`playerId`) o invitado. */
type Row = {
  /** `p:<id>` para roster, `g:<nombre>` para invitado. */
  key: string;
  playerId: number | null;
  name: string;
  goals: string;
  assists: string;
};

type Team = { key: TeamKey; name: string; score: string; players: Row[] };

const num = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
};

const rosterRow = (playerId: number, name: string): Row => ({
  key: `p:${playerId}`,
  playerId,
  name,
  goals: "0",
  assists: "0",
});

const guestRow = (name: string): Row => ({
  key: `g:${name.toLowerCase()}`,
  playerId: null,
  name,
  goals: "0",
  assists: "0",
});

/** Equipos vacíos para captura manual. */
function blankTeams(count: number): Team[] {
  return teamKeys(count).map((key) => ({
    key,
    name: defaultTeamName(key),
    score: "0",
    players: [],
  }));
}

/** Equipos prellenados con lo que trae una reta generada. */
function teamsFromReta(reta: RetaToMatchItem): Team[] {
  return reta.teams.map((team) => ({
    key: team.key,
    name: team.name,
    score: "0",
    players: reta.players
      .filter((p) => p.team === team.key)
      .map((p) =>
        p.playerId != null
          ? rosterRow(p.playerId, p.name)
          : guestRow(p.guestName ?? p.name),
      ),
  }));
}

/**
 * Registra una reta como un solo partido con su marcador de N equipos (2 … 6).
 * Se puede armar de cero o prellenar desde una reta generada y ajustar: agregar
 * jugadores que no salieron en la generación, sumar invitados de última hora,
 * quitar a quien no llegó y cambiar nombres, equipos y marcador.
 */
export function RetaMatchForm({
  retas,
  players,
}: {
  retas: RetaToMatchItem[];
  players: MatchPlayer[];
}) {
  const router = useRouter();
  const [retaId, setRetaId] = React.useState("");
  const [playedAt, setPlayedAt] = React.useState("");
  const [teams, setTeams] = React.useState<Team[]>(() =>
    blankTeams(DEFAULT_TEAM_COUNT),
  );
  const [durationMin, setDurationMin] = React.useState("");
  const [balance, setBalance] = React.useState(50);
  const [notes, setNotes] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const playersById = React.useMemo(
    () => new Map(players.map((p) => [p.id, p.name])),
    [players],
  );
  function pickReta(value: string) {
    setRetaId(value);
    const reta = retas.find((r) => String(r.id) === value);
    setTeams(reta ? teamsFromReta(reta) : blankTeams(DEFAULT_TEAM_COUNT));
    setPlayedAt(reta?.playedAt ?? "");
  }

  function patchTeam(index: number, patch: Partial<Team>) {
    setTeams((prev) =>
      prev.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    );
  }

  /** Cambia el número de equipos conservando los que ya están capturados. */
  function setTeamCount(count: number) {
    setTeams((prev) => {
      const keys = teamKeys(count);
      return keys.map(
        (key, i) =>
          prev[i] ?? {
            key,
            name: defaultTeamName(key),
            score: "0",
            players: [],
          },
      );
    });
  }

  function addRow(index: number, row: Row) {
    setTeams((prev) =>
      prev.map((t, i) =>
        i === index && !t.players.some((p) => p.key === row.key)
          ? { ...t, players: [...t.players, row] }
          : t,
      ),
    );
  }

  function removeRow(index: number, key: string) {
    setTeams((prev) =>
      prev.map((t, i) =>
        i === index
          ? {
              ...t,
              players: t.players.filter((p) => p.key !== key),
              score: String(
                t.players
                  .filter((p) => p.key !== key)
                  .reduce((n, p) => n + num(p.goals), 0),
              ),
            }
          : t,
      ),
    );
  }

  /** Escribe goles/asistencias y refleja el marcador del equipo. */
  function setStat(index: number, key: string, patch: Partial<Row>) {
    setTeams((prev) =>
      prev.map((team, i) => {
        if (i !== index) return team;
        const rows = team.players.map((p) =>
          p.key === key ? { ...p, ...patch } : p,
        );
        return {
          ...team,
          players: rows,
          score:
            patch.goals !== undefined
              ? String(rows.reduce((n, p) => n + num(p.goals), 0))
              : team.score,
        };
      }),
    );
  }

  function submit() {
    const payload = teams.map((t, i) => ({
      key: t.key,
      name: t.name.trim() || defaultTeamName(t.key),
      score: num(t.score),
      index: i,
    }));

    startTransition(async () => {
      const res = await createMatch({
        playedAt: playedAt || formatApiDate(),
        teamAName: payload[0].name,
        teamBName: payload[1].name,
        teamAKey: payload[0].key,
        teamBKey: payload[1].key,
        // Con 2 equipos manda el par de siempre; con 3+ el marcador va en `teams`.
        teams: payload.map(({ key, name, score }) => ({ key, name, score })),
        scoreA: payload[0].score,
        scoreB: payload[1].score,
        balance,
        durationSec: durationMin.trim() ? num(durationMin) * 60 || null : null,
        notes,
        generatedRetaId: retaId ? Number(retaId) : null,
        // Asistencia completa: quien no anotó queda en 0, con su equipo.
        scorers: teams.flatMap((team) =>
          team.players.map((p) => ({
            playerId: p.playerId,
            guestName: p.playerId == null ? p.name : undefined,
            team: team.key,
            goals: num(p.goals),
            assists: num(p.assists),
          })),
        ),
      });

      if (res.ok) {
        toast.success("Reta registrada en el historial");
        setRetaId("");
        setTeams(blankTeams(DEFAULT_TEAM_COUNT));
        setPlayedAt("");
        setDurationMin("");
        setBalance(50);
        setNotes("");
        router.refresh();
        return;
      }
      toast.error(res.error);
    });
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="bg-primary/10 text-primary grid size-7 place-items-center rounded-lg">
            <LayersIcon className="size-4" />
          </span>
          Registrar una reta
        </CardTitle>
        <CardDescription>
          Ármala a mano o parte de una reta generada y ajústala: puedes agregar
          jugadores que no salieron en la generación, sumar invitados y quitar a
          quien no llegó.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
          <div>
            <Label className="mb-1.5 block text-xs">
              Partir de una reta generada (opcional)
            </Label>
            <NativeSelect
              className="w-full"
              value={retaId}
              onChange={(e) => pickReta(e.target.value)}
            >
              <NativeSelectOption value="">— armar a mano —</NativeSelectOption>
              {retas.map((r) => (
                <NativeSelectOption key={r.id} value={String(r.id)}>
                  {r.dateLabel} · {r.teams.length} equipos · {r.players.length}{" "}
                  jugadores · {r.teams.map((t) => t.name).join(" / ")}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs">Equipos</Label>
            <NativeSelect
              value={String(teams.length)}
              onChange={(e) => setTeamCount(Number(e.target.value))}
            >
              {Array.from({ length: MAX_TEAMS - 1 }, (_, i) => i + 2).map(
                (n) => (
                  <NativeSelectOption key={n} value={String(n)}>
                    {n}
                  </NativeSelectOption>
                ),
              )}
            </NativeSelect>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs">Fecha</Label>
            <Input
              type="date"
              value={playedAt}
              onChange={(e) => setPlayedAt(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {teams.map((team, i) => (
            <TeamCard
              key={team.key}
              team={team}
              players={players}
              playersById={playersById}
              onPatch={(patch) => patchTeam(i, patch)}
              onAdd={(row) => addRow(i, row)}
              onRemove={(key) => removeRow(i, key)}
              onStat={(key, patch) => setStat(i, key, patch)}
            />
          ))}
        </div>

        {/* Detalles opcionales del partido. */}
        <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
          <div>
            <Label className="mb-1.5 block text-xs">Duración (min)</Label>
            <Input
              type="number"
              min={0}
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
              placeholder="60"
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs">Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Cómo estuvo la reta…"
              rows={2}
            />
          </div>
        </div>

        <div>
          <Label className="mb-1.5 block text-xs">
            Qué tan pareja estuvo · {balance}
          </Label>
          <Slider
            min={0}
            max={100}
            value={balance}
            onValueChange={(v) =>
              setBalance(Array.isArray(v) ? v[0] : (v as number))
            }
          />
        </div>

        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={pending}
          onClick={submit}
        >
          <SaveIcon />
          {pending ? "Guardando…" : "Registrar la reta"}
        </Button>
      </CardContent>
    </Card>
  );
}

function TeamCard({
  team,
  players,
  playersById,
  onPatch,
  onAdd,
  onRemove,
  onStat,
}: {
  team: Team;
  players: MatchPlayer[];
  playersById: Map<number, string>;
  onPatch: (patch: Partial<Team>) => void;
  onAdd: (row: Row) => void;
  onRemove: (key: string) => void;
  onStat: (key: string, patch: Partial<Row>) => void;
}) {
  const [guestName, setGuestName] = React.useState("");
  const color = TEAM_COLORS[team.key];
  // El filtro es por equipo, no global: alguien pudo jugar en varias retas del
  // día y aparecer en más de un equipo. Aquí solo se evita repetirlo dentro del
  // mismo equipo — sus goles se guardan por separado en cada uno.
  const available = players.filter(
    (p) => !team.players.some((row) => row.playerId === p.id),
  );

  function addGuest() {
    const name = guestName.trim().slice(0, 60);
    if (!name) return;
    onAdd(guestRow(name));
    setGuestName("");
  }

  return (
    <div className="space-y-3 rounded-xl border p-3">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <Input
          value={team.name}
          onChange={(e) => onPatch({ name: e.target.value })}
          placeholder={defaultTeamName(team.key)}
          maxLength={24}
          aria-label={`Nombre del ${defaultTeamName(team.key)}`}
          className="h-9 min-w-0 flex-1 font-semibold"
        />
        <Input
          type="number"
          min={0}
          value={team.score}
          onChange={(e) => onPatch({ score: e.target.value })}
          className="h-9 w-16 text-center text-lg font-bold"
          aria-label={`Goles de ${team.name}`}
        />
      </div>

      {team.players.length > 0 ? (
        <>
          <div className="text-muted-foreground grid grid-cols-[1fr_3rem_3rem_2rem] gap-2 text-[10px] font-semibold tracking-wide uppercase">
            <span />
            <span className="text-center">Goles</span>
            <span className="text-center">Asist.</span>
            <span />
          </div>
          {team.players.map((p) => (
            <div
              key={p.key}
              className="grid grid-cols-[1fr_3rem_3rem_2rem] items-center gap-2"
            >
              <span className="min-w-0 truncate text-sm">
                {p.playerId != null
                  ? (playersById.get(p.playerId) ?? p.name)
                  : p.name}
                {p.playerId == null && (
                  <span className="text-muted-foreground text-[10px]">
                    {" "}
                    · invitado
                  </span>
                )}
              </span>
              <Input
                type="number"
                min={0}
                value={p.goals}
                onChange={(e) => onStat(p.key, { goals: e.target.value })}
                className="h-8 px-1 text-center"
                aria-label={`Goles de ${p.name}`}
              />
              <Input
                type="number"
                min={0}
                value={p.assists}
                onChange={(e) => onStat(p.key, { assists: e.target.value })}
                className="h-8 px-1 text-center"
                aria-label={`Asistencias de ${p.name}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Quitar a ${p.name}`}
                onClick={() => onRemove(p.key)}
              >
                <XIcon />
              </Button>
            </div>
          ))}
        </>
      ) : (
        <p className="text-muted-foreground text-xs">
          Sin jugadores todavía. Agrégalos abajo.
        </p>
      )}

      {/* Altas: roster (los que ya están en otro equipo no aparecen) e invitados. */}
      <div className="space-y-2 border-t pt-3">
        <NativeSelect
          className="w-full"
          value=""
          disabled={available.length === 0}
          onChange={(e) => {
            const id = Number(e.target.value);
            if (id) onAdd(rosterRow(id, playersById.get(id) ?? "Jugador"));
          }}
        >
          <NativeSelectOption value="">
            {available.length === 0
              ? "Ya agregaste a todos"
              : "+ Agregar jugador…"}
          </NativeSelectOption>
          {available.map((p) => (
            <NativeSelectOption key={p.id} value={String(p.id)}>
              {p.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <div className="flex gap-2">
          <Input
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addGuest();
              }
            }}
            placeholder="Invitado de última hora"
            maxLength={60}
            className="h-9"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Agregar invitado"
            disabled={!guestName.trim()}
            onClick={addGuest}
          >
            <PlusIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
