import { computeReta } from "@/lib/functions/compute-reta";
import React from "react";

export function useGetMatchDaysUntil() {
  return React.useCallback(() => {
    const { daysUntil } = computeReta(new Date());
    return daysUntil;
  }, []);
}
