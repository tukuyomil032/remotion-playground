import type React from "react";
import { random } from "remotion";
import { easeOut } from "../stage/motion";

// Smoke for the Speed scene. Unlike the paper-cut scenery, the smoke is meant
// to look like the real thing: soft round puffs with no outline, lit orange
// near the jet and cooling to warm greys, stirred by a noise filter so the
// outline of the cloud is lumpy instead of round. Every puff is a pure
// function of the frame (no state), so frames can be rendered in any order.
// Warm colors only.

const c01 = (n: number): number => Math.min(1, Math.max(0, n));

/** Exponential approach to 1: fast at first, then easing off. */
const settle = (age: number, tau: number): number => 1 - Math.exp(-Math.max(0, age) / tau);

export const SMOKE_FILTER = "url(#smoke-warp)";

/**
 * Gradients and the noise filter used by the puffs. Mount once inside the
 * scene's <svg>. `frame` drifts the noise so the cloud keeps churning.
 */
export const SmokeDefs: React.FC<{ frame: number }> = ({ frame }) => {
  const fx = 0.0085 + 0.0007 * Math.sin(frame / 41);
  const fy = 0.0115 + 0.0007 * Math.cos(frame / 53);
  return (
    <defs>
      <radialGradient id="puff-neutral">
        <stop offset="0" stopColor="#f6ecd8" stopOpacity={0.95} />
        <stop offset="0.45" stopColor="#ecdfc8" stopOpacity={0.8} />
        <stop offset="0.8" stopColor="#d9c8ad" stopOpacity={0.34} />
        <stop offset="1" stopColor="#d0bea3" stopOpacity={0} />
      </radialGradient>
      <radialGradient id="puff-warm">
        <stop offset="0" stopColor="#ffd9a2" stopOpacity={0.95} />
        <stop offset="0.5" stopColor="#f8c07e" stopOpacity={0.62} />
        <stop offset="1" stopColor="#f0aa66" stopOpacity={0} />
      </radialGradient>
      <radialGradient id="puff-shade">
        <stop offset="0" stopColor="#b9a58b" stopOpacity={0.6} />
        <stop offset="0.6" stopColor="#a99579" stopOpacity={0.3} />
        <stop offset="1" stopColor="#a08c70" stopOpacity={0} />
      </radialGradient>
      <filter id="smoke-warp" x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency={`${fx} ${fy}`} numOctaves={3} seed={7} result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale={64} xChannelSelector="R" yChannelSelector="G" />
        <feGaussianBlur stdDeviation={1.4} />
      </filter>
    </defs>
  );
};

