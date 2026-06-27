"use client";

import * as React from "react";

export function useLiveMatchClock(active: boolean, startedAt: number | null) {
  const [nowTick, setNowTick] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!active || !startedAt) return;

    const intervalId = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [active, startedAt]);

  if (!active || !startedAt) return 0;

  const reference = nowTick ?? startedAt;
  return Math.max(0, Math.floor((reference - startedAt) / 1000));
}
