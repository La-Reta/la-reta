"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatShortDate } from "@/lib/dates";
import type { DayStat } from "@/lib/reta-stats";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

const chartConfig = {
  count: { label: "Generaciones", color: "var(--chart-1)" },
} satisfies ChartConfig;

/** Generated retas per day — how often the group re-rolls teams over time. */
export function GenerationsChart({ perDay }: { perDay: DayStat[] }) {
  const data = perDay.slice(-14).map((d) => ({
    label: formatShortDate(d.date),
    count: d.count,
  }));

  if (data.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        Aún no hay generaciones para graficar.
      </p>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[180px] w-full">
      <BarChart
        accessibilityLayer
        data={data}
        margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
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
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
