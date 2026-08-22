import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { TopScorer } from "@/lib/queries";
import { cn } from "@/lib/utils";
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
          "font-display text-muted-foreground w-4 shrink-0 text-center font-bold tabular-nums",
          linked && "group-hover:text-primary",
        )}
      >
        {rank}
      </span>
      <span
        className={cn(
          "flex min-w-0 flex-1 items-center gap-1.5 truncate transition-colors",
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
      <span className="text-muted-foreground w-5 shrink-0 text-right font-mono text-xs tabular-nums">
        {scorer.goals}
      </span>
      <span className="text-muted-foreground w-5 shrink-0 text-right font-mono text-xs tabular-nums">
        {scorer.assists}
      </span>
      <span className="w-7 shrink-0 text-right font-mono text-sm font-bold tabular-nums">
        {scorer.contributions}
      </span>
    </>
  );
}

export function TopScorersCard({ scorers }: { scorers: TopScorer[] }) {
  return (
    <Card className="h-fit" size="sm" id="top-scorers-content">
      <CardContent className="p-0">
        {scorers.length === 0 ? (
          <h2 className="text-muted-foreground p-4 text-xs">
            Aún sin goles ni asistencias registrados.
          </h2>
        ) : (
          <>
            {/* Column headers: G = goles, A = asistencias, G+A = total. */}
            <div className="text-muted-foreground flex items-center gap-2 border-b px-3 py-1.5 text-[10px] font-semibold tracking-wide uppercase">
              <span className="w-4 shrink-0" />
              <span className="flex-1" />
              <span className="w-5 shrink-0 text-right">G</span>
              <span className="w-5 shrink-0 text-right">A</span>
              <span className="w-7 shrink-0 text-right">G+A</span>
            </div>
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
