import type React from "react";
import { random } from "remotion";
import { easeOut } from "../stage/motion";
import { CREAM } from "./Rocket";

// The rocket blows up in space. The picture follows the real thing: a white
// flash, a fireball that swells and cools (cream -> yellow -> orange -> brown),
// a soft shock ring, sparks that fly straight out at constant speed (no air, no
// gravity), then a dark smoke cloud that thins into a light haze. It is a pure
// function of `b`, the frames since the burst. Warm colors only: the darkest is
// a burnt brown, never black.

const c01 = (n: number): number => Math.min(1, Math.max(0, n));

/** Soft noise warp on the whole fireball so its edge is lumpy, not round. */
export const ExplosionDefs: React.FC<{ b: number }> = ({ b }) => {
  const fx = 0.0075 + 0.00018 * Math.min(b, 60);
  return (
    <defs>
      <radialGradient id="boom-fire">
        <stop offset="0" stopColor="#fff8e2" stopOpacity={1} />
        <stop offset="0.24" stopColor="#ffe08a" stopOpacity={1} />
        <stop offset="0.5" stopColor="#f7a03a" stopOpacity={0.96} />
        <stop offset="0.78" stopColor="#c9501f" stopOpacity={0.7} />
        <stop offset="1" stopColor="#7a2c12" stopOpacity={0} />
      </radialGradient>
      <radialGradient id="boom-ember">
        <stop offset="0" stopColor="#6a3319" stopOpacity={0.8} />
        <stop offset="0.6" stopColor="#59291a" stopOpacity={0.52} />
        <stop offset="1" stopColor="#4a1f0e" stopOpacity={0} />
      </radialGradient>
      <radialGradient id="boom-haze-dark">
        <stop offset="0" stopColor="#8b5a3b" stopOpacity={0.8} />
        <stop offset="0.6" stopColor="#7a4a2e" stopOpacity={0.5} />
        <stop offset="1" stopColor="#6e4129" stopOpacity={0} />
      </radialGradient>
      <radialGradient id="boom-haze-light">
        <stop offset="0" stopColor="#f6e4bc" stopOpacity={0.92} />
        <stop offset="0.6" stopColor="#eed5a6" stopOpacity={0.6} />
        <stop offset="1" stopColor="#e6c998" stopOpacity={0} />
      </radialGradient>
      <filter
        id="boom-warp"
        filterUnits="userSpaceOnUse"
        x={-300}
        y={-300}
        width={2520}
        height={1680}
        colorInterpolationFilters="sRGB"
      >
        <feTurbulence type="fractalNoise" baseFrequency={`${fx} ${fx * 1.3}`} numOctaves={4} seed={11} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={110} xChannelSelector="R" yChannelSelector="G" />
        <feGaussianBlur stdDeviation={2} />
      </filter>
      <filter id="boom-soft" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation={5} />
      </filter>
    </defs>
  );
};

type Blob = { angle: number; dist: number; radius: number; delay: number; span: number };

const makeBlobs = (key: string, n: number, dist: number, radius: number, delay: number, span: number): Blob[] =>
  Array.from({ length: n }, (_, i) => ({
    angle: random(`${key}-a-${i}`) * Math.PI * 2,
    // sqrt so blobs fill the disc instead of crowding the middle
    dist: Math.sqrt(random(`${key}-d-${i}`)) * dist,
    radius: radius * (0.55 + random(`${key}-r-${i}`) * 0.7),
    delay: random(`${key}-l-${i}`) * delay,
    span: span * (0.8 + random(`${key}-s-${i}`) * 0.5),
  }));

const FIRE = makeBlobs("fb", 26, 250, 230, 5, 34);
const EMBER = makeBlobs("em", 22, 330, 270, 6, 44);
const HAZE = makeBlobs("hz", 18, 760, 420, 14, 60);

const blobAt = (blob: Blob, b: number): { x: number; y: number; r: number } => {
  const t = easeOut(c01((b - blob.delay) / blob.span));
  return {
    x: Math.cos(blob.angle) * blob.dist * t,
    // the hot gas drifts up a little
    y: Math.sin(blob.angle) * blob.dist * t - b * 0.3,
    r: blob.radius * (0.3 + 0.7 * t),
  };
};

