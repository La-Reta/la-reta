"use client";

import { castMatchVote, resetMatchVote } from "@/app/actions/match-votes";
import { SectionHeading } from "@/components/shared/section-heading";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMatchVotes } from "@/hooks/use-match-votes";
import {
  candidateKey,
  VOTE_CATEGORIES,
  type VoteCategory,
} from "@/lib/match-votes";
import type { VoteTally } from "@/lib/queries";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { LockIcon, LogInIcon, UserRoundPlusIcon } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { ClosedResults } from "./closed-results";
import { VotingPanel } from "./voting-panel";

export type VoteCandidate = {
  key: string;
  playerId: number | null;
  guestName: string | null;
  name: string;
  photoUrl: string | null;
  team: string | null;
  isGuest: boolean;
};

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
  console.log("MatchMvpVoting render", {
    votedCount,
    liveMyVotes,
    tally,
    myVotes,
  });

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionHeading title="Gol, Error y Figura" />
        <Badge variant={"default"}>
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

      {votingOpen && !canVote ? (
        <Alert>
          <LogInIcon />
          <AlertTitle>Inicia sesión para votar</AlertTitle>
          <AlertDescription>
            Necesitas una cuenta para elegir la figura, el golazo y el error del
            partido.
          </AlertDescription>
          <AlertAction className="flex flex-wrap gap-2">
            <SignInButton mode="modal">
              <Button variant="secondary">
                <LogInIcon />
                Iniciar sesión
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button>
                <UserRoundPlusIcon />
                Crear cuenta
              </Button>
            </SignUpButton>
          </AlertAction>
        </Alert>
      ) : null}

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
