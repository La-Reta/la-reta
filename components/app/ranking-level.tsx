import { CREDIX_RED } from "@/constants/colors";
import { GROUP_COLOR, positionGroup } from "@/lib/constants";
import { Player } from "@/lib/db/schema";
import { flagEmoji } from "@/lib/format";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";

export function RankingLevel({ players }: { players: Player[] }) {
  const ranking = players.slice(0, 6);
  return (
    <Card className="h-fit">
      <CardHeader className="border-b">
        <CardTitle className="font-display text-lg font-semibold tracking-wide uppercase">
          Ranking de nivel
        </CardTitle>
        <CardAction>
          <Button variant="default" render={<Link href="/players" />}>
            Todos
            <ArrowRightIcon />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ol>
          {ranking.map((p, i) => (
            <li key={p.id}>
              <Link
                href={`/players/${p.id}`}
                className="hover:bg-muted/60 flex items-center gap-3 border-b px-4 py-2 text-sm last:border-b-0"
              >
                <span
                  className="font-display w-5 text-center text-base font-bold tabular-nums"
                  style={{ color: i === 0 ? CREDIX_RED : undefined }}
                >
                  {i + 1}
                </span>
                <span
                  className="inline-flex min-w-9 justify-center rounded-sm px-1.5 py-0.5 text-[10px] font-bold text-white"
                  style={{
                    backgroundColor: GROUP_COLOR[positionGroup(p.position)],
                  }}
                >
                  {p.position}
                </span>
                <span className="truncate font-medium">{p.name}</span>
                <span className="ml-auto shrink-0">
                  {flagEmoji(p.nationality)}
                </span>
                <span className="w-8 shrink-0 text-right font-mono font-bold tabular-nums">
                  {p.overall}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
