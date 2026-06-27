"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { STAT_ABBR, STAT_KEYS, STAT_LABEL } from "@/lib/constants";
import type { Player } from "@/lib/db/schema";

const chartConfig = {
  value: { label: "Valor", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function PlayerRadar({ player }: { player: Player }) {
  const data = STAT_KEYS.map((key) => ({
    stat: STAT_ABBR[key],
    label: STAT_LABEL[key],
    value: player[key],
  }));

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-72 w-full">
      <RadarChart data={data} outerRadius="72%">
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelKey="label"
              formatter={(value, _name, item) => (
                <span>
                  <span className="font-medium">{item.payload.label}</span>
                  <span className="ml-2 font-mono font-bold tabular-nums">
                    {value}
                  </span>
                </span>
              )}
            />
          }
        />
        <PolarGrid className="stroke-border" />
        <PolarAngleAxis dataKey="stat" className="text-xs" />
        <Radar
          dataKey="value"
          fill="var(--color-value)"
          fillOpacity={0.55}
          stroke="var(--color-value)"
          strokeWidth={2}
          dot={{ r: 3, fillOpacity: 1 }}
        />
      </RadarChart>
    </ChartContainer>
  );
}
