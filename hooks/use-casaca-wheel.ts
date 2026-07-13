"use client";

import { recordCasacaSpin } from "@/app/actions/casacas";
import type { WheelSegment } from "@/components/features/casacas/wheel";
import {
  RESTING_COUNT,
  eligiblePlayerIds,
  pickWinner,
  rotationForWinner,
} from "@/lib/casacas";
import type { Player } from "@/lib/db/schema";
import { isGuest } from "@/lib/guests";
import type { CasacaAssignmentRow } from "@/lib/queries";
import { guestsAtom, selectedIdsAtom } from "@/lib/state/atoms";
import { useAtomValue } from "jotai";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export type CasacaWheel = ReturnType<typeof useCasacaWheel>;

/**
 * All the state + business logic behind the casacas wheel: which players are in
 * play, who's resting, the spin animation, and persisting the winner. The UI
 * components stay presentational and read from what this returns.
 */
export function useCasacaWheel({
  players,
  assignments,
  canManage,
}: {
  players: Player[];
  assignments: CasacaAssignmentRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const selectedIds = useAtomValue(selectedIdsAtom);
  const guests = useAtomValue(guestsAtom);

  // Wheel pool = roster picked in /teams (or the whole roster if none picked)
  // plus every last-minute guest, so guests can wash the casacas too.
  const pool = useMemo(() => {
    const set = new Set(selectedIds);
    const picked = players.filter((p) => set.has(p.id));
    const roster = picked.length > 0 ? picked : players;
    return [...roster, ...guests];
  }, [players, selectedIds, guests]);

  // Last distinct roster winners sit out (newest first). Guests never accumulate
  // rest turns (they may not return), so they stay eligible — acceptable ceiling.
  const recentWinnerIds = useMemo(() => {
    const out: number[] = [];
    for (const a of assignments) {
      if (a.playerId == null || out.includes(a.playerId)) continue;
      out.push(a.playerId);
      if (out.length >= RESTING_COUNT) break;
    }
    return out;
  }, [assignments]);

  const restingSet = useMemo(
    () => new Set(recentWinnerIds.slice(0, RESTING_COUNT)),
    [recentWinnerIds],
  );
  const dimIndexes = useMemo(
    () =>
      new Set(
        pool
          .map((p, i) => (restingSet.has(p.id) ? i : -1))
          .filter((i) => i >= 0),
      ),
    [pool, restingSet],
  );
  const restingPlayers = useMemo(
    () => pool.filter((p) => restingSet.has(p.id)),
    [pool, restingSet],
  );

  const segments: WheelSegment[] = useMemo(
    () => pool.map((p) => ({ id: p.id, label: p.displayName })),
    [pool],
  );

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [pendingWinnerId, setPendingWinnerId] = useState<number | null>(null);

  const canSpin = canManage && pool.length >= 2 && !spinning;

  function spin() {
    if (!canSpin) return;
    const eligible = eligiblePlayerIds(
      pool.map((p) => p.id),
      recentWinnerIds,
    );
    const winnerId = pickWinner(eligible);
    if (winnerId == null) return;
    const index = pool.findIndex((p) => p.id === winnerId);
    if (index < 0) return;

    setWinner(null);
    setPendingWinnerId(winnerId);
    setSpinning(true);
    setRotation((r) => rotationForWinner(index, pool.length, r));
  }

  async function onSpinEnd() {
    setSpinning(false);
    const id = pendingWinnerId;
    if (id == null) return;
    const won = pool.find((p) => p.id === id) ?? null;
    setWinner(won);
    if (!won) return;

    const res = await recordCasacaSpin(
      isGuest(won) ? { guestName: won.displayName } : { playerId: won.id },
    );
    if (res.ok) router.refresh();
    else toast.error(res.error);
  }

  return {
    pool,
    selectedCount: selectedIds.length,
    guestPlayers: guests,
    restingPlayers,
    dimIndexes,
    segments,
    rotation,
    spinning,
    winner,
    canManage,
    canSpin,
    spin,
    onSpinEnd,
    dismissWinner: () => setWinner(null),
  };
}
