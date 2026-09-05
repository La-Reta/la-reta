import { MatchHistoryCard } from "@/components/features/matches/match-history-card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { MatchWithScorers } from "@/lib/queries";
import { CalendarOffIcon } from "lucide-react";

export const MatchHistoryList = ({
  matches,
  admin,
}: {
  readonly matches: MatchWithScorers[];
  readonly admin: boolean;
}) => {
  if (matches.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarOffIcon />
          </EmptyMedia>
          <EmptyTitle>Aún no hay partidos registrados</EmptyTitle>
          <EmptyDescription>
            Registra una reta arriba y el marcador, los goleadores y la gráfica
            aparecerán aquí.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ul className="space-y-3">
      {matches.map((m) => (
        <li key={m.id} className="reveal-on-scroll">
          <MatchHistoryCard match={m} admin={admin} />
        </li>
      ))}
    </ul>
  );
};