/** One puff: a shaded underside, the body, and a warm layer lit by the jet. */
const Puff: React.FC<{ x: number; y: number; r: number; opacity: number; warm: number }> = ({
  x,
  y,
  r,
  opacity,
  warm,
}) => {
  if (opacity <= 0.003 || r <= 1) {
    return null;
  }
  return (
    <g opacity={opacity}>
      <circle cx={x + r * 0.1} cy={y + r * 0.17} r={r} fill="url(#puff-shade)" />
      <circle cx={x} cy={y} r={r * 0.92} fill="url(#puff-neutral)" />
      {warm > 0.02 ? <circle cx={x} cy={y} r={r * 0.78} fill="url(#puff-warm)" opacity={warm} /> : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Ignition: the jet hits the pad and the exhaust rolls out along the ground
// ---------------------------------------------------------------------------

type GroundPuff = {
  /** Emission time as an offset from the ignition frame. */
  at: number;
  side: -1 | 1;
  /** Starting speed (px per frame) and how long it keeps it before easing off. */
  v0: number;
  tau: number;
  lift: number;
  r0: number;
  r1: number;
  hold: number;
  wobble: number;
  phase: number;
  y0: number;
};

const GROUND_COUNT = 120;

const GROUND_PUFFS: readonly GroundPuff[] = Array.from({ length: GROUND_COUNT }, (_, i) => {
  const u = i / GROUND_COUNT;
  return {
    at: Math.pow(u, 1.25) * 72,
    side: i % 2 === 0 ? -1 : 1,
    v0: 13 + random(`gp-v-${i}`) * 15,
    tau: 30 + random(`gp-t-${i}`) * 28,
    lift: 50 + random(`gp-l-${i}`) * 230,
    r0: 34 + random(`gp-r0-${i}`) * 30,
    r1: 100 + random(`gp-r1-${i}`) * 110,
    hold: 56 + random(`gp-h-${i}`) * 34,
    wobble: 6 + random(`gp-w-${i}`) * 26,
    phase: random(`gp-p-${i}`) * 6.28,
    y0: 842 - random(`gp-y-${i}`) * 46,
  } as const;
});

/** The pad's flat top is at y = 838 (world space). x = rocket x. */
export const GroundBlast: React.FC<{ frame: number; ignite: number; x: number }> = ({ frame, ignite, x }) => (
  <g filter={SMOKE_FILTER}>
    {GROUND_PUFFS.map((p, i) => {
      const age = frame - (ignite + p.at);
      if (age < 0 || age > 190) {
        return null;
      }
      const travel = p.v0 * p.tau * settle(age, p.tau);
      const px = x + p.side * (24 + travel) + Math.sin(age / 17 + p.phase) * p.wobble;
      // Hot gas near the jet rises more; the far edge of the cloud stays low.
      const rise = p.lift * settle(age, 46) * (1 - c01(travel / 1500));
      const py = p.y0 - rise;
      const r = p.r0 + (p.r1 - p.r0) * settle(age, 30);
      const opacity = c01(age / 5) * (1 - c01((age - p.hold) / 110)) * 0.92;
      const warm = (1 - c01(age / 44)) * (1 - c01(travel / 650));
      return <Puff key={i} x={px} y={py} r={r} opacity={opacity} warm={warm} />;
    })}
  </g>
);

// ---------------------------------------------------------------------------
// Climb: a plume that keeps billowing behind the rocket
// ---------------------------------------------------------------------------

/** Emission time step in frames (two puffs per frame so a fast climb stays continuous). */
export const PLUME_STEP = 0.5;

type PlumeProps = {
  frame: number;
  /** Scroll offset now. */
  scroll: number;
  /** First and last emission frames. */
  first: number;
  last: number;
  x: number;
  /** Screen y where the nozzle was at emission time e. */
  emitY: (e: number) => number;
  /** Scroll offset at emission time e. */
  scrollAt: (e: number) => number;
  /** Air density 0..1 at emission time e (smoke thins out and stops in space). */
  air: (e: number) => number;
};

export const Plume: React.FC<PlumeProps> = ({ frame, scroll, first, last, x, emitY, scrollAt, air }) => {
  const count = Math.floor((last - first) / PLUME_STEP);
  const items: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const e = first + i * PLUME_STEP;
    const age = frame - e;
    if (age < 0 || age > 150) {
      continue;
    }
    const a = air(e);
    if (a <= 0.01) {
      continue;
    }
    const y = emitY(e) + (scroll - scrollAt(e));
    if (y > 1300) {
      continue;
    }
    const jitter = random(`pl-j-${i}`) - 0.5;
    const swirl = Math.sin(age / 19 + random(`pl-p-${i}`) * 6.28) * (2 + age * 0.16);
    const px = x + jitter * 30 + (random(`pl-d-${i}`) - 0.5) * age * 0.7 + swirl;
    const size = 0.85 + random(`pl-r-${i}`) * 0.35;
    const r = (20 + 92 * easeOut(c01(age / 95))) * size * (0.55 + 0.45 * a);
    const opacity = c01(age / 4) * (1 - c01((age - 28) / 112)) * Math.pow(a, 1.2) * 0.7;
    const warm = (1 - c01(age / 26)) * a;
    items.push(<Puff key={i} x={px} y={y} r={r} opacity={opacity} warm={warm} />);
  }
  return <g filter={SMOKE_FILTER}>{items}</g>;
};
