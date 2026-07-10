import { RotatingWord } from "@/components/features/dashboard/rotating-word";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, ShuffleIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type * as React from "react";

type BannerStats = {
  total: number;
  avgOverall: number;
  avgAge: number;
  leaderOverall: number;
  leaderName: string;
};

type Props = {
  bannerWords: React.ComponentProps<typeof RotatingWord>["words"];
  stats: BannerStats;
};

/** Matchday banner: hero (temporada, título rotativo, CTAs, imagen) + scoreboard. */
export function MatchdayBanner({ bannerWords, stats }: Props) {
  return (
    <section className="ring-foreground/10 relative overflow-hidden rounded-4xl bg-[linear-gradient(135deg,#0b3d2e_0%,#0a3327_60%,#072018_100%)] text-white ring-1">
      {/* faint chalk pitch, drawn from the right touchline */}
      <svg
        viewBox="0 0 600 400"
        preserveAspectRatio="xMaxYMid slice"
        className="pointer-events-none absolute inset-y-0 right-0 h-full w-2/3 opacity-[0.12]"
        aria-hidden="true"
      >
        <g fill="none" stroke="white" strokeWidth={2}>
          <line x1={300} y1={0} x2={300} y2={400} />
          <circle cx={300} cy={200} r={80} />
          <rect x={520} y={120} width={120} height={160} />
        </g>
      </svg>

      <div className="relative flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between lg:p-9">
        <div>
          <span className="font-display text-xs font-semibold tracking-[0.25em] text-emerald-300/90 uppercase">
            Jornada · Temporada 2026
          </span>
          <h1 className="font-display mt-1 text-5xl leading-[0.92] font-bold tracking-tight uppercase sm:text-6xl lg:text-7xl">
            La Reta
            <br />
            <RotatingWord className="text-emerald-300" words={bannerWords} />
          </h1>
          <p className="mt-3 max-w-sm text-sm text-emerald-50/70">
            El club de la reta en modo carrera: convoca, revisa el nivel y salta
            a armar los equipos de hoy.
          </p>

          <div className="mt-5 flex gap-2">
            <Button variant="default" render={<Link href="/teams" />}>
              <ShuffleIcon />
              Armar equipos
            </Button>
            <Button variant={"secondary"} render={<Link href="/players" />}>
              Ver plantilla
              <ArrowRightIcon />
            </Button>
          </div>
        </div>

        <div className="shrink-0 self-center rounded-xl bg-white p-2.5 shadow-xl ring-1 ring-black/10 sm:p-3 lg:self-end">
          <Image
            src="/fifa-credix.webp"
            alt="FIFA 26 × Credix"
            width={1536}
            height={1024}
            priority
            className="h-auto w-full max-w-[190px] sm:max-w-[210px] lg:max-w-[240px]"
          />
        </div>
      </div>

      {/* Scoreboard strip */}
      <div className="relative grid grid-cols-2 border-t border-white/10 bg-black/25 sm:grid-cols-4">
        <Score label="Plantel" value={stats.total} />
        <Score label="OVR medio" value={stats.avgOverall} />
        <Score label="Edad media" value={stats.avgAge} />
        <Score
          label="Líder"
          value={stats.leaderOverall}
          sub={stats.leaderName}
          accent
        />
      </div>
    </section>
  );
}

function Score({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="border-l border-white/10 px-4 py-3 first:border-l-0">
      <p className="font-display text-[10px] font-semibold tracking-[0.18em] text-emerald-200/70 uppercase">
        {label}
      </p>
      <p
        className="font-mono text-3xl leading-none font-black tabular-nums"
        style={{ color: accent ? "#fca5a5" : undefined }}
      >
        {value}
      </p>
      {sub ? (
        <p className="mt-0.5 truncate text-[11px] font-medium text-emerald-50/70">
          {sub}
        </p>
      ) : null}
    </div>
  );
}
