import { CREDIX_RED } from "@/constants/colors";
import { GROUP_COLOR, positionGroup } from "@/lib/constants";
import { Player } from "@/lib/db";
import { flagEmoji } from "@/lib/format";
import Link from "next/link";

export function RankingLevelItem({
  player,
  index,
}: {
  player: Player;
  index: number;
}) {
  return (
    <li>
      <Link
        href={`/players/${player.id}`}
        className="hover:bg-muted/60 flex items-center gap-3 rounded-xl border-b px-4 py-2 text-sm last:border-b-0"
      >
        <span
          className="font-display w-5 text-center text-base font-bold tabular-nums"
          style={{ color: index === 0 ? CREDIX_RED : undefined }}
        >
          {index + 1}
        </span>
        <span
          className="inline-flex min-w-9 justify-center rounded-sm px-1.5 py-0.5 text-[10px] font-bold text-white"
          style={{
            backgroundColor: GROUP_COLOR[positionGroup(player.position)],
          }}
        >
          {player.position}
        </span>
        <span className="truncate font-medium">{player.name}</span>
        <span className="ml-auto shrink-0">
          {flagEmoji(player.nationality)}
        </span>
        <span className="w-8 shrink-0 text-right font-mono font-bold tabular-nums">
          {player.overall}
        </span>
      </Link>
    </li>
  );
}
