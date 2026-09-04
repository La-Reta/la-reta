import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { initials } from "@/lib/format";
import { VOTE_CATEGORIES, VoteCategory } from "@/lib/match-votes";
import { cn } from "@/lib/utils";
import { VoteCandidate } from ".";
import { CAT_META } from "./cat-meta";

/** Votación cerrada: podio compacto con el ganador de cada categoría. */
export function ClosedResults({
  listFor,
}: {
  listFor: (c: VoteCategory) => (VoteCandidate & { count: number })[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {VOTE_CATEGORIES.map((cat) => {
        const meta = CAT_META[cat.key];
        const Icon = meta.icon;
        const list = listFor(cat.key);

        const total = list.reduce((n, c) => n + c.count, 0);
        if (total === 0) return null;

        const winner = (list[0]?.count ?? 0) > 0 ? list[0] : null;
        return (
          <Card key={cat.key} className="overflow-hidden">
            <div
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 text-xs font-semibold tracking-wide uppercase",
                meta.chip,
              )}
            >
              <Icon className="size-4" />
              {cat.short}
            </div>
            <CardContent className="flex flex-col items-center gap-1 py-6 text-center">
              {winner ? (
                <>
                  <Avatar className="size-14">
                    {winner.photoUrl ? (
                      <AvatarImage src={winner.photoUrl} alt="" />
                    ) : null}
                    <AvatarFallback className="text-sm font-bold">
                      {initials(winner.name)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-display mt-1 max-w-full truncate text-lg font-bold">
                    {winner.name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {winner.count} de {total} voto{total === 1 ? "" : "s"}
                    {winner.isGuest ? " · invitado" : ""}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground py-4 text-sm">
                  Sin votos en esta categoría.
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
