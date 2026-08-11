import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { initials } from "@/lib/format";
import { VOTE_CATEGORIES, VoteCategory } from "@/lib/match-votes";
import { cn } from "@/lib/utils";
import { CheckCircle2Icon, RotateCcwIcon } from "lucide-react";
import { VoteCandidate } from ".";
import { CAT_META } from "./cat-meta";
import { teamDot } from "./team-dot";

/** Votación abierta: selector de categoría + una sola lista (compacto). */
export function VotingPanel({
  activeCat,
  setActiveCat,
  listFor,
  liveMyVotes,
  canVote,
  pending,
  onVote,
  onReset,
  votedCount,
}: {
  activeCat: VoteCategory;
  setActiveCat: (c: VoteCategory) => void;
  listFor: (c: VoteCategory) => (VoteCandidate & { count: number })[];
  liveMyVotes: Record<string, string>;
  canVote: boolean;
  pending: boolean;
  onVote: (c: VoteCategory, cand: VoteCandidate) => void;
  onReset: (c: VoteCategory) => void;
  votedCount: number;
}) {
  const cat = VOTE_CATEGORIES.find((c) => c.key === activeCat)!;
  const meta = CAT_META[cat.key];
  const list = listFor(cat.key);
  const max = Math.max(1, ...list.map((c) => c.count));
  const myKey = liveMyVotes[cat.key];
  const alreadyVoted = Boolean(myKey);
  // Con cuenta siempre se puede tocar: votar por otro reemplaza tu voto.
  const interactive = canVote;

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-4 p-3 sm:p-4">
        {/* Selector de categoría */}
        <div className="bg-muted grid grid-cols-3 gap-1 rounded-2xl p-1">
          {VOTE_CATEGORIES.map((c) => {
            const m = CAT_META[c.key];
            const Icon = m.icon;
            const active = activeCat === c.key;
            const voted = Boolean(liveMyVotes[c.key]);
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setActiveCat(c.key)}
                aria-pressed={active}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 rounded-xl px-1 py-2 text-xs font-semibold transition-colors",
                  active
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-lg [&_svg]:size-4",
                    active ? m.chip : "bg-background/50",
                  )}
                >
                  <Icon />
                </span>
                {c.short}
                {voted ? (
                  <CheckCircle2Icon className="absolute top-1 right-1 size-3.5 text-emerald-500" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Título de la categoría activa + reset de tu voto */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{cat.label}</p>
            <p className="text-muted-foreground text-xs">
              {alreadyVoted
                ? "Ya votaste aquí. Toca a otro para cambiar tu voto, o quítalo."
                : cat.description}
            </p>
          </div>
          {canVote && alreadyVoted ? (
            <Button
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => onReset(cat.key)}
              className="shrink-0"
            >
              <RotateCcwIcon />
              Quitar voto
            </Button>
          ) : null}
        </div>

        {/* Candidatos: grid responsive con gap para no equivocar el voto */}
        <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => {
            const mine = myKey === c.key;
            const share = Math.round((c.count / max) * 100);
            const cls = cn(
              "block w-full rounded-xl px-2 py-1.5 text-left transition-colors",
              mine && "bg-muted/70 ring-primary/40 ring-1",
              interactive && "hover:bg-muted cursor-pointer",
            );
            const row = (
              <div className="flex items-center gap-3">
                <Avatar className="size-8 shrink-0">
                  {c.photoUrl ? <AvatarImage src={c.photoUrl} alt="" /> : null}
                  <AvatarFallback className="text-[10px] font-semibold">
                    {initials(c.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        teamDot(c.team) ? "" : "bg-muted-foreground",
                      )}
                      style={
                        teamDot(c.team)
                          ? { backgroundColor: teamDot(c.team)! }
                          : undefined
                      }
                    />
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {c.name}
                    </span>
                    {mine ? (
                      <Badge
                        variant="secondary"
                        className="shrink-0 text-[10px]"
                      >
                        tu voto
                      </Badge>
                    ) : null}
                    <span className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
                      {c.count}
                    </span>
                  </div>
                  <div className="bg-muted mt-1 h-1 overflow-hidden rounded-full">
                    <div
                      className={cn("h-full rounded-full", meta.bar)}
                      style={{ width: `${c.count > 0 ? share : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            );
            return (
              <li key={c.key}>
                {interactive ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => onVote(cat.key, c)}
                    className={cn(cls, "disabled:opacity-60")}
                  >
                    {row}
                  </button>
                ) : (
                  <div className={cls}>{row}</div>
                )}
              </li>
            );
          })}
        </ul>

        {/* Progreso de tu votación */}
        {canVote ? (
          <div className="flex items-center justify-between border-t pt-3 text-xs">
            <span className="text-muted-foreground">
              Has votado {votedCount} de {VOTE_CATEGORIES.length} premios
            </span>
            <div className="flex gap-1">
              {VOTE_CATEGORIES.map((c) => (
                <span
                  key={c.key}
                  className={cn(
                    "size-1.5 rounded-full",
                    liveMyVotes[c.key]
                      ? "bg-primary"
                      : "bg-muted-foreground/30",
                  )}
                />
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
