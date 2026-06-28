import type { Player } from "@/lib/db/schema";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { FifaCard } from "../shared/fifa-card";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
}: {
  title: string;
  subtitle: string;
  player: Player;
  statValue: number;
  statLabel: string;
  note?: string;
}) {
  return (
    <Card className="h-fit">
      <CardHeader className="border-b">
        <CardTitle className="font-display text-lg font-semibold tracking-wide uppercase">
          {title}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {subtitle}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
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
          <p className="mt-2 font-mono text-3xl font-black tabular-nums">
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
            size="xs"
            className="mt-3"
            render={<Link href={`/players/${player.id}`} />}
          >
            Ver ficha
            <ArrowRightIcon />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
