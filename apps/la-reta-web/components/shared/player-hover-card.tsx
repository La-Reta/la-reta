"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { GROUP_COLOR, isPosition, positionGroup } from "@/lib/constants";
import { flagEmoji, initials } from "@/lib/format";
import { cardTier } from "@/lib/ratings";
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

/** Cada escalón de carta, con su color; el mismo lenguaje que la FifaCard. */
const TIER_RING = {
  special: "ring-indigo-400/60",
  gold: "ring-amber-400/70",
  silver: "ring-zinc-400/60",
  bronze: "ring-amber-700/60",
} as const;

export type PlayerHoverStat = {
  readonly label: string;
  readonly value: ReactNode;
};

const Stat = ({ label, value }: PlayerHoverStat) => (
  <div className="text-center">
    <p className="font-mono text-lg leading-none font-black tabular-nums">
      {value}
    </p>
    <p className="text-muted-foreground mt-0.5 text-xs font-semibold tracking-wide uppercase">
      {label}
    </p>
  </div>
);

/**
 * Ficha al vuelo de un jugador, al posar el puntero encima.
 *
 * Vive en `shared/` porque la usan dos sitios con datos distintos: el detalle
 * de un partido (goles y asistencias de ese partido) y el once ideal del
 * resumen (los atributos de la ficha). Por eso las tres cifras entran como
 * `stats` y la línea de contexto —el equipo, en el partido— como `note`: es lo
 * único que cambia entre los dos, y duplicar la tarjeta entera para eso la
 * dejaba desincronizada al primer retoque.
 *
 * Sin `playerId` no hay ficha que enseñar (invitados de una reta): se devuelve
 * el hijo tal cual, porque un hover que solo dice "invitado" es ruido.
 */
export const PlayerHoverCard = ({
  playerId,
  name,
  displayName,
  position,
  nationality,
  photoUrl,
  overall,
  stats,
  note,
  noteColor,
  children,
}: {
  readonly playerId: number | null;
  readonly name: string;
  readonly displayName: string;
  readonly position: string | null;
  readonly nationality: string;
  readonly photoUrl: string | null;
  readonly overall: number | null;
  readonly stats: readonly PlayerHoverStat[];
  readonly note?: string | null;
  readonly noteColor?: string;
  /** El elemento sobre el que se posa el puntero, tal como ya se pinta. */
  readonly children: ReactElement;
}) => {
  if (playerId == null) return children;

  const tier = overall == null ? "bronze" : cardTier(overall);
  // `position` viaja como string desde la base; sin comprobarlo, cualquier
  // valor viejo o mal escrito reventaría el mapa de colores.
  const pos = isPosition(position) ? position : null;
  const group = pos ? positionGroup(pos) : null;

  return (
    <HoverCard>
      {/* El retardo vive en el trigger, no en el root: 220 ms evita que la
          ficha salte al cruzar la lista de paso. */}
      <HoverCardTrigger closeDelay={80} delay={220} render={children} />
      <HoverCardContent className="w-64">
        <div className="flex items-center gap-3">
          <Avatar className={`size-14 shrink-0 ring-2 ${TIER_RING[tier]}`}>
            {photoUrl ? (
              <AvatarImage
                alt={displayName}
                className="object-cover object-top"
                src={photoUrl}
                width={256}
              />
            ) : null}
            <AvatarFallback className="font-display font-bold">
              {initials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-display truncate text-lg leading-tight font-bold uppercase">
              {displayName}
            </p>
            <p className="text-muted-foreground truncate text-xs">{name}</p>
            <div className="mt-1 flex items-center gap-1.5">
              {pos && group ? (
                <span
                  className="rounded-sm px-1.5 py-0.5 text-xs font-bold text-white"
                  style={{ backgroundColor: GROUP_COLOR[group] }}
                >
                  {pos}
                </span>
              ) : null}
              <span aria-hidden="true" className="text-sm">
                {flagEmoji(nationality)}
              </span>
              <span className="sr-only">{nationality}</span>
            </div>
          </div>
        </div>

        {note ? (
          <p
            className="mt-3 truncate text-xs font-semibold"
            style={noteColor ? { color: noteColor } : undefined}
          >
            {note}
          </p>
        ) : null}

        <div className="mt-2 grid grid-cols-3 gap-2 border-t pt-2">
          {stats.map((s) => (
            <Stat key={s.label} label={s.label} value={s.value} />
          ))}
        </div>

        <Link
          className="text-primary mt-3 block text-center text-xs font-medium hover:underline"
          href={`/players/${playerId}`}
          transitionTypes={["nav-forward"]}
        >
          Ver ficha completa
        </Link>
      </HoverCardContent>
    </HoverCard>
  );
};
