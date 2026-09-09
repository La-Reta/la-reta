"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { STAT_ABBR, STAT_KEYS, STAT_LABEL } from "@/lib/constants";
import { formatShortDate } from "@/lib/dates";
import type { StatHistory } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  TrendingUpIcon,
} from "lucide-react";
// Import estático a propósito: los seis gráficos de la app lo hacen igual, así
// que cargar solo este bajo demanda no quita recharts del bundle —lo arrastran
// los otros cinco— y sí mete un salto de layout donde ahora no lo hay.
// eslint-disable-next-line react-doctor/prefer-dynamic-import -- ver arriba
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

const chartConfig = {
  overall: { label: "Overall", color: "var(--chart-1)" },
} satisfies ChartConfig;

/**
 * Alto compartido por la gráfica y por el registro de cambios.
 *
 * Es una sola constante a propósito: las dos columnas tienen que terminar a la
 * misma altura o la tarjeta queda con un escalón, y el `ScrollArea` necesita un
 * alto fijo —no `h-full`— para saber cuándo aparece la barra.
 */
const PANEL_HEIGHT = "h-64";

type ChangeEvent = {
  date: Date | string;
  overallFrom: number;
  overallTo: number;
  changes: {
    key: (typeof STAT_KEYS)[number];
    from: number;
    to: number;
    delta: number;
  }[];
};

function buildEvents(history: StatHistory[]): ChangeEvent[] {
  const events: ChangeEvent[] = [];
  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1];
    const cur = history[i];
    const changes = STAT_KEYS.reduce<ChangeEvent["changes"]>((acc, key) => {
      const delta = cur[key] - prev[key];
      if (delta !== 0) acc.push({ key, from: prev[key], to: cur[key], delta });
      return acc;
    }, []);
    if (changes.length || prev.overall !== cur.overall) {
      events.push({
        date: cur.recordedAt,
        overallFrom: prev.overall,
        overallTo: cur.overall,
        changes,
      });
    }
  }
  return events.reverse();
}

export const PlayerHistory = ({
  history,
}: {
  readonly history: StatHistory[];
}) => {
  if (history.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center">
        <TrendingUpIcon className="text-muted-foreground size-7" />
        <p className="text-sm font-medium">Sin cambios registrados</p>
        <p className="text-muted-foreground max-w-xs text-xs">
          El historial se irá llenando cada vez que se editen las stats de este
          jugador.
        </p>
      </div>
    );
  }

  const chartData = history.map((h) => ({
    date: formatShortDate(h.recordedAt),
    overall: h.overall,
  }));
  const events = buildEvents(history);
  const first = history[0].overall;
  const last = history[history.length - 1].overall;

  return (
    // 3:2 y no mitad y mitad: una serie de diez fechas necesita ancho o los
    // rótulos del eje se pisan, y una lista de chips que ya fluye no lo necesita.
    // `minmax(0,…)` porque una celda de rejilla mide `auto` por defecto y el SVG
    // de recharts no encoge por debajo de su tamaño medido: sin eso la columna
    // de la gráfica se queda anclada al ancho del primer render.
    <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-0">
      {/* `min-w-0`: el ResponsiveContainer de recharts fija su ancho medido, y
          una celda de rejilla mide `auto` por defecto, así que ese ancho pasaba
          a ser el mínimo de la columna y la ficha entera desbordaba en móvil. */}
      <div className="min-w-0 lg:pr-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-muted-foreground text-xs">
            {history.length} registros
          </p>
          <p className="flex items-baseline gap-1.5 font-mono text-xs tabular-nums">
            <span className="text-muted-foreground">{first}</span>
            <span className="text-muted-foreground">→</span>
            <span className="text-foreground text-base font-black">{last}</span>
            <Delta value={last - first} />
          </p>
        </div>

        <ChartContainer
          className={cn("mt-3 w-full", PANEL_HEIGHT)}
          config={chartConfig}
        >
          <LineChart data={chartData} margin={{ left: -4, right: 8, top: 8 }}>
            <CartesianGrid className="stroke-border" vertical={false} />
            <XAxis
              axisLine={false}
              className="text-[10px]"
              dataKey="date"
              tickLine={false}
              tickMargin={8}
            />
            <YAxis
              axisLine={false}
              className="text-[10px]"
              domain={["dataMin - 3", "dataMax + 3"]}
              tickLine={false}
              width={38}
            />
            <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
            <Line
              activeDot={{ r: 5 }}
              dataKey="overall"
              dot={{ r: 3 }}
              stroke="var(--color-overall)"
              strokeWidth={2}
              type="monotone"
            />
          </LineChart>
        </ChartContainer>
      </div>

      <div className="lg:border-border min-w-0 lg:border-l lg:pl-6">
        <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
          Cambios
        </p>
        <ScrollArea className={cn("mt-3 -mr-3 pr-3", PANEL_HEIGHT)}>
          <ol className="space-y-3">
            {events.map((e) => (
              <li
                className="border-border hover:border-foreground/30 border-l-2 pl-3 transition-colors"
                key={String(e.date)}
              >
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium">{formatShortDate(e.date)}</span>
                  {e.overallFrom === e.overallTo ? null : (
                    <span className="text-muted-foreground font-mono tabular-nums">
                      OVR {e.overallFrom} → {e.overallTo}
                    </span>
                  )}
                  <Delta
                    className="ml-auto"
                    value={e.overallTo - e.overallFrom}
                  />
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {e.changes.map((c) => (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-medium tabular-nums",
                        c.delta > 0
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                      )}
                      key={c.key}
                      title={STAT_LABEL[c.key]}
                    >
                      {STAT_ABBR[c.key]} {c.from}→{c.to} (
                      {c.delta > 0 ? "+" : ""}
                      {c.delta})
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </ScrollArea>
      </div>
    </div>
  );
};

const Delta = ({
  value,
  suffix = "",
  className,
}: {
  readonly value: number;
  readonly suffix?: string;
  readonly className?: string;
}) => {
  if (value === 0) {
    return (
      <span className={cn("text-muted-foreground text-[10px]", className)}>
        sin cambio{suffix}
      </span>
    );
  }
  const up = value > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[10px] font-semibold",
        up
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-rose-600 dark:text-rose-400",
        className
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
};
