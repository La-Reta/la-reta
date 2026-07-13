"use client";

import { CasacaHistory } from "@/components/features/casacas/casaca-history";
import { WheelPanel } from "@/components/features/casacas/wheel-panel";
import { WinnerDialog } from "@/components/features/casacas/winner-dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useCasacaWheel } from "@/hooks/use-casaca-wheel";
import type { Player } from "@/lib/db/schema";
import type { CasacaAssignmentRow } from "@/lib/queries";
import { ShirtIcon } from "lucide-react";

function EmptyPool() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ShirtIcon />
        </EmptyMedia>
        <EmptyTitle>No hay jugadores</EmptyTitle>
        <EmptyDescription>
          Selecciona a los que jugaron en{" "}
          <a href="/teams" className="underline">
            Armar equipos
          </a>{" "}
          o registra jugadores para girar la ruleta.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function CasacasClient({
  players,
  assignments,
  canManage,
}: {
  players: Player[];
  assignments: CasacaAssignmentRow[];
  canManage: boolean;
}) {
  const wheel = useCasacaWheel({ players, assignments, canManage });

  if (wheel.pool.length === 0) return <EmptyPool />;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <WheelPanel wheel={wheel} />
      <CasacaHistory assignments={assignments} />
      <WinnerDialog winner={wheel.winner} onClose={wheel.dismissWinner} />
    </div>
  );
}
