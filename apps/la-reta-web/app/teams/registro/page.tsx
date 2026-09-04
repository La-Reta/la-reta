import { BalanceTrendChart } from "@/components/features/teams/registro/balance-trend-chart";
import { GenerationsChart } from "@/components/features/teams/registro/generations-chart";
import {
  RetaToMatchList,
  type RetaToMatchItem,
} from "@/components/features/teams/registro/reta-to-match-list";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatApiDate, formatCompactDate, formatTime } from "@/lib/dates";
import { getGeneratedRetas, retaTeams } from "@/lib/queries";
import { computeRetaStats, type RetaStats } from "@/lib/reta-stats";
import { cn } from "@/lib/utils";
import type { TeamKey } from "@/lib/teams";
import {
  ArrowLeftIcon,
  CalendarRangeIcon,
  CopyIcon,
  HandshakeIcon,
  LayersIcon,
  ActivityIcon,
  UsersIcon,
  RepeatIcon,
  ScaleIcon,
  ShuffleIcon,
  TrophyIcon,
} from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

/** Small tinted icon chip that fronts every section title, for a shared rhythm. */
function CardIcon({
  children,
  tone = "primary",
}: {
  children: React.ReactNode;
  tone?: "primary" | "amber";
}) {
  return (
    <span
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-lg [&_svg]:size-4",
        tone === "amber"
          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
          : "bg-primary/10 text-primary",
      )}
    >
      {children}
    </span>
  );
}

export const metadata: Metadata = { title: "Registro de retas · Reta Fútbol" };
export const dynamic = "force-dynamic";

