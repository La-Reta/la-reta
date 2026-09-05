import { GROUP_COLOR, positionGroup } from "@/lib/constants";
import type { Player } from "@/lib/db/schema";
import { flagEmoji } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { FifaCard } from "../shared/fifa-card";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";

export const Spotlight = ({
  title,
  subtitle,
  player,
  statValue,
  statLabel,
  note,
  footer,
  contentClassName,
  contentStyle,
  secondAction,
  highlight = false,
}: {
  readonly title: string;
  readonly subtitle: string;
  readonly player: Player;
  readonly statValue: number;
  readonly statLabel: string;
  readonly note?: string;
  /** Optional footer (e.g. rotation dots) rendered as a bordered CardFooter. */
  readonly footer?: React.ReactNode;
  /** Extra classes/style on the body, so a parent can animate only the content. */
  readonly contentClassName?: string;
  readonly contentStyle?: React.CSSProperties;
  readonly secondAction?: React.ReactNode;
  /** Aro giratorio alrededor de la tarjeta. Solo para "El crack". */
  readonly highlight?: boolean;
}) => {
  return (
    <Card className={cn(footer && "pb-0", highlight && "crack-ring")} size="sm">
      <CardHeader className="border-b">
        <CardTitle className="font-display text-lg font-semibold tracking-wide uppercase">
          {title}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {subtitle}
        </CardDescription>
      </CardHeader>
      <CardContent
        className={cn("flex flex-1 items-center gap-4", contentClassName)}
        style={contentStyle}
      >
        <Link
          href={`/players/${player.id}`}
          className="w-28 shrink-0 transition-transform hover:-translate-y-1"
        >
          <FifaCard player={player} size="sm" className="card-shine" />
        </Link>
        <div className="min-w-0">
          <p className="font-display text-2xl leading-none font-bold uppercase">
            {player.displayName}
          </p>
          <p className="text-muted-foreground truncate text-sm">
            {player.name}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="inline-flex rounded-sm px-1.5 py-0.5 text-xs font-bold text-white"
              style={{
                backgroundColor: GROUP_COLOR[positionGroup(player.position)],
              }}
            >
              {player.position}
            </span>
            <span className="text-sm" aria-hidden="true">
              {flagEmoji(player.nationality)}
            </span>
            <span className="sr-only">{player.nationality}</span>
          </div>
          <p className="mt-1.5 font-mono text-3xl font-black tabular-nums">
            {statValue}
            <span className="text-muted-foreground ml-1 text-xs font-medium">
              {statLabel}
            </span>
          </p>
          {note ? (
            <p className="text-muted-foreground text-xs">{note}</p>
          ) : null}
          <div className="flex flex-wrap items-center justify-start gap-2">
            <Button
              variant="default"
              className="mt-3"
              render={<Link href={`/players/${player.id}`} />}
            >
              Ver ficha
              <ArrowRightIcon />
            </Button>
            {secondAction ?? null}
          </div>
        </div>
      </CardContent>
      {footer ? (
        // <fieldset> pediría un <legend> y trae estilos propios; para un grupo
        // de botones de rotación (no un formulario) role="group" es el patrón
        // correcto de ARIA.
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        <CardFooter
          className="justify-center overflow-hidden border-t px-3 pt-2! pb-3!"
          role="group"
          aria-label="Navegar goleadores empatados"
        >
          {footer}
        </CardFooter>
      ) : null}
    </Card>
  );
};
