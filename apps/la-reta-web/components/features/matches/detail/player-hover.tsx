"use client";

import { PlayerHoverCard } from "@/components/shared/player-hover-card";
import type { Scorer } from "@/lib/queries";
import type { ReactElement } from "react";

/**
 * Adaptador de `Scorer` a la ficha al vuelo compartida. Las tres cifras aquí
 * son las de **ese partido**, no las de la ficha: es lo que se está mirando.
 */
export const PlayerHover = ({
  scorer,
  teamName,
  teamColor,
  children,
}: {
  readonly scorer: Scorer;
  readonly teamName: string;
  readonly teamColor?: string;
  /** El nombre del jugador tal como se pinta en la lista. */
  readonly children: ReactElement;
}) => {
  if (scorer.isGuest) return children;

  return (
    <PlayerHoverCard
      displayName={scorer.displayName}
      name={scorer.name}
      nationality={scorer.nationality}
      note={teamName}
      noteColor={teamColor}
      overall={scorer.overall}
      photoUrl={scorer.photoUrl}
      playerId={scorer.playerId}
      position={scorer.position}
      stats={[
        { label: "OVR", value: scorer.overall ?? "—" },
        { label: "Goles", value: scorer.goals },
        { label: "Asist.", value: scorer.assists },
      ]}
    >
      {children}
    </PlayerHoverCard>
  );
};