const Blobs: React.FC<{ list: readonly Blob[]; b: number; cx: number; cy: number; fill: string; grow?: number }> = ({
  list,
  b,
  cx,
  cy,
  fill,
  grow = 1,
}) => (
  <g>
    {list.map((blob, i) => {
      if (b < blob.delay) {
        return null;
      }
      const p = blobAt(blob, b);
      return <circle key={i} cx={cx + p.x} cy={cy + p.y} r={p.r * grow} fill={fill} />;
    })}
  </g>
);

const SPARK_COUNT = 70;

const SPARKS = Array.from({ length: SPARK_COUNT }, (_, i) => ({
  angle: random(`sp-a-${i}`) * Math.PI * 2,
  speed: 10 + Math.pow(random(`sp-v-${i}`), 1.6) * 42,
  width: 2.4 + random(`sp-w-${i}`) * 3.4,
  life: 14 + random(`sp-l-${i}`) * 26,
}));

const Sparks: React.FC<{ b: number; cx: number; cy: number }> = ({ b, cx, cy }) => (
  <g strokeLinecap="round">
    {SPARKS.map((s, i) => {
      // Straight out at a steady pace (no air, no gravity), easing off a little.
      const dist = 40 + s.speed * b * 0.75 * (1 / (1 + b / 90));
      const tail = Math.min(dist - 40, 6 + s.speed * 2.6 * (1 - c01((b - 8) / 34)));
      const opacity = 1 - c01((b - s.life) / 22);
      if (opacity <= 0.01 || tail <= 0) {
        return null;
      }
      const dx = Math.cos(s.angle);
      const dy = Math.sin(s.angle);
      const x1 = cx + dx * dist;
      const y1 = cy + dy * dist;
      const x0 = cx + dx * (dist - tail);
      const y0 = cy + dy * (dist - tail);
      const hot = 1 - c01(b / 26);
      return (
        <g key={i} opacity={opacity}>
          <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="#f08a2c" strokeWidth={s.width} opacity={0.75} />
          <line
            x1={cx + dx * (dist - tail * 0.45)}
            y1={cy + dy * (dist - tail * 0.45)}
            x2={x1}
            y2={y1}
            stroke={hot > 0.4 ? CREAM : "#ffcf6a"}
            strokeWidth={s.width * 0.6}
          />
        </g>
      );
    })}
  </g>
);

/**
 * Everything of the blast except the rocket's own pieces, which the caller
 * passes as `debris` so they sit above the fire and below the sparks.
 */
export const Explosion: React.FC<{ b: number; cx: number; cy: number; debris: React.ReactNode }> = ({
  b,
  cx,
  cy,
  debris,
}) => {
  const flash = 0.92 * (1 - c01(b / 7));
  const ring = easeOut(c01(b / 38));

  const emberOpacity = c01(b / 8) * (1 - c01((b - 28) / 28));
  const fireOpacity = 1 - c01((b - 10) / 30);
  const hazeDark = c01((b - 8) / 12) * (1 - c01((b - 22) / 24));
  const hazeLight = 0.75 * c01((b - 20) / 22) * (1 - c01((b - 50) / 40));

  return (
    <g>
      <g filter="url(#boom-warp)">
        <g opacity={emberOpacity}>
          <Blobs list={EMBER} b={b} cx={cx} cy={cy} fill="url(#boom-ember)" grow={1.15} />
        </g>
        <g opacity={hazeDark}>
          <Blobs list={HAZE} b={b} cx={cx} cy={cy} fill="url(#boom-haze-dark)" />
        </g>
        <g opacity={fireOpacity}>
          <Blobs list={FIRE} b={b} cx={cx} cy={cy} fill="url(#boom-fire)" />
        </g>
      </g>
      {debris}
      <g filter="url(#boom-warp)" opacity={hazeLight}>
        <Blobs list={HAZE} b={b} cx={cx} cy={cy} fill="url(#boom-haze-light)" />
      </g>
      <Sparks b={b} cx={cx} cy={cy} />
      <circle
        cx={cx}
        cy={cy}
        r={50 + 1150 * ring}
        fill="none"
        stroke={CREAM}
        strokeWidth={4 + 16 * (1 - ring)}
        opacity={0.6 * (1 - ring)}
        filter="url(#boom-soft)"
      />
      {flash > 0.01 ? <rect x={0} y={0} width={1920} height={1080} fill={CREAM} opacity={flash} /> : null}
    </g>
  );
};
