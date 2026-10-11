import { Easing, interpolate, spring, useCurrentFrame } from "remotion";
import { FPS } from "../timeline";

// Shared motion helpers.

export const clamp01 = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Strong ease-out for entrances (no overshoot). */
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
/** Ease-in for exits (leaves with gravity). */
export const easeIn = Easing.bezier(0.55, 0, 0.85, 0.35);
/** Balanced ease for moves that start and end at rest. */
export const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * First-order response, no overshoot (damping ratio ~1). `at` is the local
 * frame where the move starts. Returns 0..1.
 */
export const useMove = (at: number, damping = 28, stiffness = 170): number => {
  const frame = useCurrentFrame();
  return spring({ frame: frame - at, fps: FPS, config: { damping, stiffness, mass: 1 } });
};

/** 0..1 visibility of something that blurs in at `at` and (optionally) out at `until`. */
export const swapAmount = (frame: number, at: number, until?: number, dur = 12): number => {
  const tIn = interpolate(frame, [at, at + dur], [0, 1], { ...clamp01, easing: easeOut });
  const tOut = until === undefined ? 0 : interpolate(frame, [until, until + dur], [0, 1], { ...clamp01, easing: easeOut });
  return tIn * (1 - tOut);
};

/**
 * Draw progress for an SVG stroke drawn with pathLength={1}.
 * Spread these on a <path>: strokeDasharray / strokeDashoffset.
 */
export const drawStroke = (progress: number): { strokeDasharray: number; strokeDashoffset: number } => ({
  strokeDasharray: 1,
  strokeDashoffset: 1 - Math.min(1, Math.max(0, progress)),
});
