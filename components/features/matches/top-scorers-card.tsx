import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { TopScorer } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";

/** Row contents shared by roster (linked) and guest (static) scorers. */
function ScorerRow({
  scorer,
  rank,
  linked,
}: {
  scorer: TopScorer;
  rank: number;
  linked: boolean;
}) {
  return (
    <>
      <span
        className={cn(
          "font-display text-muted-foreground w-4 text-center font-bold tabular-nums",
          linked && "group-hover:text-primary",
        )}
      >
        {rank}
      </span>
      <span
        className={cn(
          "flex min-w-0 items-center gap-1.5 truncate transition-colors",
          linked && "group-hover:text-primary",
        )}
      >
        <span className="truncate">{scorer.name}</span>
        {scorer.isGuest ? (
          <Badge variant="outline" className="shrink-0 text-[10px]">
            invitado
          </Badge>
        ) : null}
      </span>
      <span className="text-muted-foreground ml-auto text-[10px]">
        {scorer.matches} {scorer.matches === 1 ? "partido" : "partidos"}
      </span>
      <span className="w-6 text-right font-mono font-bold tabular-nums">
        {scorer.goals}
      </span>
      <ChevronRightIcon
        className={cn(
          "text-muted-foreground size-3.5 shrink-0 transition-opacity",
          linked ? "opacity-0 group-hover:opacity-100" : "opacity-0",
        )}
      />
    </>
  );
}

export function TopScorersCard({ scorers }: { scorers: TopScorer[] }) {
  return (
    <Card className="h-fit" size="sm">
      <CardContent className="p-0">
        {scorers.length === 0 ? (
          <p className="text-muted-foreground p-4 text-xs">
            Aún sin goles registrados.
          </p>
        ) : (
          <ol>
            {scorers.map((s, i) => (
              <li key={s.key} className="border-b last:border-b-0">
                {s.isGuest ? (
                  // Guests have no player profile — a static row, no link.
                  <div className="flex items-center gap-2 px-3 py-2 text-sm">
                    <ScorerRow scorer={s} rank={i + 1} linked={false} />
                  </div>
                ) : (
                  <Link
                    href={`/players/${s.playerId}`}
                    className="hover:bg-muted group flex items-center gap-2 px-3 py-2 text-sm transition-colors"
                  >
                    <ScorerRow scorer={s} rank={i + 1} linked />
                  </Link>
                )}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
