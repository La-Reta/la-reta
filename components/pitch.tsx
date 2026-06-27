import { cn } from "@/lib/utils";
import {
  POSITIONS,
  POSITION_COORDS,
  POSITION_NAME,
  GROUP_COLOR,
  positionGroup,
  type Position,
} from "@/lib/constants";

// Landscape pitch, ~105m x 68m scaled to a 1050 x 680 viewBox (10 units = 1m).
const W = 1050;
const H = 680;
const LINE = "rgba(255,255,255,0.7)";

/**
 * 2D football pitch with every position marked. Pure SVG so it renders on the
 * server. Pass `highlight` to emphasize one player's positions, or `counts` to
 * show how many players cover each spot.
 */
export function Pitch({
  highlight,
  counts,
  className,
}: {
  highlight?: Position[];
  counts?: Partial<Record<Position, number>>;
  className?: string;
}) {
  const hi = highlight ? new Set(highlight) : null;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn("h-auto w-full select-none", className)}
      role="img"
      aria-label="Cancha de fútbol con las posiciones"
    >
      {/* Grass + mowing stripes */}
      <rect width={W} height={H} fill="#1f8b4a" />
      {Array.from({ length: 10 }).map((_, i) =>
        i % 2 === 0 ? (
          <rect
            key={i}
            x={(i * W) / 10}
            y={0}
            width={W / 10}
            height={H}
            fill="rgba(255,255,255,0.04)"
          />
        ) : null,
      )}

      {/* Outer lines + halfway */}
      <g fill="none" stroke={LINE} strokeWidth={3}>
        <rect x={12} y={12} width={W - 24} height={H - 24} />
        <line x1={W / 2} y1={12} x2={W / 2} y2={H - 24 + 12} />
        <circle cx={W / 2} cy={H / 2} r={91.5} />
        {/* Penalty boxes (16.5m x 40.32m) */}
        <rect x={12} y={H / 2 - 201.6} width={165} height={403.2} />
        <rect x={W - 12 - 165} y={H / 2 - 201.6} width={165} height={403.2} />
        {/* Goal areas (5.5m x 18.32m) */}
        <rect x={12} y={H / 2 - 91.6} width={55} height={183.2} />
        <rect x={W - 12 - 55} y={H / 2 - 91.6} width={55} height={183.2} />
        {/* Penalty arcs (the bit outside each box) */}
        <path d={`M ${177} ${H / 2 - 73.1} A 91.5 91.5 0 0 1 ${177} ${H / 2 + 73.1}`} />
        <path d={`M ${W - 177} ${H / 2 - 73.1} A 91.5 91.5 0 0 0 ${W - 177} ${H / 2 + 73.1}`} />
      </g>
      <g fill={LINE}>
        <circle cx={W / 2} cy={H / 2} r={4} />
        <circle cx={12 + 110} cy={H / 2} r={4} />
        <circle cx={W - 12 - 110} cy={H / 2} r={4} />
      </g>

      {/* Position markers */}
      {POSITIONS.map((pos) => {
        const { x, y } = POSITION_COORDS[pos];
        const cx = (x / 100) * W;
        const cy = (y / 100) * H;
        const group = positionGroup(pos);
        const active = !hi || hi.has(pos);
        const count = counts?.[pos] ?? 0;

        return (
          <g key={pos} opacity={active ? 1 : 0.3}>
            <title>{`${pos} — ${POSITION_NAME[pos]}`}</title>
            <circle
              cx={cx}
              cy={cy}
              r={30}
              fill={GROUP_COLOR[group]}
              stroke="white"
              strokeWidth={hi?.has(pos) ? 5 : 2}
            />
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={22}
              fontWeight={800}
              fill="white"
            >
              {pos}
            </text>
            {counts && count > 0 ? (
              <>
                <circle cx={cx + 24} cy={cy - 24} r={14} fill="white" />
                <text
                  x={cx + 24}
                  y={cy - 24}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={18}
                  fontWeight={800}
                  fill={GROUP_COLOR[group]}
                >
                  {count}
                </text>
              </>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
