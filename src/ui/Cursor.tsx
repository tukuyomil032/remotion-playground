import type React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { colors } from "../theme";

export type CursorKeyframe = {
  /** Scene-local frame. */
  frame: number;
  x: number;
  y: number;
};

/**
 * Mouse pointer that eases between keyframes and shows a ripple at each
 * frame in `clicks`. Coordinates are in the parent's pixel space.
 */
export const Cursor: React.FC<{
  path: readonly CursorKeyframe[];
  clicks?: readonly number[];
  size?: number;
  rippleColor?: string;
  visibleFrom?: number;
  visibleTo?: number;
}> = ({ path, clicks = [], size = 32, rippleColor = colors.text, visibleFrom = -Infinity, visibleTo = Infinity }) => {
  const frame = useCurrentFrame();
  if (path.length === 0 || frame < visibleFrom || frame > visibleTo) {
    return null;
  }

  const frames = path.map((k) => k.frame);
  const opts = {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  } as const;
  let x = path[0].x;
  let y = path[0].y;
  if (path.length > 1) {
    // Find the active segment so easing applies per segment.
    let i = 0;
    while (i < path.length - 2 && frame >= frames[i + 1]) {
      i++;
    }
    const a = path[i];
    const b = path[i + 1];
    x = interpolate(frame, [a.frame, b.frame], [a.x, b.x], opts);
    y = interpolate(frame, [a.frame, b.frame], [a.y, b.y], opts);
  }

  // Most recent click within the ripple window.
  const RIPPLE = 24;
  const activeClick = clicks.filter((c) => frame >= c && frame < c + RIPPLE).pop();
  const press =
    activeClick === undefined
      ? 0
      : interpolate(frame - activeClick, [0, 4, 10], [0, 1, 0], { extrapolateRight: "clamp" });
  const ripple = activeClick === undefined ? -1 : (frame - activeClick) / RIPPLE;

  return (
    <div style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", transform: `translate(${x}px, ${y}px)` }}>
      {ripple >= 0 ? (
        <div
          style={{
            position: "absolute",
            left: -size,
            top: -size,
            width: size * 2,
            height: size * 2,
            borderRadius: "50%",
            border: `3px solid ${rippleColor}`,
            opacity: 1 - ripple,
            transform: `scale(${0.2 + ripple * 1.1})`,
          }}
        />
      ) : null}
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{
          display: "block",
          transform: `scale(${1 - press * 0.15})`,
          transformOrigin: "0 0",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))",
        }}
      >
        <path
          d="M3 2 L3 19 L7.5 14.8 L10.4 21.5 L13.4 20.2 L10.5 13.6 L16.6 13.6 Z"
          fill="#ffffff"
          stroke="#09090b"
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
