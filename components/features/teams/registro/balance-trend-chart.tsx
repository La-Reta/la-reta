"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatShortDate } from "@/lib/dates";
import type { DiffPoint } from "@/lib/reta-stats";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis } from "recharts";

const chartConfig = {
  diff: { label: "Diferencia OVR", color: "var(--chart-1)" },
} satisfies ChartConfig;

/**
 * Qué tan parejas salen las retas con el tiempo: la diferencia de OVR entre el
 * equipo más fuerte y el más débil de cada generación. Más abajo = más parejo.
 * Serie única, así que no necesita leyenda; la línea punteada es el promedio.
 */
export function BalanceTrendChart({ points }: { points: DiffPoint[] }) {
  const data = points.slice(-20).map((p, i) => ({
    label: `${formatShortDate(p.date)}`,
    diff: p.diff,
    teams: p.teams,
    i,
  }));

  if (data.length < 2) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        Genera un par de retas más para ver la tendencia.
      </p>
    );
  }

  const avg =
    Math.round((data.reduce((a, d) => a + d.diff, 0) / data.length) * 10) / 10;

  return (
    <ChartContainer config={chartConfig} className="h-[180px] w-full">
      <LineChart
        accessibilityLayer
        data={data}
        margin={{ top: 8, right: 8, left: 4, bottom: 0 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={6}
          fontSize={10}
          interval="preserveStartEnd"
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={(_, payload) =>
                `${payload?.[0]?.payload?.label} · ${payload?.[0]?.payload?.teams} equipos`
              }
            />
          }
        />
        <ReferenceLine
          y={avg}
          stroke="var(--foreground)"
          strokeOpacity={0.4}
          strokeDasharray="4 4"
        />
        <Line
          dataKey="diff"
          type="monotone"
          stroke="var(--color-diff)"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
