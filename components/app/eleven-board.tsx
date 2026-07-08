import { GROUP_COLOR, GROUP_LABEL, PositionGroup } from "@/lib/constants";
import { Player } from "@/lib/db";
import Link from "next/link";
import { LineupBoard } from "../features/dashboard/lineup-board";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";

export function ElevenBoard({
  players,
  counts,
}: {
  players: Player[];
  counts: Record<PositionGroup, number>;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="font-display text-lg font-semibold tracking-wide uppercase">
          Once ideal
        </CardTitle>
        <CardDescription>El mejor por línea · esquema 4-3-3</CardDescription>
        <CardAction>
          <span className="font-display bg-foreground text-background rounded-sm px-2 py-1 text-xs font-bold tracking-wider uppercase">
            4-3-3
          </span>
          <Link
            href={"/players"}
            className="font-display bg-primary text-background ms-2 rounded-sm px-2 py-1 text-xs font-bold tracking-wider uppercase"
          >
            Ver todos los jugadores
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="p-0">
        <LineupBoard players={players} />
      </CardContent>
      <CardFooter className="flex-wrap gap-x-4 gap-y-1">
        {(Object.keys(counts) as PositionGroup[]).map((g) => (
          <span key={g} className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: GROUP_COLOR[g] }}
            />
            <span className="text-muted-foreground">{GROUP_LABEL[g]}</span>
            <span className="font-mono font-bold tabular-nums">
              {counts[g]}
            </span>
          </span>
        ))}
      </CardFooter>
    </Card>
  );
}
