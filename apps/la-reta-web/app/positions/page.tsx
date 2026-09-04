import { getPlayers } from "@/lib/queries";
import { PageHeader } from "@/components/shared/page-header";
import { Pitch } from "@/components/shared/pitch";
import { DepthChart } from "@/components/features/positions/depth-chart";
import { PositionHotspots } from "@/components/features/positions/position-hotspots";
import { Card, CardContent } from "@/components/ui/card";
import { playerPositions } from "@/lib/format";
import {
  POSITIONS,
  GROUP_LABEL,
  GROUP_COLOR,
  type Position,
  type PositionGroup,
} from "@/lib/constants";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Posiciones · Reta Fútbol" };
export const dynamic = "force-dynamic";

const GROUP_ORDER: PositionGroup[] = ["GK", "DEF", "MID", "FWD"];

export default async function PositionsPage() {
  const players = await getPlayers();

  const counts: Partial<Record<Position, number>> = {};
  const byPosition = {} as Record<Position, typeof players>;
  for (const p of POSITIONS) byPosition[p] = [];

  for (const player of players) {
    for (const pos of playerPositions(player)) {
      counts[pos] = (counts[pos] ?? 0) + 1;
      byPosition[pos].push(player);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Posiciones"
        description="Dónde juega cada posición en la cancha. El número indica cuántos jugadores tienes para cada una."
      />

      <Card>
        <CardContent className="space-y-4">
          {/* Debajo de sm la cancha se encogería hasta volver ilegibles los
              códigos: mejor que conserve tamaño y se desplace de lado. */}
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
            <div className="ring-foreground/10 relative min-w-[560px] overflow-hidden rounded-lg ring-1 sm:min-w-0">
              <Pitch counts={counts} />
              <PositionHotspots byPosition={byPosition} />
            </div>
          </div>
          {/* El tooltip es de hover: en táctil la plantilla de abajo hace ese
              trabajo, así que la pista solo aplica en pantallas con cursor. */}
          <p className="text-muted-foreground hidden text-center text-[11px] md:block">
            Pasa el cursor sobre una posición para ver quién la juega.
          </p>
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4">
            {GROUP_ORDER.map((g) => (
              <div key={g} className="flex items-center gap-1.5 text-xs">
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: GROUP_COLOR[g] }}
                />
                {GROUP_LABEL[g]}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <DepthChart byPosition={byPosition} />
    </div>
  );
}
