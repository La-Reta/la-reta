"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { STAT_KEYS, STAT_LABEL, STAT_ABBR } from "@/lib/constants";
import type { StatHistory } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const chartConfig = {
  overall: { label: "Overall", color: "var(--chart-1)" },
} satisfies ChartConfig;

const fmtDate = (d: Date | string) =>
  new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short" }).format(
    new Date(d),
  );

type ChangeEvent = {
  date: Date | string;
  overallFrom: number;
  overallTo: number;
  changes: { key: (typeof STAT_KEYS)[number]; from: number; to: number; delta: number }[];
};

export function PlayerHistory({ history }: { history: StatHistory[] }) {
  if (history.length < 2) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Aún no hay cambios registrados. El historial se irá llenando cada vez que
        edites las stats de este jugador.
      </p>
    );
  }

  const chartData = history.map((h) => ({
    date: fmtDate(h.recordedAt),
    overall: h.overall,
  }));

  const events: ChangeEvent[] = [];
  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1];
    const cur = history[i];
    const changes = STAT_KEYS.map((key) => ({
      key,
      from: prev[key],
      to: cur[key],
      delta: cur[key] - prev[key],
    })).filter((c) => c.delta !== 0);
    if (changes.length || prev.overall !== cur.overall) {
      events.push({
        date: cur.recordedAt,
        overallFrom: prev.overall,
        overallTo: cur.overall,
        changes,
      });
    }
  }
  events.reverse();

  const first = history[0].overall;
  const last = history[history.length - 1].overall;
  const totalDelta = last - first;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {history.length} registros · de{" "}
          <span className="font-semibold text-foreground">{first}</span> a{" "}
          <span className="font-semibold text-foreground">{last}</span> OVR
        </p>
        <Delta value={totalDelta} suffix=" total" />
      </div>

      <ChartContainer config={chartConfig} className="h-44 w-full">
        <LineChart data={chartData} margin={{ left: -16, right: 8, top: 4 }}>
          <CartesianGrid vertical={false} className="stroke-border" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-[10px]"
          />
          <YAxis
            width={32}
            domain={["dataMin - 3", "dataMax + 3"]}
            tickLine={false}
            axisLine={false}
            className="text-[10px]"
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Line
            dataKey="overall"
            type="monotone"
            stroke="var(--color-overall)"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ChartContainer>

      <div className="space-y-3">
        <p className="text-[10px] font-semibold uppercase text-muted-foreground">
          Cambios
        </p>
        {events.map((e, i) => (
          <div key={i} className="border-l-2 border-border pl-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium">{fmtDate(e.date)}</span>
              {e.overallFrom !== e.overallTo && (
                <span className="text-muted-foreground">
                  OVR {e.overallFrom} → {e.overallTo}
                </span>
              )}
              <Delta value={e.overallTo - e.overallFrom} className="ml-auto" />
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {e.changes.map((c) => (
                <span
                  key={c.key}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-medium",
                    c.delta > 0
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/15 text-rose-600 dark:text-rose-400",
                  )}
                  title={STAT_LABEL[c.key]}
                >
                  {STAT_ABBR[c.key]} {c.from}→{c.to} ({c.delta > 0 ? "+" : ""}
                  {c.delta})
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Delta({
  value,
  suffix = "",
  className,
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  if (value === 0)
    return (
      <span className={cn("text-[10px] text-muted-foreground", className)}>
        sin cambio{suffix}
      </span>
    );
  const up = value > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[10px] font-semibold",
        up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
        className,
      )}
    >
      {up ? (
        <ArrowUpRightIcon className="size-3" />
      ) : (
        <ArrowDownRightIcon className="size-3" />
      )}
      {up ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}
