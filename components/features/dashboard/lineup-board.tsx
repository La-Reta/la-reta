import Link from "next/link";
import { GROUP_COLOR } from "@/lib/constants";
import { flagEmoji } from "@/lib/format";
import { bestEleven } from "@/lib/lineup";
import type { Player } from "@/lib/db/schema";

const CHALK = "rgba(255,255,255,0.55)";

/** A coach's tactics board: the strongest 4-3-3 laid out on the pitch. */
export function LineupBoard({ players }: { players: Player[] }) {
  const slots = bestEleven(players);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        aspectRatio: "16 / 10",
        background:
          "repeating-linear-gradient(90deg,#0c4a35 0 10%,#0a4030 10% 20%)",
      }}
    >
      {/* Chalk markings — viewBox ratio matches the container so nothing distorts */}
      <svg
        viewBox="0 0 1600 1000"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <g fill="none" stroke={CHALK} strokeWidth={3}>
          <rect x={16} y={16} width={1568} height={968} />
          <line x1={800} y1={16} x2={800} y2={984} />
          <circle cx={800} cy={500} r={130} />
          <rect x={16} y={320} width={250} height={360} />
          <rect x={1334} y={320} width={250} height={360} />
          <rect x={16} y={410} width={95} height={180} />
          <rect x={1489} y={410} width={95} height={180} />
          <path d="M 266 420 A 130 130 0 0 1 266 580" />
          <path d="M 1334 420 A 130 130 0 0 0 1334 580" />
        </g>
        <g fill={CHALK}>
          <circle cx={800} cy={500} r={5} />
          <circle cx={185} cy={500} r={5} />
          <circle cx={1415} cy={500} r={5} />
        </g>
      </svg>

      {/* Player tokens */}
      {slots.map((slot) => {
        const color = GROUP_COLOR[slot.group];
        if (!slot.player) {
          return (
            <div
              key={slot.id}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
            >
              <span
                className="grid size-9 place-items-center rounded-full border-2 border-dashed text-[10px] font-semibold text-white/70"
                style={{ borderColor: "rgba(255,255,255,0.4)" }}
              >
                {slot.label}
              </span>
            </div>
          );
        }
        const p = slot.player;
        return (
          <Link
            key={slot.id}
            href={`/players/${p.id}`}
            className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 transition-transform hover:-translate-y-[calc(50%+3px)] focus-visible:outline-none"
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
          >
            <span
              className="grid size-9 place-items-center rounded-full border-2 bg-neutral-950/90 font-mono text-sm font-bold text-white shadow-md group-hover:bg-neutral-950"
              style={{ borderColor: color }}
            >
              {p.overall}
            </span>
            <span className="flex max-w-20 items-center gap-0.5 truncate rounded-sm bg-black/55 px-1 text-[10px] leading-tight font-semibold text-white uppercase">
              <span className="truncate">{p.displayName}</span>
              <span className="shrink-0">{flagEmoji(p.nationality)}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
