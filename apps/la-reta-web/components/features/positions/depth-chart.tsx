import {
  GROUP_COLOR,
  GROUP_LABEL,
  POSITIONS,
  POSITION_NAME,
  positionGroup,
  type Position,
  type PositionGroup,
} from "@/lib/constants";
import type { Player } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import Link from "next/link";

/**
 * Carril lateral de cada posición. El fútbol tiene geometría — una lista la
 * tira; el cuadro la conserva, así que se lee como una formación.
 */
type Lane = "left" | "center" | "right";
const LANE: Record<Position, Lane> = {
  GK: "center",
  LB: "left",
  LWB: "left",
  CB: "center",
  RB: "right",
  RWB: "right",
  LM: "left",
  CDM: "center",
  CM: "center",
  CAM: "center",
  RM: "right",
  LW: "left",
  CF: "center",
  ST: "center",
  RW: "right",
};
const LANES: Lane[] = ["left", "center", "right"];
const LANE_LABEL: Record<Lane, string> = {
  left: "Izquierda",
  center: "Centro",
  right: "Derecha",
};
/** De arriba (ataque) hacia abajo (portería), como se dibuja una alineación. */
const LINES: PositionGroup[] = ["FWD", "MID", "DEF", "GK"];

/**
 * Cuadro de profundidad: por cada posición, quién la juega hoy — el de mayor
 * overall arriba como titular, el resto colgando debajo — y, sobre todo, qué
 * posiciones están descubiertas.
 */
export function DepthChart({
  byPosition,
}: {
  byPosition: Record<Position, Player[]>;
}) {
  const squad = new Set(
    POSITIONS.flatMap((p) => byPosition[p].map((x) => x.id)),
  );
  const uncovered = POSITIONS.filter((p) => byPosition[p].length === 0).length;

  return (
    <section className="ring-foreground/10 bg-card overflow-hidden rounded-xl ring-1">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 border-b px-5 py-4">
        <h2 className="font-display text-xl font-bold tracking-wide uppercase">
          Plantilla por posición
        </h2>
        <p className="text-muted-foreground text-xs">
          <span className="text-foreground font-mono font-bold tabular-nums">
            {squad.size}
          </span>{" "}
          jugadores ·{" "}
          <span
            className={cn(
              "font-mono font-bold tabular-nums",
              uncovered > 0 && "text-foreground",
            )}
          >
            {uncovered}
          </span>{" "}
          {uncovered === 1 ? "posición sin cubrir" : "posiciones sin cubrir"}
        </p>
      </header>

      {/* Encabezado de carriles: una vez, no repetido por línea. */}
      <div className="text-muted-foreground hidden grid-cols-3 gap-x-6 border-b px-5 py-1.5 text-[10px] tracking-[0.2em] uppercase md:grid">
        {LANES.map((lane) => (
          <span key={lane}>{LANE_LABEL[lane]}</span>
        ))}
      </div>

      <div className="divide-border divide-y">
        {LINES.map((line) => {
          const color = GROUP_COLOR[line];
          const inLine = POSITIONS.filter((p) => positionGroup(p) === line);
          const count = new Set(
            inLine.flatMap((p) => byPosition[p].map((x) => x.id)),
          ).size;

          return (
            <div key={line} className="px-5 py-4">
              <div className="mb-3 flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <h3
                  className="font-display text-xs font-bold tracking-[0.22em] uppercase"
                  style={{ color }}
                >
                  {GROUP_LABEL[line]}
                </h3>
                <span className="bg-border h-px flex-1" />
                <span className="text-muted-foreground font-mono text-xs tabular-nums">
                  {count}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-3">
                {LANES.map((lane) => {
                  const slots = inLine.filter((p) => LANE[p] === lane);
                  // El carril vacío solo existe para sostener la columna en
                  // desktop; en móvil (una sola columna) sería un hueco de más.
                  if (slots.length === 0)
                    return <div key={lane} className="hidden md:block" />;
                  return (
                    <div key={lane} className="space-y-4">
                      {slots.map((pos) => (
                        <Slot
                          key={pos}
                          position={pos}
                          players={byPosition[pos]}
                          color={color}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Una posición y su fondo: titular arriba, suplentes colgando. */
function Slot({
  position,
  players,
  color,
}: {
  position: Position;
  players: Player[];
  color: string;
}) {
  // El cuadro de profundidad se lee de arriba abajo: primero quien más rinde.
  const depth = [...players].sort((a, b) => b.overall - a.overall);
  const empty = depth.length === 0;

  return (
    <div
      className="min-w-0"
      // El color de la línea viaja como variable para que el hover pueda teñir
      // el renglón sin duplicar la paleta en clases.
      style={
        {
          "--pos": color,
          "--pos-soft": `${color}1f`,
          "--pos-ring": `${color}66`,
        } as React.CSSProperties
      }
    >
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "font-display text-2xl leading-none font-bold tracking-tight",
            empty ? "text-muted-foreground/40" : "text-[var(--pos)]",
          )}
        >
          {position}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "mb-1 h-px flex-1",
            empty
              ? "border-muted-foreground/25 border-t border-dashed"
              : "bg-[var(--pos-soft)]",
          )}
        />
      </div>
      {/* El nombre completo va a la vista, no escondido en un title: en móvil
          no hay hover y esta página es justamente la referencia de posiciones. */}
      <p
        className={cn(
          "mt-0.5 truncate text-[10px] tracking-wide",
          empty ? "text-muted-foreground/50" : "text-muted-foreground",
        )}
      >
        {POSITION_NAME[position]}
      </p>

      {empty ? (
        <p className="text-muted-foreground/60 mt-1.5 text-[11px] tracking-wide">
          sin cubrir
        </p>
      ) : (
        <ul className="mt-2 space-y-0.5 border-l border-[var(--pos-soft)] pl-2">
          {depth.map((player, i) => (
            <li key={player.id}>
              <Link
                href={`/players/${player.id}`}
                className="group -mx-1.5 flex items-baseline gap-2 rounded-md px-1.5 py-1 transition-colors outline-none hover:bg-[var(--pos-soft)] focus-visible:bg-[var(--pos-soft)] focus-visible:ring-2 focus-visible:ring-[var(--pos-ring)]"
              >
                <span
                  className={cn(
                    "group-hover:text-foreground group-focus-visible:text-foreground min-w-0 flex-1 truncate transition-colors",
                    i === 0
                      ? "font-display text-sm font-semibold tracking-wide uppercase"
                      : "text-muted-foreground text-xs",
                  )}
                >
                  {player.displayName}
                </span>
                <span
                  className={cn(
                    "shrink-0 font-mono text-[11px] tabular-nums transition-colors",
                    i === 0
                      ? "font-bold"
                      : "text-muted-foreground group-hover:text-foreground group-focus-visible:text-foreground",
                  )}
                >
                  {player.overall}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
