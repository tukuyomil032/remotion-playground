import { interpolate, spring } from "remotion";

// SwiftUI-style springs. SwiftUI describes a spring by `response` (seconds per
// oscillation when undamped) and `dampingFraction` (1 = no overshoot). With
// mass 1 that is stiffness (2 pi / response)^2 and damping 4 pi zeta / response.

export type SwiftSpring = { response: number; dampingFraction: number };

/** .smooth: settles without overshoot. */
export const SMOOTH: SwiftSpring = { response: 0.5, dampingFraction: 1 };
/** .snappy: quick, a hint of overshoot. */
export const SNAPPY: SwiftSpring = { response: 0.35, dampingFraction: 0.85 };
/** .bouncy: visible overshoot. */
export const BOUNCY: SwiftSpring = { response: 0.5, dampingFraction: 0.7 };

/** 0 -> 1 with a SwiftUI spring that starts at `delay` frames. */
export const swift = (frame: number, fps: number, s: SwiftSpring = SMOOTH, delay = 0): number =>
  spring({
    frame: frame - delay,
    fps,
    config: {
      mass: 1,
      stiffness: Math.pow((2 * Math.PI) / s.response, 2),
      damping: (4 * Math.PI * s.dampingFraction) / s.response,
    },
  });

/** Spring in at `inAt`, spring out at `outAt` (0 -> 1 -> 0). */
export const swiftInOut = (frame: number, fps: number, inAt: number, outAt: number, s: SwiftSpring = SMOOTH): number =>
  swift(frame, fps, s, inAt) - swift(frame, fps, s, outAt);

export const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Ease in-out cubic between frames a and b (clamped). */
export const ease = (frame: number, a: number, b: number): number => {
  const t = interpolate(frame, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

/** Cursor-style 2D path through [frame, x, y] keys. */
export const pathAt = (frame: number, list: readonly (readonly [number, number, number])[]): { x: number; y: number } => ({
  x: keys(frame, list.map(([f, x]) => [f, x] as const)),
  y: keys(frame, list.map(([f, , y]) => [f, y] as const)),
});

/** Click shape around frame `at`: 0 -> 1 -> 0 over ~10 frames. */
export const pressAt = (frame: number, at: number): number =>
  interpolate(frame, [at - 3, at, at + 7], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/** Piecewise path through keyframes [frame, value], eased between each pair. */
export const keys = (frame: number, list: readonly (readonly [number, number])[]): number => {
  if (frame <= list[0][0]) {
    return list[0][1];
  }
  for (let i = 1; i < list.length; i++) {
    const [f1, v1] = list[i];
    const [f0, v0] = list[i - 1];
    if (frame <= f1) {
      return mix(v0, v1, ease(frame, f0, f1));
    }
  }
  return list[list.length - 1][1];
};
