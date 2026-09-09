import { useCallback } from "react";
import { computeReta } from "@/lib/functions/compute-reta";

export function useGetMatchDaysUntil() {
  return useCallback(() => {
    const { daysUntil } = computeReta(new Date());
    return daysUntil;
  }, []);
}
