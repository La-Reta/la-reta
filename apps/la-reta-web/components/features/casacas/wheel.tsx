"use client";

import { cn } from "@/lib/utils";

export type WheelSegment = { id: number; label: string };

/** Tailwind 300-level pastels; dark labels read cleanly on top. Cycled by index. */
const WHEEL_COLORS = [
  "#fca5a5", // red-300
  "#fdba74", // orange-300
  "#fcd34d", // amber-300
  "#bef264", // lime-300
  "#86efac", // green-300
  "#5eead4", // teal-300
  "#67e8f9", // cyan-300
  "#7dd3fc", // sky-300
  "#93c5fd", // blue-300
  "#a5b4fc", // indigo-300
  "#c4b5fd", // violet-300
  "#d8b4fe", // purple-300
  "#f0abfc", // fuchsia-300
  "#f9a8d4", // pink-300
];

const TEXT_DARK = "#334155"; // slate-700
const TEXT_DIM = "#94a3b8"; // slate-400
const REST_FILL = "#e2e8f0"; // slate-200 — "en descanso"

const CENTER = 100;
const RADIUS = 92;

/**
 * Math.sin/cos pueden diferir en el último bit entre el V8 del servidor y el
 * del navegador, y React marcaba la ruleta entera como hydration mismatch por
 * un `126.27229609564647` contra `126.27229609564645`. Con 3 decimales (0.001
 * de 200 unidades de viewBox) ambos lados escriben exactamente lo mismo y no se
 * pierde precisión visible.
 */
const COORD_DECIMALS = 3;

function round(value: number) {
  return Number(value.toFixed(COORD_DECIMALS));
}

/** Point on the wheel at `deg` measured clockwise from the top (12 o'clock). */
function polar(deg: number, r: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return {
    x: round(CENTER + r * Math.cos(rad)),
    y: round(CENTER + r * Math.sin(rad)),
  };
}

function segmentPath(start: number, end: number) {
  const a = polar(start, RADIUS);
  const b = polar(end, RADIUS);
  const largeArc = end - start > 180 ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${a.x} ${a.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${b.x} ${b.y} Z`;
}

export const Wheel = ({
  segments,
  rotation,
  spinning,
  dimIndexes,
  onSpinEnd,
  className,
}: {
  readonly segments: WheelSegment[];
  readonly rotation: number;
  readonly spinning: boolean;
  /** Indexes drawn faded (resting players who can't win this spin). */
  readonly dimIndexes?: Set<number>;
  readonly onSpinEnd?: () => void;
  readonly className?: string;
}) => {
  const n = segments.length;
  const seg = n > 0 ? 360 / n : 360;
  // Base size shrinks as segments get thinner; per-label size shrinks further so
  // long names fit the radial space (see below).
  const baseFont = Math.max(7, Math.min(13, 90 / Math.max(n, 1) + 6));

  return (
    <div className={cn("relative mx-auto w-full max-w-md", className)}>
      {/* El SVG se dibuja inline y rota con los datos, así que no puede ser un
          <img>. role="img" + aria-label es el patrón que recomienda la WAI para
          gráficos SVG en línea. */}
      {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
      <svg
        viewBox="0 0 200 200"
        className="h-auto w-full drop-shadow-xl"
        role="img"
        aria-label="Ruleta de casacas"
      >
        {/* Fixed pointer at the top, pointing down into the wheel. */}
        <polygon
          points="90,3 110,3 100,22"
          className="fill-foreground"
          stroke="var(--background)"
          strokeWidth={1.5}
        />

        <g
          style={{
            transformBox: "fill-box",
            transformOrigin: "center",
            transform: `rotate(${rotation}deg)`,
            transition: spinning
              ? "transform 4.2s cubic-bezier(0.16, 1, 0.3, 1)"
              : "none",
          }}
          onTransitionEnd={spinning ? onSpinEnd : undefined}
        >
          {/* Outer ring */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS + 3}
            className="fill-border"
          />

          {n === 1 ? (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill={WHEEL_COLORS[0]}
              stroke="var(--background)"
              strokeWidth={1.5}
            />
          ) : (
            segments.map((s, i) => {
              const start = i * seg;
              const mid = start + seg / 2;
              const labelPos = polar(mid, RADIUS * 0.6);
              // Wrap into (-90°, 90°] so the text is never upside down, whatever
              // side of the wheel the segment lands on.
              const raw = (((mid - 90) % 180) + 180) % 180;
              const labelRot = raw > 90 ? raw - 180 : raw;
              const dimmed = dimIndexes?.has(i);
              const label =
                s.label.length > 14 ? s.label.slice(0, 13) + "…" : s.label;
              // Shrink long names so they fit the ~60u radial band (hub→rim).
              const fit = 60 / (Math.max(label.length, 1) * 0.6);
              const fontSize = Math.max(6.5, Math.min(baseFont, fit));
              return (
                <g key={s.id}>
                  <path
                    d={segmentPath(start, start + seg)}
                    fill={
                      dimmed ? REST_FILL : WHEEL_COLORS[i % WHEEL_COLORS.length]
                    }
                    stroke="var(--background)"
                    strokeWidth={1.5}
                  />
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    fill={dimmed ? TEXT_DIM : TEXT_DARK}
                    fontSize={fontSize}
                    fontWeight={700}
                    letterSpacing={0.2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${labelRot} ${labelPos.x} ${labelPos.y})`}
                    style={{ textShadow: "0 1px 1px rgba(255,255,255,0.45)" }}
                  >
                    {label}
                  </text>
                </g>
              );
            })
          )}

          {/* Center hub */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={16}
            className="fill-background stroke-border"
            strokeWidth={2}
          />
          <text
            x={CENTER}
            y={CENTER}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={16}
          >
            🧺
          </text>
        </g>
      </svg>
    </div>
  );
};
