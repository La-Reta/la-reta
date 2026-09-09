"use client";

import { PositionMap } from "@/components/features/positions/position-map";
import { PositionPanel } from "@/components/features/positions/position-panel";
import { GROUP_COLOR, GROUP_LABEL, type Position } from "@/lib/constants";
import type { PositionsOverview } from "@/lib/positions-insights";
import * as React from "react";

const LEGEND = ["GK", "DEF", "MID", "FWD"] as const;

/**
 * La cancha y su panel, con la posición elegida en medio.
 *
 * El estado vive aquí y no en la URL: elegir una posición es mirar, no
 * filtrar, y meterlo en `?pos=` obligaría a la página a un `useSearchParams`
 * —con su límite de Suspense— a cambio de un enlace que nadie va a compartir.
 * Si algún día se comparte «el mejor central de la reta», se sube entonces.
 */
export const PositionsExplorer = ({
  overview,
}: {
  readonly overview: PositionsOverview;
}) => {
  const [selected, setSelected] = React.useState<Position | null>(null);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_20rem] lg:items-start">
      <div className="space-y-3">
        {/* Debajo de sm la cancha se encogería hasta volver ilegibles los
            códigos: mejor que conserve tamaño y se desplace de lado. */}
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
          <div className="ring-foreground/10 relative min-w-[560px] overflow-hidden rounded-lg ring-1 sm:min-w-0">
            <PositionMap
              byPosition={overview.byPosition}
              onSelect={setSelected}
              selected={selected}
            />
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          {LEGEND.map((line) => (
            <div className="flex items-center gap-1.5 text-xs" key={line}>
              <span
                aria-hidden="true"
                className="size-3 rounded-full"
                style={{ backgroundColor: GROUP_COLOR[line] }}
              />
              {GROUP_LABEL[line]}
            </div>
          ))}
        </div>
      </div>

      <PositionPanel
        byPosition={overview.byPosition}
        lines={overview.lines}
        selected={selected}
      />
    </div>
  );
};
