"use client";

import { Button } from "@/components/ui/button";
import {
  CalendarClockIcon,
  RadioIcon,
  ShuffleIcon,
  UserRoundPlusIcon,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

// ponytail: la reta cae cada 14 días. Ancla = próximo jueves conocido; edítala
// a tu fecha real y todo lo demás se deriva sola.
const RETA_ANCHOR = "2026-07-09"; // jueves
const KICKOFF_HOUR = 20; // 20:00 hrs
const DAY_MS = 86_400_000;
const SHOW_WITHIN_DAYS = 2; // muestra cuando falten ≤2 días; se oculta pasada la reta

function midnight(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Días hasta la próxima reta (0 = hoy) y su hora de arranque. */
export function computeReta(now: Date) {
  const todayMid = midnight(now).getTime();
  const anchorMid = midnight(new Date(`${RETA_ANCHOR}T00:00:00`)).getTime();
  const elapsedDays = Math.round((todayMid - anchorMid) / DAY_MS);
  const mod = ((elapsedDays % 14) + 14) % 14;
  const daysUntil = mod === 0 ? 0 : 14 - mod;
  const kickoff = new Date(todayMid + daysUntil * DAY_MS);
  kickoff.setHours(KICKOFF_HOUR, 0, 0, 0);
  return { daysUntil, kickoff };
}

const dateFmt = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const pad = (n: number) => String(n).padStart(2, "0");

export function RetaCountdownBanner() {
  const [mounted, setMounted] = React.useState(false);

  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    let timer: ReturnType<typeof setTimeout>;
    // Re-evalúa la ventana solo en cada medianoche local (no hay polling).
    const schedule = () => {
      const now = new Date();
      const next = midnight(new Date(now.getTime() + DAY_MS)).getTime() + 1000;
      timer = setTimeout(() => {
        setTick((t) => t + 1);
        schedule();
      }, next - now.getTime());
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null; // evita mismatch SSR y costo cero fuera de la ventana

  const { daysUntil, kickoff } = computeReta(new Date());
  if (daysUntil > SHOW_WITHIN_DAYS) return null;

  return <Banner kickoff={kickoff} isToday={daysUntil === 0} />;
}

function Banner({ kickoff, isToday }: { kickoff: Date; isToday: boolean }) {
  // El ticker de 1s solo vive mientras el banner está montado (≤2 días al mes).
  const [remaining, setRemaining] = React.useState(
    () => kickoff.getTime() - Date.now(),
  );
  React.useEffect(() => {
    const id = setInterval(
      () => setRemaining(kickoff.getTime() - Date.now()),
      1000,
    );
    return () => clearInterval(id);
  }, [kickoff]);

  const kicked = remaining <= 0; // ya pasó la hora, pero sigue siendo el día
  const totalSec = Math.max(0, Math.floor(remaining / 1000));
  const units = [
    { label: "Días", value: String(Math.floor(totalSec / 86_400)) },
    { label: "Horas", value: pad(Math.floor((totalSec % 86_400) / 3_600)) },
    { label: "Min", value: pad(Math.floor((totalSec % 3_600) / 60)) },
    { label: "Seg", value: pad(totalSec % 60) },
  ];

  const dateLabel = cap(dateFmt.format(kickoff));
  const accent = isToday ? "text-amber-300" : "text-emerald-300";
  const dot = isToday ? "bg-amber-400" : "bg-emerald-400";

  return (
    <section
      className="ring-foreground/10 relative overflow-hidden rounded-lg text-white ring-1"
      style={{
        background:
          "radial-gradient(120% 140% at 0% 0%, rgba(52,211,153,0.16), transparent 45%), linear-gradient(135deg,#0b1224 0%,#141b3d 55%,#0b1224 100%)",
      }}
      aria-label={
        kicked
          ? `La reta es hoy, ${dateLabel} a las ${KICKOFF_HOUR}:00`
          : `Faltan ${units[0].value} días para la reta del ${dateLabel}`
      }
    >
      {/* Barrido de reflector — un solo acento en movimiento */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-y-8 -left-1/3 w-1/2 -skew-x-12 bg-white/[0.04] blur-2xl motion-safe:animate-pulse"
      />

      <div className="relative flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <span className="font-display inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.22em] uppercase">
            <span className="relative flex size-2">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 motion-safe:animate-ping ${dot}`}
              />
              <span
                className={`relative inline-flex size-2 rounded-full ${dot}`}
              />
            </span>
            <span className={accent}>
              {isToday ? "Hoy juega la reta" : "Cuenta regresiva"}
            </span>
          </span>

          <h2 className="font-display mt-1.5 text-3xl leading-none font-bold tracking-tight uppercase sm:text-4xl">
            {kicked ? "¡Es hora de la reta!" : "La próxima reta"}
          </h2>

          <p className="mt-2 flex items-center gap-1.5 text-sm text-white/70">
            <CalendarClockIcon className="size-4 shrink-0 text-white/50" />
            <span className="truncate">
              {dateLabel} · {pad(KICKOFF_HOUR)}:00 hrs
            </span>
          </p>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="shrink-0"
              render={<Link href="/players/registro" />}
            >
              <UserRoundPlusIcon />
              Registrarme
            </Button>
            <Button
              variant="default"
              size="sm"
              className="shrink-0"
              render={<Link href={kicked ? "/live" : "/teams"} />}
            >
              {kicked ? (
                <>
                  <RadioIcon />
                  Ir al live
                </>
              ) : (
                <>
                  <ShuffleIcon />
                  Armar equipos
                </>
              )}
            </Button>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-4 sm:flex-row sm:items-center">
            {!kicked && (
              <div className="flex gap-2" aria-hidden="true">
                {units.map((u) => (
                  <div
                    key={u.label}
                    className="w-16 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-2.5 text-center backdrop-blur-sm"
                  >
                    <div className="bg-gradient-to-b from-white to-emerald-200/80 bg-clip-text font-mono text-2xl leading-none font-black text-transparent tabular-nums sm:text-3xl">
                      {u.value}
                    </div>
                    <div className="font-display mt-1 text-[9px] font-semibold tracking-[0.18em] text-white/45 uppercase">
                      {u.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
