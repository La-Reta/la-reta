"use client";

import { castMatchVote, resetMatchVote } from "@/app/actions/match-votes";
import { SectionHeading } from "@/components/shared/section-heading";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMatchVotes } from "@/hooks/use-match-votes";
import { initials } from "@/lib/format";
import {
  candidateKey,
  VOTE_CATEGORIES,
  type VoteCategory,
} from "@/lib/match-votes";
import type { VoteTally } from "@/lib/queries";
import { cn } from "@/lib/utils";
import {
  CheckCircle2Icon,
  GoalIcon,
  LockIcon,
  RotateCcwIcon,
  ThumbsDownIcon,
  TrophyIcon,
  type LucideIcon,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

export type VoteCandidate = {
  key: string;
  playerId: number | null;
  guestName: string | null;
  name: string;
  team: string | null;
  isGuest: boolean;
};

const CAT_META: Record<
  VoteCategory,
  { icon: LucideIcon; chip: string; bar: string; text: string }
> = {
  figura: {
    icon: TrophyIcon,
    chip: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    bar: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  gol: {
    icon: GoalIcon,
    chip: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  error: {
    icon: ThumbsDownIcon,
    chip: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    bar: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
  },
};

function teamDot(team: string | null) {
  return team === "A"
    ? "bg-sky-500"
    : team === "B"
      ? "bg-rose-500"
      : "bg-muted-foreground";
}

export function MatchMvpVoting({
  matchId,
  candidates,
  tally,
  myVotes,
  canVote,
  votingOpen,
  closesLabel,
}: {
  matchId: number;
  candidates: VoteCandidate[];
  tally: VoteTally[];
  myVotes: Record<string, string>;
  canVote: boolean;
  votingOpen: boolean;
  closesLabel: string;
}) {
  const [pending, startTransition] = React.useTransition();
  // Datos "live": sembrados con lo del server, sondeados mientras esté abierta.
  const { data, refetch } = useMatchVotes(
    matchId,
    { tally, myVotes },
    votingOpen,
  );
  const liveTally = data.tally;
  const liveMyVotes = data.myVotes;

  // Categoría activa del selector: arranca en la primera que te falte votar.
  const [activeCat, setActiveCat] = React.useState<VoteCategory>(
    () =>
      (VOTE_CATEGORIES.find((c) => !myVotes[c.key]) ?? VOTE_CATEGORIES[0]).key,
  );

  if (candidates.length === 0) return null;

  function listFor(category: VoteCategory) {
    const counts = new Map<string, number>();
    for (const t of liveTally)
      if (t.category === category) counts.set(candidateKey(t), t.count);
    return [...candidates]
      .map((c) => ({ ...c, count: counts.get(c.key) ?? 0 }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }

  function vote(category: VoteCategory, c: VoteCandidate) {
    if (!canVote || !votingOpen || pending) return;
    startTransition(async () => {
      const res = await castMatchVote({
        matchId,
        category,
        playerId: c.playerId,
        guestName: c.guestName ?? undefined,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      refetch();
      // Auto-avanza a la siguiente categoría que te falte votar.
      const voted = new Set([...Object.keys(liveMyVotes), category]);
      const next = VOTE_CATEGORIES.find((cat) => !voted.has(cat.key));
      if (next) setActiveCat(next.key);
    });
  }

  function reset(category: VoteCategory) {
    if (!canVote || !votingOpen || pending) return;
    startTransition(async () => {
      const res = await resetMatchVote({ matchId, category });
      if (res.ok) {
        refetch();
        setActiveCat(category);
      } else {
        toast.error(res.error);
      }
    });
  }

  const votedCount = VOTE_CATEGORIES.filter((c) => liveMyVotes[c.key]).length;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionHeading title="Gol, Error y Figura" />
        <Badge variant={votingOpen ? "secondary" : "outline"}>
          {votingOpen ? (
            <>Vota hasta el {closesLabel}</>
          ) : (
            <>
              <LockIcon />
              Votación cerrada
            </>
          )}
        </Badge>
      </div>

      {votingOpen ? (
        <VotingPanel
          activeCat={activeCat}
          setActiveCat={setActiveCat}
          listFor={listFor}
          liveMyVotes={liveMyVotes}
          canVote={canVote}
          pending={pending}
          onVote={vote}
          onReset={reset}
          votedCount={votedCount}
        />
      ) : (
        <ClosedResults listFor={listFor} />
      )}
    </section>
  );
}

/** Votación abierta: selector de categoría + una sola lista (compacto). */
function VotingPanel({
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
  const interactive = canVote && !alreadyVoted;

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
                ? "Ya votaste aquí. Puedes resetear para volver a elegir."
                : canVote
                  ? cat.description
                  : "Inicia sesión o entra como admin para votar."}
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
              Resetear
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
              mine && "bg-muted/70 ring-1 ring-border",
              interactive && "hover:bg-muted cursor-pointer",
            );
            const row = (
              <div className="flex items-center gap-3">
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="text-[10px] font-semibold">
                    {initials(c.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        teamDot(c.team),
                      )}
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

/** Votación cerrada: podio compacto con el ganador de cada categoría. */
function ClosedResults({
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
