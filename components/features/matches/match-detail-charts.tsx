"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const teamChartConfig = {
  goals: { label: "Goles", color: "var(--chart-1)" },
} satisfies ChartConfig;

const scorerChartConfig = {
  goals: { label: "Goles", color: "var(--chart-2)" },
} satisfies ChartConfig;

type TeamDatum = {
  team: string;
  goals: number;
};

type ScorerDatum = {
  player: string;
  goals: number;
};

export function MatchTeamGoalsChart({ data }: { data: TeamDatum[] }) {
  return (
    <ChartContainer config={teamChartConfig} className="h-56 w-full">
      <BarChart data={data} margin={{ left: -18, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} className="stroke-border" />
        <XAxis
          dataKey="team"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          className="text-[10px]"
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          className="text-[10px]"
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="goals" fill="var(--color-goals)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

export function MatchScorersChart({ data }: { data: ScorerDatum[] }) {
  if (data.length === 0) {
    return (
      <div className="bg-muted/40 text-muted-foreground flex h-56 items-center justify-center rounded-lg text-sm">
        Sin goleadores registrados.
      </div>
    );
  }

  return (
    <ChartContainer config={scorerChartConfig} className="h-56 w-full">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 8, right: 12, top: 8, bottom: 8 }}
      >
        <CartesianGrid horizontal={false} className="stroke-border" />
        <XAxis
          type="number"
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          className="text-[10px]"
        />
        <YAxis
          type="category"
          dataKey="player"
          tickLine={false}
          axisLine={false}
          width={88}
          className="text-[10px]"
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="goals" fill="var(--color-goals)" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
