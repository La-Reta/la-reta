import { DepthChart } from "@/components/features/positions/depth-chart";
import { PositionsExplorer } from "@/components/features/positions/positions-explorer";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { POSITIONS, type Position } from "@/lib/constants";
import { playerPositions } from "@/lib/format";
import { positionsOverview } from "@/lib/positions-insights";
import { getPlayers } from "@/lib/queries";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Posiciones · Reta Fútbol" };
export const dynamic = "force-dynamic";

const PositionsPage = async () => {
  const players = await getPlayers();

  // El cuadro de profundidad necesita la ficha entera de cada jugador; el mapa
  // se apaña con lo justo y ya ordenado (`positionsOverview`).
  const byPosition = {} as Record<Position, typeof players>;
  for (const position of POSITIONS) {
    byPosition[position] = [];
  }
  for (const player of players) {
    for (const position of playerPositions(player)) {
      byPosition[position].push(player);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Posiciones"
        description="Toca una posición: quién la juega hoy y cómo rendiría ahí cualquiera de la plantilla."
      />

      <Card>
        <CardContent>
          <PositionsExplorer overview={positionsOverview(players)} />
        </CardContent>
      </Card>

      <DepthChart byPosition={byPosition} />
    </div>
  );
};

export default PositionsPage;
