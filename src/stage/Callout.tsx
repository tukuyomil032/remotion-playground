import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { fonts } from "../fonts";
import { palette, shadows, strokes } from "../theme";
import { PenText, penDuration } from "../title/PenText";
import { clamp01, drawStroke, easeInOut, easeOut } from "./motion";

// Hand-written note (Caveat by default) plus an optional hand-drawn arrow.
// The note is written left to right; the arrow is drawn after it as a line
// (strokeDasharray / strokeDashoffset), shaft first, then the head.
//
// Coordinates are in the parent's pixel space. Inside <Stage annotations>
// that is the app window's own space (1600 x 900, origin at the window's
// top-left corner), so a callout follows the camera.

export type Point = { x: number; y: number };

export type CalloutArrow = {
  from: Point;
  to: Point;
  /**
   * Sideways bow of the shaft in px (perpendicular to from -> to).
   * Positive bows to the left of the travel direction. Default 40.
   */
  bend?: number;
};

export type CalloutProps = {
  text: string;
  /** Local frame where the note starts being written. */
  at: number;
  /** Left edge of the text, px. */
  x: number;
  /** Top edge of the text, px. */
  y: number;
  /** Degrees. Notes look best between -8 and 8. */
  rotate?: number;
  arrow?: CalloutArrow;
  /** Text color. Default ink. */
  color?: string;
  /** Arrow color. Default tomato. */
  arrowColor?: string;
  /** Default Caveat (fonts.note). */
  font?: string;
  /** Default 56. */
  size?: number;
  /** Default 700. */
  weight?: number;
  /** Frames to write the note. Default penDuration(text). */
  writeFrames?: number;
  /** Optional local frame where note and arrow blur out (12 frames). */
  until?: number;
  /**
   * Put the note on a small butter paper slip with a soft drop shadow.
   * Use it whenever the note sits over the dark app window (ink on the dark
   * window is unreadable). Notes on the clay / butter background need no slip.
   */
  paper?: boolean;
};

const SHAFT_FRAMES = 18;
const HEAD_FRAMES = 8;
const HEAD_LEN = 26;
const HEAD_SPREAD = (28 * Math.PI) / 180;

const arrowGeometry = (a: CalloutArrow): { shaft: string; head: string } => {
  const { from, to } = a;
  const bend = a.bend ?? 40;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  // Perpendicular (left of travel direction).
  const nx = dy / len;
  const ny = -dx / len;
  const cx = (from.x + to.x) / 2 + nx * bend;
  const cy = (from.y + to.y) / 2 + ny * bend;
  const shaft = `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;

  // Arrow head: two short strokes back along the end tangent.
  const tx = to.x - cx;
  const ty = to.y - cy;
  const angle = Math.atan2(ty, tx);
  const l = { x: to.x - HEAD_LEN * Math.cos(angle - HEAD_SPREAD), y: to.y - HEAD_LEN * Math.sin(angle - HEAD_SPREAD) };
  const r = { x: to.x - HEAD_LEN * Math.cos(angle + HEAD_SPREAD), y: to.y - HEAD_LEN * Math.sin(angle + HEAD_SPREAD) };
  const head = `M ${l.x} ${l.y} L ${to.x} ${to.y} L ${r.x} ${r.y}`;
  return { shaft, head };
};

export const Callout: React.FC<CalloutProps> = ({
  text,
  at,
  x,
  y,
  rotate = 0,
  arrow,
  color = palette.ink,
  arrowColor = palette.tomato,
  font = fonts.note,
  size = 56,
  weight = 700,
  writeFrames,
  until,
  paper = false,
}) => {
  const frame = useCurrentFrame();
  const write = writeFrames ?? penDuration(text);
  const arrowAt = at + Math.round(write * 0.7);

  const shaftP = interpolate(frame, [arrowAt, arrowAt + SHAFT_FRAMES], [0, 1], { ...clamp01, easing: easeInOut });
  const headP = interpolate(frame, [arrowAt + SHAFT_FRAMES - 2, arrowAt + SHAFT_FRAMES - 2 + HEAD_FRAMES], [0, 1], {
    ...clamp01,
    easing: easeOut,
  });
  const slip = interpolate(frame, [at - 6, at + 4], [0, 1], { ...clamp01, easing: easeOut });
  const out = until === undefined ? 1 : 1 - interpolate(frame, [until, until + 12], [0, 1], { ...clamp01, easing: easeOut });

  if (frame < at - 6 || out <= 0.002) {
    return null;
  }

  const geo = arrow ? arrowGeometry(arrow) : null;
  const strokeProps = {
    stroke: arrowColor,
    strokeWidth: strokes.arrow,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    fill: "none",
    pathLength: 1,
  } as const;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        overflow: "visible",
        pointerEvents: "none",
        opacity: out,
        filter: out < 0.995 ? `blur(${(1 - out) * 10}px)` : undefined,
      }}
    >
      {geo && shaftP > 0 ? (
        <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <path d={geo.shaft} {...strokeProps} {...drawStroke(shaftP)} />
          {headP > 0 ? <path d={geo.head} {...strokeProps} {...drawStroke(headP)} /> : null}
        </svg>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: `rotate(${rotate}deg)`,
          transformOrigin: "0% 50%",
        }}
      >
        <div
          style={
            paper
              ? {
                  padding: `${size * 0.12}px ${size * 0.34}px ${size * 0.16}px`,
                  background: palette.butterLight,
                  borderRadius: 6,
                  boxShadow: shadows.card,
                  opacity: slip,
                  transform: `scale(${0.92 + 0.08 * slip})`,
                  transformOrigin: "0% 50%",
                }
              : undefined
          }
        >
          <PenText text={text} at={at} durationFrames={write} font={font} size={size} weight={weight} color={color} lineHeight={1} />
        </div>
      </div>
    </div>
  );
};
