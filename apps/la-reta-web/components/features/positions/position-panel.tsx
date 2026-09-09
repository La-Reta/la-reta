"use client";

import { Crossfade } from "@/components/motion/crossfade";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group";
import {
  GROUP_COLOR,
  GROUP_LABEL,
  POSITION_NAME,
  type Position,
  type PositionGroup,
  positionGroup,
} from "@/lib/constants";
import { flagEmoji } from "@/lib/format";
import type { LineInsight, RankedPlayer } from "@/lib/positions-insights";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { CSSProperties } from "react";
import * as React from "react";

const LINES: readonly PositionGroup[] = ["GK", "DEF", "MID", "FWD"];

/** Cuántos caben sin que la lista se coma la pantalla del teléfono. */
const LIST_SIZE = 6;

/**
 * El panel que acompaña a la cancha.
 *
 * Sin nada elegido cuenta la forma de la plantilla —dónde hay fondo y dónde se
 * juega con lo puesto—; con una posición elegida, quién la juega y, sobre todo,
 * **cómo rendiría cualquiera ahí**. Eso último es el motivo de la vista: el
 * overall ya se calcula con los pesos de la línea, así que la respuesta a "¿y
 * si pongo a mi delantero de central?" es un dato que ya existe, no una
 * corazonada.
 */
export const PositionPanel = ({
  selected,
  byPosition,
  lines,
}: {
  readonly selected: Position | null;
  readonly byPosition: Readonly<Record<Position, readonly RankedPlayer[]>>;
  readonly lines: Readonly<Record<PositionGroup, LineInsight>>;
}) => {
  return (
    <Crossfade
      aria-live="polite"
      className="@container"
      motionKey={selected ?? "resumen"}
    >
      {selected ? (
        <PositionDetail
          line={lines[positionGroup(selected)]}
          players={byPosition[selected]}
          position={selected}
        />
      ) : (
        <SquadShape lines={lines} />
      )}
    </Crossfade>
  );
};

