"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatShortDate } from "@/lib/dates";
import type { DiffPoint } from "@/lib/reta-stats";
/*
 * recharts se importa estático a propósito: el App Router ya parte el bundle
 * por ruta, así que solo llega a quien abre una vista con gráfica. Envolverlo
 * en `next/dynamic` aquí no quitaría nada del bundle inicial y sí metería un
 * salto de layout al montar.
 */
// eslint-disable-next-line react-doctor/prefer-dynamic-import -- Next ya parte por ruta
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis } from "recharts";

const chartConfig = {
  diff: { label: "Diferencia OVR", color: "var(--chart-1)" },
} satisfies ChartConfig;

/**
 * Qué tan parejas salen las retas con el tiempo: la diferencia de OVR entre el
 * equipo más fuerte y el más débil de cada generación. Más abajo = más parejo.
 * Serie única, así que no necesita leyenda; la línea punteada es el promedio.
 */
export const BalanceTrendChart = ({
  points,
}: {
  readonly points: DiffPoint[];
}) => {
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

  // El total sale a su propia constante: encadenar `reduce().toFixed()` dentro
  // de la expresión hacía tropezar al compilador de React (`react-hooks/invariant`).
  const totalDiff = data.reduce((sum, d) => sum + d.diff, 0);
  const avg = Math.round((totalDiff / data.length) * 10) / 10;

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
};
