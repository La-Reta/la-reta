import { VoteCategory } from "@/lib/match-votes";
import { GoalIcon, LucideIcon, ThumbsDownIcon, TrophyIcon } from "lucide-react";

export const CAT_META: Record<
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
