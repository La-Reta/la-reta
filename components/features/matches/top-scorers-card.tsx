import { Card, CardContent } from "@/components/ui/card";
import type { TopScorer } from "@/lib/queries";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";

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
              <li key={s.playerId} className="border-b last:border-b-0">
                <Link
                  href={`/players/${s.playerId}`}
                  className="hover:bg-muted group flex items-center gap-2 px-3 py-2 text-sm transition-colors"
                >
                  <span className="font-display text-muted-foreground group-hover:text-primary w-4 text-center font-bold tabular-nums">
                    {i + 1}
                  </span>
                  <span className="group-hover:text-primary truncate transition-colors">
                    {s.name}
                  </span>
                  <span className="text-muted-foreground ml-auto text-[10px]">
                    {s.matches} {s.matches === 1 ? "partido" : "partidos"}
                  </span>
                  <span className="w-6 text-right font-mono font-bold tabular-nums">
                    {s.goals}
                  </span>
                  <ChevronRightIcon className="text-muted-foreground size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
