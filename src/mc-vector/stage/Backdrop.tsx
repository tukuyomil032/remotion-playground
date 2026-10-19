import type React from "react";
import { AbsoluteFill, interpolateColors, random, useCurrentFrame } from "remotion";
import { palette } from "../theme";
import { stageLevelAt } from "../timeline";

// Persistent background for the whole promo. A flat color that turns from
// butter (title scenes) to clay (operation scenes) via stageLevelAt(), plus a
// few small hand-drawn marks at low opacity. Flat color only, no texture.
// Mount once at the root, outside any Sequence (it reads absolute frames).

type Mark = {
  /** Path in a 0..120 box. */
  d: string;
  x: number;
  y: number;
  size: number;
  rotate: number;
  opacity: number;
};

const MARKS: readonly Mark[] = [
  // Loose circle, top right.
  {
    d: "M60 14 C 88 12, 108 34, 106 60 C 104 88, 80 106, 56 104 C 30 102, 12 82, 14 56 C 16 32, 36 16, 64 18",
    x: 1700,
    y: 70,
    size: 120,
    rotate: -8,
    opacity: 0.16,
  },
  // Wavy line, bottom left.
  {
    d: "M6 64 C 20 44, 34 44, 46 62 C 58 80, 72 80, 84 62 C 96 44, 108 46, 116 60",
    x: 110,
    y: 900,
    size: 170,
    rotate: -6,
    opacity: 0.18,
  },
  // Small circle, bottom right.
  {
    d: "M60 28 C 78 26, 92 40, 92 58 C 92 78, 76 92, 58 92 C 40 92, 26 78, 28 58 C 30 40, 44 30, 64 30",
    x: 1740,
    y: 880,
    size: 80,
    rotate: 12,
    opacity: 0.14,
  },
  // Short wave, top left.
  {
    d: "M8 60 C 24 46, 36 46, 50 60 C 64 74, 76 74, 92 60",
    x: 70,
    y: 120,
    size: 110,
    rotate: 10,
    opacity: 0.14,
  },
  // Tiny loop, mid right edge.
  {
    d: "M20 70 C 40 30, 70 30, 70 56 C 70 80, 44 82, 46 60 C 48 40, 80 36, 104 52",
    x: 1810,
    y: 470,
    size: 80,
    rotate: -14,
    opacity: 0.12,
  },
];

/** Hand-drawn "boil": marks shift a little every few frames, like redrawn paper art. */
const BOIL_STEP = 10;

const DoodleMark: React.FC<{ mark: Mark; index: number; frame: number; color: string }> = ({
  mark,
  index,
  frame,
  color,
}) => {
  const step = Math.floor(frame / BOIL_STEP);
  const jx = (random(`bd-x-${index}-${step}`) - 0.5) * 3;
  const jy = (random(`bd-y-${index}-${step}`) - 0.5) * 3;
  const jr = (random(`bd-r-${index}-${step}`) - 0.5) * 1.6;
  return (
    <svg
      width={mark.size}
      height={mark.size}
      viewBox="0 0 120 120"
      fill="none"
      style={{
        position: "absolute",
        left: mark.x,
        top: mark.y,
        opacity: mark.opacity,
        transform: `translate(${jx}px, ${jy}px) rotate(${mark.rotate + jr}deg)`,
      }}
    >
      <path d={mark.d} stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const Backdrop: React.FC<{
  /** Override the butter(0) -> clay(1) mix. Defaults to stageLevelAt(frame). */
  level?: number;
  /** Hide the small hand-drawn marks. */
  plain?: boolean;
}> = ({ level, plain = false }) => {
  const frame = useCurrentFrame();
  const t = level ?? stageLevelAt(frame);
  const bg = interpolateColors(t, [0, 1], [palette.butter, palette.clay]);
  const ink = interpolateColors(t, [0, 1], [palette.cocoa, palette.ink]);

  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      {plain
        ? null
        : MARKS.map((m, i) => <DoodleMark key={i} mark={m} index={i} frame={frame} color={ink} />)}
    </AbsoluteFill>
  );
};
