import { Pitch } from "@/components/shared/pitch";
import {
  GROUP_COLOR,
  GROUP_LABEL,
  POSITION_NAME,
  type Position,
  positionGroup,
} from "@/lib/constants";
import type { Player } from "@/lib/db/schema";
import { playerPositions } from "@/lib/format";

/**
 * La cancha a la izquierda y la leyenda a la derecha: son como mucho dos
 * posiciones, así que apiladas debajo del SVG dejaban media tarjeta en blanco
 * y obligaban a bajar la vista para leer lo que el marcador ya señalaba.
 */
export const PlayerPositions = ({ player }: { readonly player: Player }) => {
  const spots: { position: Position; role: string }[] = [
    { position: player.position, role: "Principal" },
  ];
  if (player.position2) {
    spots.push({ position: player.position2, role: "Secundaria" });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,17rem)] lg:gap-0">
      <div className="min-w-0 lg:pr-6">
        <Pitch highlight={playerPositions(player)} />
      </div>

      <ul className="lg:border-border min-w-0 space-y-3 lg:border-l lg:pl-6">
        {spots.map(({ position, role }) => {
          const group = positionGroup(position);
          return (
            <li
              className="bg-muted/30 hover:bg-muted/60 relative overflow-hidden rounded-lg border p-3 transition-colors"
              key={position}
            >
              <div className="flex items-center gap-3">
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-full font-mono text-xs font-black text-white"
                  style={{ backgroundColor: GROUP_COLOR[group] }}
                >
                  {position}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {POSITION_NAME[position]}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {role} · {GROUP_LABEL[group]}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
        {player.position2 ? null : (
          <li className="text-muted-foreground rounded-lg border border-dashed p-3 text-xs">
            Sin posición secundaria registrada.
          </li>
        )}
      </ul>
    </div>
  );
};
