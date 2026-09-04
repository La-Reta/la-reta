import { MatchHistoryCard } from "@/components/features/matches/match-history-card";
import { Card, CardContent } from "@/components/ui/card";
import type { MatchWithScorers } from "@/lib/queries";

export function MatchHistoryList({
  matches,
  admin,
}: {
  matches: MatchWithScorers[];
  admin: boolean;
}) {
  if (matches.length === 0) {
    return (
      <Card size="sm">
        <CardContent className="py-6 text-center">
          <p className="text-muted-foreground text-sm">
            Aún no hay partidos registrados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="space-y-3">
      {matches.map((m) => (
        <li key={m.id}>
          <MatchHistoryCard match={m} admin={admin} />
        </li>
      ))}
    </ul>
  );
}
