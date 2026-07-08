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

export function Spotlight({
  title,
  subtitle,
  player,
  statValue,
  statLabel,
  note,
  footer,
  contentClassName,
  contentStyle,
}: {
  title: string;
  subtitle: string;
  player: Player;
  statValue: number;
  statLabel: string;
  note?: string;
  /** Optional footer (e.g. rotation dots) rendered as a bordered CardFooter. */
  footer?: React.ReactNode;
  /** Extra classes/style on the body, so a parent can animate only the content. */
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
}) {
  return (
    <Card className={cn(footer && "pb-0")}>
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
          <FifaCard player={player} size="sm" />
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
              className="inline-flex rounded-sm px-1.5 py-0.5 text-[10px] font-bold text-white"
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
            <p className="text-muted-foreground text-[11px]">{note}</p>
          ) : null}
          <Button
            variant="default"
            className="mt-3"
            render={<Link href={`/players/${player.id}`} />}
          >
            Ver ficha
            <ArrowRightIcon />
          </Button>
        </div>
      </CardContent>
      {footer ? (
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
}