/** Estado de reposo: en qué línea tienes fondo y en cuál vas justo. */
const SquadShape = ({
  lines,
}: {
  readonly lines: Readonly<Record<PositionGroup, LineInsight>>;
}) => {
  return (
    <section className="space-y-3">
      <header>
        <h2 className="font-display text-lg font-bold tracking-wide uppercase">
          La forma de tu reta
        </h2>
        <p className="text-muted-foreground text-sm text-balance">
          Toca una posición en la cancha para ver quién la juega y quién podría.
        </p>
      </header>
      <StaggerGroup className="space-y-2">
        {LINES.map((line) => (
          <StaggerItem key={line}>
            <LineRow insight={lines[line]} line={line} />
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
};

const LineRow = ({
  line,
  insight,
}: {
  readonly line: PositionGroup;
  readonly insight: LineInsight;
}) => {
  const best = insight.ranking[0];
  return (
    <div
      className="ring-foreground/10 flex items-center gap-3 rounded-lg px-3 py-2.5 ring-1"
      style={{ "--line": GROUP_COLOR[line] } as CSSProperties}
    >
      <span
        aria-hidden="true"
        className="h-8 w-1 shrink-0 rounded-full bg-[var(--line)]"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{GROUP_LABEL[line]}</p>
        <p className="text-muted-foreground truncate text-xs">
          {insight.count === 0
            ? "sin nadie"
            : `${insight.count} ${insight.count === 1 ? "jugador" : "jugadores"}`}
          {best ? ` · manda ${best.displayName}` : ""}
        </p>
      </div>
      <span className="font-mono text-xl font-bold tabular-nums">
        {/* Sin conteo animado: el muelle de `CountUp` se pasa de rosca a
          propósito —es el "pop" FIFA— y en una media eso significa enseñar un
          45 donde el dato es 44. Un número que no existe, aunque sea medio
          segundo, no lo arregla ninguna animación. El relevo ya lo anima el
          `Crossfade` de arriba. */}
        {insight.average ?? "—"}
      </span>
    </div>
  );
};

/** Una posición elegida: sus números y su gente. */
const PositionDetail = ({
  position,
  players,
  line,
}: {
  readonly position: Position;
  readonly players: readonly RankedPlayer[];
  readonly line: LineInsight;
}) => {
  const group = positionGroup(position);
  // El interruptor es el juguete de la vista: la misma lista, con la plantilla
  // entera o solo con quien de verdad juega ahí.
  const [showAll, setShowAll] = React.useState(false);
  const list = (showAll ? line.ranking : players).slice(0, LIST_SIZE);

  return (
    <section
      className="space-y-4"
      style={{ "--line": GROUP_COLOR[group] } as CSSProperties}
    >
      <header className="flex items-baseline gap-2.5">
        <span className="font-display text-3xl leading-none font-bold text-[var(--line)]">
          {position}
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">
            {POSITION_NAME[position]}
          </h2>
          <p className="text-muted-foreground text-xs">{GROUP_LABEL[group]}</p>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <StatTile label="La juegan" value={players.length} />
        <StatTile label="Media de la línea" value={line.average} />
        <StatTile label="Mejor registro" value={line.ranking[0]?.rating} />
      </div>

      <div className="flex gap-1.5">
        <Choice onClick={() => setShowAll(false)} pressed={!showAll}>
          La juegan ({players.length})
        </Choice>
        <Choice onClick={() => setShowAll(true)} pressed={showAll}>
          Toda la plantilla
        </Choice>
      </div>

      <Crossfade motionKey={showAll ? "todos" : "suyos"}>
        {list.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-xs">
            Nadie tiene esta posición. Prueba con «Toda la plantilla»: el
            overall se recalcula con los pesos de {GROUP_LABEL[group]}.
          </p>
        ) : (
          <StaggerGroup as="ol" className="space-y-0.5">
            {list.map((player, index) => (
              <StaggerItem as="li" key={player.id}>
                <RankRow index={index} player={player} showDelta={showAll} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </Crossfade>
    </section>
  );
};

const StatTile = ({
  label,
  value,
}: {
  readonly label: string;
  readonly value: number | null | undefined;
}) => {
  return (
    <div className="bg-muted/40 rounded-lg px-2.5 py-2">
      <p className="font-mono text-xl leading-none font-bold tabular-nums">
        {value ?? "—"}
      </p>
      <p className="text-muted-foreground mt-1 text-xs leading-tight">
        {label}
      </p>
    </div>
  );
};

const Choice = ({
  pressed,
  onClick,
  children,
}: {
  readonly pressed: boolean;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}) => {
  return (
    <button
      aria-pressed={pressed}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
        pressed
          ? "bg-[var(--line)] text-white"
          : "bg-muted text-muted-foreground hover:text-foreground"
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
};

/**
 * Un renglón del ranking.
 *
 * La diferencia contra su overall de siempre solo se enseña en modo «toda la
 * plantilla» y solo a quien no juega ahí: para el resto sería un cero, porque
 * es su propia línea y el número es exactamente el mismo.
 */
const RankRow = ({
  player,
  index,
  showDelta,
}: {
  readonly player: RankedPlayer;
  readonly index: number;
  readonly showDelta: boolean;
}) => {
  const delta = player.rating - player.own;
  const hypothetical = showDelta && !player.plays;

  return (
    <Link
      className="hover:bg-muted/60 focus-visible:ring-ring flex items-baseline gap-2 rounded-md px-2 py-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
      href={`/players/${player.id}`}
      transitionTypes={["nav-forward"]}
    >
      <span className="text-muted-foreground w-4 font-mono text-xs tabular-nums">
        {index + 1}
      </span>
      <span aria-hidden="true">{flagEmoji(player.nationality)}</span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm",
          hypothetical ? "text-muted-foreground" : "font-medium"
        )}
      >
        {player.displayName}
      </span>
      {hypothetical ? (
        <span
          className={cn(
            "font-mono text-xs tabular-nums",
            delta >= 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-muted-foreground"
          )}
        >
          {delta >= 0 ? "+" : ""}
          {delta}
        </span>
      ) : null}
      <span className="w-7 text-right font-mono text-sm font-bold tabular-nums">
        {player.rating}
      </span>
    </Link>
  );
};