export default async function RetaRegistroPage() {
  const retas = await getGeneratedRetas();
  const stats = computeRetaStats(retas);

  // Newest 12 retas, trimmed for the "llevar a partidos" hand-off. Date is
  // formatted here (server) to avoid a client hydration mismatch.
  const retaItems: RetaToMatchItem[] = retas.slice(0, 12).map((r) => ({
    id: r.id,
    dateLabel: `${formatCompactDate(r.createdAt)} ${formatTime(r.createdAt)}`,
    playedAt: formatApiDate(r.createdAt),
    teams: retaTeams(r),
    players: r.players.map((p) => ({
      playerId: p.playerId,
      guestName: p.isGuest ? p.name : null,
      team: p.team as TeamKey,
      name: p.name,
    })),
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Registro de retas"
        description="Cómo se han armado los equipos: repetición de splits, duplas frecuentes y quién juega más. Alimenta la variedad del generador."
        actions={
          <Button variant="outline" render={<Link href="/teams" />}>
            <ArrowLeftIcon />
            Armar equipos
          </Button>
        }
      />

      {stats.total === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Generaciones"
              value={stats.total}
              icon={<ShuffleIcon />}
            />
            <StatTile
              label="Splits únicos"
              value={stats.unique}
              icon={<LayersIcon />}
            />
            <StatTile
              label="Repetición"
              value={`${stats.repetitionRate}%`}
              sub={`${stats.repeated} repetidos`}
              icon={<RepeatIcon />}
              meter={stats.repetitionRate}
              accent={stats.repetitionRate >= 40}
            />
            <StatTile
              label="Diferencia media"
              value={stats.avgDiff}
              sub="OVR entre equipos"
              icon={<ScaleIcon />}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card size="sm">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CardIcon>
                    <CalendarRangeIcon />
                  </CardIcon>
                  Generaciones por día
                </CardTitle>
                <CardDescription>
                  Últimos {Math.min(14, stats.perDay.length)} días con actividad
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <GenerationsChart perDay={stats.perDay} />
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CardIcon>
                    <ActivityIcon />
                  </CardIcon>
                  Qué tan parejas salen
                </CardTitle>
                <CardDescription>
                  Diferencia de OVR entre el equipo más fuerte y el más débil ·
                  media {stats.avgDiff}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <BalanceTrendChart points={stats.diffTrend} />
              </CardContent>
            </Card>
          </div>

          <FormatBreakdown stats={stats} />

          <div className="grid gap-6 lg:grid-cols-2">
            <TopPairs stats={stats} />
            <TopPlayers stats={stats} />
          </div>

          {stats.repeatedMatchups.length > 0 && (
            <RepeatedMatchups stats={stats} />
          )}
          <RetaToMatchList retas={retaItems} />
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
  meter,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  accent?: boolean;
  /** 0–100. Draws a slim health bar under the value (e.g. repetition rate). */
  meter?: number;
}) {
  return (
    <Card size="sm">
      <CardContent>
        <p className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
          <CardIcon tone={accent ? "amber" : "primary"}>{icon}</CardIcon>
          {label}
        </p>
        <p
          className={cn(
            "font-display mt-2 text-4xl leading-none font-bold tabular-nums",
            accent && "text-amber-600 dark:text-amber-400",
          )}
        >
          {value}
        </p>
        {meter !== undefined ? (
          <div className="bg-muted mt-2 h-1 overflow-hidden rounded-full">
            <div
              className={cn(
                "h-full rounded-full",
                accent ? "bg-amber-500" : "bg-primary",
              )}
              style={{ width: `${Math.min(100, Math.max(0, meter))}%` }}
            />
          </div>
        ) : null}
        {sub ? (
          <p className="text-muted-foreground mt-1.5 text-[11px]">{sub}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function TopPairs({ stats }: { stats: RetaStats }) {
  return (
    <Card size="sm">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <CardIcon>
            <HandshakeIcon />
          </CardIcon>
          Duplas más frecuentes
        </CardTitle>
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
                className="flex items-center justify-between gap-2 py-2.5 text-sm"
              >
                <span className="min-w-0 truncate">
                  <span className="font-medium">{pair.a}</span>
                  <span className="text-muted-foreground"> + </span>
                  <span className="font-medium">{pair.b}</span>
                </span>
                <span className="bg-muted text-muted-foreground shrink-0 rounded-full px-2 py-0.5 font-mono text-xs font-semibold tabular-nums">
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
    <Card size="sm">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <CardIcon>
            <TrophyIcon />
          </CardIcon>
          Más convocados
        </CardTitle>
        <CardDescription>Apariciones en equipos generados</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <ul className="space-y-3">
          {stats.topPlayers.map((p, i) => (
            <li key={p.playerId} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="text-muted-foreground w-4 shrink-0 text-center font-mono text-xs font-semibold tabular-nums">
                    {i + 1}
                  </span>
                  <span className="min-w-0 truncate font-medium">{p.name}</span>
                </span>
                <span className="text-foreground shrink-0 font-mono text-xs font-semibold tabular-nums">
                  {p.count}
                </span>
              </div>
              <div className="bg-muted ml-6 h-1.5 overflow-hidden rounded-full">
                <div
                  className={cn(
                    "h-full rounded-full",
                    i === 0 ? "bg-primary" : "bg-primary/50",
                  )}
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
    <Card size="sm">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <CardIcon tone="amber">
            <CopyIcon />
          </CardIcon>
          Splits repetidos
        </CardTitle>
        <CardDescription>
          Mismos equipos generados más de una vez (sin importar A/B)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 pt-4">
        {stats.repeatedMatchups.map((m) => (
          <div
            key={m.retaId}
            className="bg-muted/40 flex flex-col gap-2 rounded-2xl p-3 sm:flex-row sm:items-center"
          >
            <span className="shrink-0 self-start rounded-full bg-amber-500/15 px-2.5 py-0.5 font-mono text-xs font-bold text-amber-600 tabular-nums dark:text-amber-400">
              {m.count}×
            </span>
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              {m.sides.map((side, i) => (
                <span key={i} className="flex min-w-0 items-center gap-2">
                  {i > 0 && (
                    <span className="text-muted-foreground font-display font-bold">
                      VS
                    </span>
                  )}
                  <span className="truncate">{side.join(", ")}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Cuántas retas se armaron con 2, 3, 4 … equipos. Son dos o tres categorías, así
 * que una barra etiquetada lee mejor (y cuesta menos) que un gráfico completo.
 */
function FormatBreakdown({ stats }: { stats: RetaStats }) {
  if (stats.byFormat.length < 2) return null;
  const max = Math.max(...stats.byFormat.map((f) => f.count));
  return (
    <Card size="sm">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <CardIcon>
            <UsersIcon />
          </CardIcon>
          Formato de la reta
        </CardTitle>
        <CardDescription>
          Cuántas generaciones se armaron con cada número de equipos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {stats.byFormat.map((f) => (
          <div key={f.teams} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium">{f.teams} equipos</span>
              <span className="text-muted-foreground font-mono text-xs font-semibold tabular-nums">
                {f.count} · {Math.round((f.count / stats.total) * 100)}%
              </span>
            </div>
            <div className="bg-muted h-1.5 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: `${Math.round((f.count / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-20 text-center">
      <span className="bg-primary/10 text-primary grid size-14 place-items-center rounded-2xl">
        <ShuffleIcon className="size-7" />
      </span>
      <div>
        <p className="font-display text-lg font-bold tracking-tight">
          Aún no hay retas generadas
        </p>
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
