import Link from "next/link";
import { getPlayers } from "@/lib/queries";
import { PageHeader } from "@/components/shared/page-header";
import { Pitch } from "@/components/shared/pitch";
import { PositionHotspots } from "@/components/features/positions/position-hotspots";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { playerPositions } from "@/lib/format";
import {
  POSITIONS,
  POSITION_NAME,
  GROUP_LABEL,
  GROUP_COLOR,
  positionGroup,
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
          <div className="ring-foreground/10 relative overflow-hidden rounded-lg ring-1">
            <Pitch counts={counts} />
            <PositionHotspots byPosition={byPosition} />
          </div>
          <p className="text-muted-foreground text-center text-[11px]">
            Pasa el cursor sobre una posición para ver los jugadores.
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

      {/* Reference: each position, its name, and who can play it */}
      <div className="grid gap-4 md:grid-cols-2">
        {GROUP_ORDER.map((group) => (
          <Card key={group}>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: GROUP_COLOR[group] }}
                />
                {GROUP_LABEL[group]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {POSITIONS.filter((p) => positionGroup(p) === group).map(
                (pos) => (
                  <div key={pos} className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span
                        className="inline-flex min-w-9 justify-center rounded-sm px-1.5 py-0.5 text-[11px] font-bold text-white"
                        style={{ backgroundColor: GROUP_COLOR[group] }}
                      >
                        {pos}
                      </span>
                      <span className="text-sm font-medium">
                        {POSITION_NAME[pos]}
                      </span>
                    </div>
                    {byPosition[pos].length > 0 ? (
                      <div className="flex flex-wrap gap-1 pl-11">
                        {byPosition[pos].map((p) => (
                          <Link
                            key={p.id}
                            href={`/players/${p.id}`}
                            className="bg-muted hover:bg-muted/70 rounded-sm px-1.5 py-0.5 text-[11px]"
                          >
                            {p.displayName}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground pl-11 text-[11px]">
                        Sin jugadores
                      </p>
                    )}
                  </div>
                ),
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
