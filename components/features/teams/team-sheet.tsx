import { Badge } from "@/components/ui/badge";
import { flagEmoji, playerPositions } from "@/lib/format";
import type { Lineup } from "@/lib/team-balancer";

export function TeamSheet({
  team,
  color,
  lineups,
  rating,
}: {
  team: string;
  color: string;
  lineups: Lineup[];
  rating: number;
}) {
  return (
    <div className="bg-card" style={{ borderTop: `3px solid ${color}` }}>
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <span className="flex items-center gap-2">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="font-display text-base font-bold tracking-wide uppercase">
            {team}
          </span>
        </span>
        <span className="text-muted-foreground text-xs">
          OVR{" "}
          <span className="text-foreground font-mono font-bold">{rating}</span>
        </span>
      </div>
      <ul className="divide-border divide-y border-t">
        {lineups.map(({ player, role }) => {
          const flexed = role !== player.position;
          return (
            <li
              key={player.id}
              className="flex items-center gap-2.5 px-4 py-2 text-sm"
            >
              <span
                className="grid size-7 shrink-0 place-items-center rounded-md font-mono text-xs font-bold tabular-nums"
                style={{ backgroundColor: `${color}1f`, color }}
              >
                {player.overall}
              </span>
              <Badge
                variant={role === "GK" ? "secondary" : "outline"}
                className="shrink-0"
              >
                {role}
              </Badge>
              <span className="min-w-0 truncate font-medium">{player.name}</span>
              {flexed && (
                <span className="text-muted-foreground shrink-0 text-[10px]">
                  ({playerPositions(player).join("/")})
                </span>
              )}
              <span className="ml-auto shrink-0">
                {flagEmoji(player.nationality)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
