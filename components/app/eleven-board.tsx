import { GROUP_COLOR, PositionGroup } from "@/lib/constants";
import { Player } from "@/lib/db";
import Link from "next/link";
import { LineupBoard } from "../features/dashboard/lineup-board";
import { Button } from "../ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";

// Plural, person-oriented labels so each chip reads as a plain count ("3 Porteros").
const GROUP_LABEL_PLURAL: Record<PositionGroup, string> = {
  GK: "Porteros",
  DEF: "Defensas",
  MID: "Mediocampistas",
  FWD: "Delanteros",
};

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
          <span className="font-display bg-foreground text-background rounded-sm px-2 py-1 font-bold tracking-wider uppercase">
            4-3-3
          </span>
          <Button
            render={
              <Link
                href={"/players"}
                className="font-display ms-2 font-bold tracking-wider uppercase"
              ></Link>
            }
          >
            Ver todos los jugadores
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="p-0">
        <LineupBoard players={players} />
      </CardContent>
      <CardFooter className="flex-col items-start gap-2">
        <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
          Plantel por posición
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {(Object.keys(counts) as PositionGroup[]).map((g) => (
            <span key={g} className="flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: GROUP_COLOR[g] }}
              />
              <span className="font-mono font-bold tabular-nums">
                {counts[g]}
              </span>
              <span className="text-muted-foreground">
                {GROUP_LABEL_PLURAL[g]}
              </span>
            </span>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}
