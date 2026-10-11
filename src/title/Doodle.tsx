import type React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { palette, strokes } from "../theme";
import { clamp01, drawStroke } from "../stage/motion";

// Small hand-drawn pictures, drawn stroke by stroke like a pen sketch.
// All paths live in a 120 x 120 box and are slightly irregular on purpose.

export type DoodleKind = "form" | "pulse" | "puzzle" | "box" | "link";

const PATHS: Record<DoodleKind, readonly string[]> = {
  // A form card: outline, three fields, a button pill.
  form: [
    "M24 15 C 50 12, 76 14, 99 16 C 101 42, 100 80, 98 105 C 72 107, 46 106, 22 104 C 20 80, 21 42, 24 15",
    "M37 35 C 52 34, 70 35, 85 34",
    "M37 52 C 50 53, 64 52, 79 53",
    "M37 69 C 54 68, 72 70, 86 69",
    "M58 85 C 68 84, 79 84, 87 86 C 89 89, 89 94, 87 96 C 78 98, 67 97, 57 96 C 55 93, 55 88, 58 85",
  ],
  // A pulse line over a baseline (live TPS / CPU / memory).
  pulse: [
    "M12 101 C 40 99, 80 102, 110 100",
    "M12 66 L 34 67 L 43 51 L 54 87 L 65 28 L 75 76 L 83 61 L 107 62",
    "M106 56 C 111 56, 113 61, 110 65 C 106 68, 101 64, 103 59",
  ],
  // A jigsaw piece (plugins and mods).
  puzzle: [
    "M24 31 L 47 30 C 44 22, 49 13, 58 13 C 67 13, 72 22, 68 30 L 94 31 L 95 53 C 102 49, 111 54, 111 62 C 111 71, 102 75, 95 71 L 94 99 L 25 98 L 24 75 C 32 78, 39 71, 39 64 C 39 57, 31 51, 24 55 Z",
    "M40 84 C 50 86, 60 85, 70 84",
  ],
  // A box with an arrow going in (backup).
  box: [
    "M60 6 C 60 14, 61 22, 60 30",
    "M50 21 L 60 31 L 70 21",
    "M15 39 C 45 37, 75 38, 105 39 L 101 53 C 74 52, 46 52, 19 53 Z",
    "M23 53 L 25 104 C 50 106, 72 105, 97 104 L 98 53",
    "M47 71 C 56 70, 64 71, 73 71",
  ],
  // Two chain links with small signal ticks (sharing).
  link: [
    "M54 58 L 41 71 C 31 81, 16 69, 27 58 L 42 43 C 52 33, 66 44, 59 53",
    "M66 62 L 79 49 C 89 39, 104 51, 93 62 L 78 77 C 68 87, 54 76, 61 67",
    "M88 25 L 95 15",
    "M98 34 L 109 31",
    "M80 20 C 80 16, 81 11, 82 8",
  ],
};

export type DoodleProps = {
  kind: DoodleKind;
  /** Local frame where drawing starts. */
  at?: number;
  /** Rendered size in px (square). Default 160. */
  size?: number;
  /** Default cocoa. */
  color?: string;
  /** Frames for the whole drawing. Default 40. */
  durationFrames?: number;
  /** Stroke width in the 120-unit box. Default strokes.doodle. */
  strokeWidth?: number;
  style?: React.CSSProperties;
};

const drawEase = Easing.bezier(0.4, 0, 0.3, 1);

export const Doodle: React.FC<DoodleProps> = ({
  kind,
  at = 0,
  size = 160,
  color = palette.cocoa,
  durationFrames = 40,
  strokeWidth = strokes.doodle,
  style,
}) => {
  const frame = useCurrentFrame();
  const paths = PATHS[kind];
  const n = paths.length;
  // Strokes overlap a little, like a quick sketch. The first stroke gets more time.
  const weights = paths.map((_, i) => (i === 0 ? 2 : 1));
  const total = weights.reduce((a, b) => a + b, 0);
  let cursor = 0;

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" style={{ display: "block", overflow: "visible", ...style }}>
      {paths.map((d, i) => {
        const start = at + (cursor / total) * durationFrames;
        const len = (weights[i] / total) * durationFrames;
        cursor += weights[i];
        const p = interpolate(frame, [start, start + len + (i < n - 1 ? 4 : 0)], [0, 1], { ...clamp01, easing: drawEase });
        if (p <= 0) {
          return null;
        }
        return (
          <path
            key={i}
            d={d}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            {...drawStroke(p)}
          />
        );
      })}
    </svg>
  );
};
