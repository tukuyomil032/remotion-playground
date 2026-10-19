import type React from "react";
import { fonts } from "../fonts";
import { palette } from "../theme";

// The little rocket: flat paper-cut shapes with an ink outline. Drawn around
// (0, 0) = the middle of the body; about 300 px tall at scale 1. Each piece can
// be moved on its own so the rocket can fall apart in the burst.

export const CREAM = "#fff3d6";

export type PartName = "nose" | "finL" | "finR" | "body" | "window" | "nozzle";

export type PartPose = {
  x: number;
  y: number;
  rotate: number;
  opacity: number;
  /** 0..1: how scorched the piece is (darkens it). Default 0. */
  char?: number;
};

export type PartPoses = Partial<Record<PartName, PartPose>>;

const STROKE = { stroke: palette.ink, strokeWidth: 5, strokeLinejoin: "round", strokeLinecap: "round" } as const;

/** Where each piece pivots when it spins (its own middle). */
const PIVOT: Record<PartName, { x: number; y: number }> = {
  nose: { x: 0, y: -120 },
  finL: { x: -78, y: 80 },
  finR: { x: 78, y: 80 },
  body: { x: 0, y: 20 },
  window: { x: 0, y: -10 },
  nozzle: { x: 0, y: 118 },
};

const Part: React.FC<{ name: PartName; poses?: PartPoses; children: React.ReactNode }> = ({
  name,
  poses,
  children,
}) => {
  const pose = poses?.[name];
  if (!pose) {
    return <g>{children}</g>;
  }
  const pv = PIVOT[name];
  return (
    <g
      opacity={pose.opacity}
      transform={`translate(${pose.x} ${pose.y}) rotate(${pose.rotate} ${pv.x} ${pv.y})`}
      style={pose.char ? { filter: `brightness(${1 - 0.5 * pose.char})` } : undefined}
    >
      {children}
    </g>
  );
};

export const Rocket: React.FC<{ poses?: PartPoses }> = ({ poses }) => (
  <g>
    <Part name="finL" poses={poses}>
      <path d="M-52 36 L-104 124 L-52 104 Z" fill={palette.tomato} {...STROKE} />
    </Part>
    <Part name="finR" poses={poses}>
      <path d="M52 36 L104 124 L52 104 Z" fill={palette.tomato} {...STROKE} />
    </Part>
    <Part name="nozzle" poses={poses}>
      <rect x={-27} y={110} width={54} height={18} rx={4} fill={palette.cocoa} {...STROKE} />
    </Part>
    <Part name="body" poses={poses}>
      <path d="M-56 -76 L56 -76 L56 110 L-56 110 Z" fill={CREAM} {...STROKE} />
      <rect x={-56} y={58} width={112} height={20} fill={palette.cocoaLight} {...STROKE} />
    </Part>
    <Part name="nose" poses={poses}>
      <path
        d="M-56 -76 C-56 -132 -22 -172 0 -172 C22 -172 56 -132 56 -76 Z"
        fill={palette.tomato}
        {...STROKE}
      />
    </Part>
    <Part name="window" poses={poses}>
      <circle cx={0} cy={-10} r={32} fill={palette.butter} {...STROKE} />
      <text
        x={0}
        y={4}
        textAnchor="middle"
        fontFamily={fonts.emphasis}
        fontSize={44}
        fill={palette.ink}
        stroke="none"
      >
        M
      </text>
    </Part>
  </g>
);

/**
 * Flame under the nozzle. length in px (0 = off). A hot white-yellow core inside
 * an orange jet that fades to red at the tip, with a soft edge. `frame` makes
 * the jet flicker.
 */
export const Flame: React.FC<{ length: number; frame?: number }> = ({ length, frame = 0 }) => {
  if (length <= 1) {
    return null;
  }
  const flick = 1 + Math.sin(frame * 1.7) * 0.05 + Math.sin(frame * 3.1 + 1) * 0.04;
  const len = length * flick;
  const half = 25 + Math.sin(frame * 2.3) * 2;
  const outer = `M${-half} 126 Q${-half - 12} ${126 + len * 0.55} 0 ${126 + len} Q${half + 12} ${126 + len * 0.55} ${half} 126 Z`;
  const coreLen = len * 0.66;
  const core = `M-14 126 Q-19 ${126 + coreLen * 0.55} 0 ${126 + coreLen} Q19 ${126 + coreLen * 0.55} 14 126 Z`;
  return (
    <g>
      <defs>
        <linearGradient id="flame-outer" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd98a" />
          <stop offset="0.35" stopColor="#f59a3b" />
          <stop offset="1" stopColor="#c9391d" stopOpacity={0.85} />
        </linearGradient>
        <linearGradient id="flame-core" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset="0.6" stopColor="#ffe9a8" />
          <stop offset="1" stopColor="#ffd070" stopOpacity={0} />
        </linearGradient>
        <filter id="flame-soft" x="-30%" y="-10%" width="160%" height="130%">
          <feGaussianBlur stdDeviation={2.2} />
        </filter>
      </defs>
      <g filter="url(#flame-soft)">
        <path d={outer} fill="url(#flame-outer)" />
        <path d={core} fill="url(#flame-core)" />
      </g>
    </g>
  );
};
