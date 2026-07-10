import { GenerationsChart } from "@/components/features/teams/registro/generations-chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getGeneratedRetas } from "@/lib/queries";
import { computeRetaStats, type RetaStats } from "@/lib/reta-stats";
import {
  ArrowLeftIcon,
  RepeatIcon,
  ShuffleIcon,
  UsersIcon,
} from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Registro de retas · Reta Fútbol" };
export const dynamic = "force-dynamic";

export default async function RetaRegistroPage() {
  const retas = await getGeneratedRetas();
  const stats = computeRetaStats(retas);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Registro de retas
          </h1>
          <p className="text-muted-foreground text-sm">
            Cómo se han armado los equipos: repetición de splits, duplas
            frecuentes y quién juega más. Alimenta la variedad del generador.
          </p>
        </div>
        <Button variant="outline" render={<Link href="/teams" />}>
          <ArrowLeftIcon />
          Armar equipos
        </Button>
      </div>

      {stats.total === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Generaciones"
              value={stats.total}
              icon={<ShuffleIcon className="size-4" />}
            />
            <StatTile
              label="Splits únicos"
              value={stats.unique}
              icon={<UsersIcon className="size-4" />}
            />
            <StatTile
              label="Repetición"
              value={`${stats.repetitionRate}%`}
              sub={`${stats.repeated} repetidos`}
              icon={<RepeatIcon className="size-4" />}
              accent={stats.repetitionRate >= 40}
            />
            <StatTile
              label="Diferencia media"
              value={stats.avgDiff}
              sub="OVR entre equipos"
            />
          </div>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">Generaciones por día</CardTitle>
              <CardDescription>
                Últimos {Math.min(14, stats.perDay.length)} días con actividad
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <GenerationsChart perDay={stats.perDay} />
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <TopPairs stats={stats} />
            <TopPlayers stats={stats} />
          </div>

          {stats.repeatedMatchups.length > 0 && (
            <RepeatedMatchups stats={stats} />
          )}
        </>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Card size="sm">
      <CardContent>
        <p className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
          {icon}
          {label}
        </p>
        <p
          className="mt-1 font-mono text-3xl font-black tabular-nums"
          style={{
            color: accent ? "var(--color-amber-500, #f59e0b)" : undefined,
          }}
        >
          {value}
        </p>
        {sub ? (
          <p className="text-muted-foreground mt-0.5 text-[11px]">{sub}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function TopPairs({ stats }: { stats: RetaStats }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-base">Duplas más frecuentes</CardTitle>
        <CardDescription>
          Jugadores que caen en el mismo equipo una y otra vez
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {stats.topPairs.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            Sin duplas repetidas todavía.
          </p>
        ) : (
          <ul className="divide-border divide-y">
            {stats.topPairs.map((pair) => (
              <li
                key={pair.key}
                className="flex items-center justify-between gap-2 py-2 text-sm"
              >
                <span className="min-w-0 truncate">
                  <span className="font-medium">{pair.a}</span>
                  <span className="text-muted-foreground"> + </span>
                  <span className="font-medium">{pair.b}</span>
                </span>
                <span className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
                  {pair.count}×
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function TopPlayers({ stats }: { stats: RetaStats }) {
  const max = stats.topPlayers[0]?.count ?? 1;
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-base">Más convocados</CardTitle>
        <CardDescription>Apariciones en equipos generados</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <ul className="space-y-2.5">
          {stats.topPlayers.map((p) => (
            <li key={p.playerId} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate font-medium">{p.name}</span>
                <span className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
                  {p.count}
                </span>
              </div>
              <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${Math.round((p.count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function RepeatedMatchups({ stats }: { stats: RetaStats }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-base">Splits repetidos</CardTitle>
        <CardDescription>
          Mismos equipos generados más de una vez (sin importar A/B)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {stats.repeatedMatchups.map((m) => (
          <div
            key={m.retaId}
            className="ring-foreground/10 flex flex-col gap-2 rounded-lg p-3 ring-1 sm:flex-row sm:items-center"
          >
            <span className="shrink-0 self-start rounded-sm bg-amber-500/15 px-2 py-0.5 font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
              {m.count}×
            </span>
            <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs">
              <span className="truncate text-right">{m.teamA.join(", ")}</span>
              <span className="text-muted-foreground font-display font-bold">
                VS
              </span>
              <span className="truncate">{m.teamB.join(", ")}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
      <ShuffleIcon className="text-muted-foreground size-8" />
      <div>
        <p className="font-medium">Aún no hay retas generadas</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Arma unos equipos y aquí verás cómo se reparten con el tiempo.
        </p>
      </div>
      <Button render={<Link href="/teams" />}>
        <ShuffleIcon />
        Armar equipos
      </Button>
    </div>
  );
}
