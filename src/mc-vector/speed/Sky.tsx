import type React from "react";
import { random } from "remotion";
import { palette } from "../theme";
import { CREAM } from "./Rocket";

// Flat paper-cut scenery for the Speed scene. Everything is placed in "world"
// space: screen y = baseY + scroll * parallax, so the world slides down as the
// rocket climbs. Warm colors only, no gradients, no glow.

const INK = palette.ink;
const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

const CLOUD = "M30 90 C10 90 0 74 12 62 C8 42 30 30 48 40 C54 16 92 8 108 30 C122 12 160 16 166 44 C190 42 204 66 190 82 C186 90 176 90 170 90 Z";

type CloudSpec = { x: number; y0: number; scale: number; par: number; flip: boolean };

const makeClouds = (): CloudSpec[] => {
  const list: CloudSpec[] = [];
  for (let i = 0; i < 14; i++) {
    list.push({
      x: 60 + random(`cl-x-${i}`) * 1700,
      y0: -240 - i * 320 - random(`cl-y-${i}`) * 120,
      scale: 0.9 + random(`cl-s-${i}`) * 0.9,
      par: 1,
      flip: random(`cl-f-${i}`) > 0.5,
    });
  }
  for (let i = 0; i < 8; i++) {
    list.push({
      x: 100 + random(`fc-x-${i}`) * 1700,
      y0: -120 - i * 430 - random(`fc-y-${i}`) * 140,
      scale: 0.55 + random(`fc-s-${i}`) * 0.4,
      par: 0.55,
      flip: random(`fc-f-${i}`) > 0.5,
    });
  }
  return list;
};

const CLOUDS = makeClouds();

/** Clouds thin out with altitude (world y0 is negative going up). */
export const Clouds: React.FC<{ scroll: number }> = ({ scroll }) => (
  <g>
    {CLOUDS.map((c, i) => {
      const y = c.y0 + scroll * c.par;
      if (y < -160 || y > 1200) {
        return null;
      }
      const altitude = -c.y0 / c.par;
      const opacity = clamp01((4600 - altitude) / 1500) * (c.par < 1 ? 0.7 : 0.95);
      return (
        <g
          key={i}
          opacity={opacity}
          transform={`translate(${c.x} ${y}) scale(${c.flip ? -c.scale : c.scale} ${c.scale})`}
        >
          <path d={CLOUD} fill={CREAM} />
        </g>
      );
    })}
  </g>
);

const BALLOONS = [
  { x: 330, y0: -760, s: 1 },
  { x: 1540, y0: -1500, s: 1.2 },
  { x: 600, y0: -2350, s: 0.9 },
] as const;

export const Balloons: React.FC<{ scroll: number; frame: number }> = ({ scroll, frame }) => (
  <g>
    {BALLOONS.map((b, i) => {
      const y = b.y0 + scroll + Math.sin(frame / 22 + i) * 6;
      if (y < -200 || y > 1250) {
        return null;
      }
      return (
        <g key={i} transform={`translate(${b.x} ${y}) scale(${b.s})`}>
          <path
            d="M0 -70 C46 -70 60 -26 44 8 C34 28 18 40 12 52 L-12 52 C-18 40 -34 28 -44 8 C-60 -26 -46 -70 0 -70 Z"
            fill={palette.tomato}
            stroke={INK}
            strokeWidth={4}
            strokeLinejoin="round"
          />
          <path d="M0 -70 C-18 -40 -18 10 -10 52 M0 -70 C18 -40 18 10 10 52" fill="none" stroke={CREAM} strokeWidth={6} />
          <path d="M-9 52 L-14 86 M9 52 L14 86" stroke={INK} strokeWidth={3} />
          <rect x={-20} y={86} width={40} height={26} rx={5} fill={palette.cocoaLight} stroke={INK} strokeWidth={4} />
        </g>
      );
    })}
  </g>
);

const BIRDS = [
  { x: 420, y0: -300, s: 1 },
  { x: 520, y0: -360, s: 0.8 },
  { x: 1380, y0: -820, s: 1.1 },
  { x: 1300, y0: -880, s: 0.8 },
  { x: 900, y0: -1250, s: 1 },
] as const;

export const Birds: React.FC<{ scroll: number; frame: number }> = ({ scroll, frame }) => (
  <g>
    {BIRDS.map((b, i) => {
      const y = b.y0 + scroll * 0.8 + Math.sin(frame / 14 + i * 2) * 4;
      if (y < -80 || y > 1150) {
        return null;
      }
      const flap = Math.sin(frame / 5 + i * 1.7);
      return (
        <path
          key={i}
          transform={`translate(${b.x + Math.sin(frame / 40 + i) * 18} ${y}) scale(${b.s * 2})`}
          d={`M-14 0 Q-7 ${-10 * flap - 2} 0 0 Q7 ${-10 * flap - 2} 14 0`}
          fill="none"
          stroke={INK}
          strokeWidth={2.6}
          strokeLinecap="round"
        />
      );
    })}
  </g>
);

const STARS = Array.from({ length: 26 }, (_, i) => ({
  x: 60 + random(`st-x-${i}`) * 1800,
  y: 50 + random(`st-y-${i}`) * 980,
  size: 10 + random(`st-s-${i}`) * 16,
  phase: random(`st-p-${i}`) * 6,
}));

/** Hand-drawn four-point stars. `amount` 0..1 fades them in. */
export const Stars: React.FC<{ amount: number; frame: number; scroll: number }> = ({ amount, frame, scroll }) => {
  if (amount <= 0) {
    return null;
  }
  return (
    <g>
      {STARS.map((st, i) => {
        const tw = 0.75 + 0.25 * Math.sin(frame / 9 + st.phase);
        const y = (st.y + scroll * 0.05) % 1080;
        const r = st.size * tw;
        return (
          <path
            key={i}
            d={`M${st.x} ${y - r} L${st.x} ${y + r} M${st.x - r} ${y} L${st.x + r} ${y}`}
            stroke={CREAM}
            strokeWidth={4}
            strokeLinecap="round"
            opacity={amount * (0.55 + 0.45 * tw)}
          />
        );
      })}
    </g>
  );
};

/** Mountains, hills, launch pad and tower. Group is translated by the caller. */
export const Ground: React.FC = () => (
  <g>
    <path
      d="M-100 1080 L-100 760 L180 560 L380 700 L640 520 L900 740 L1200 600 L1500 760 L1760 580 L2040 740 L2040 1080 Z"
      fill={palette.clayLight}
    />
    <path
      d="M-100 1080 L-100 880 C260 800 640 850 980 900 S1700 830 2040 880 L2040 1080 Z"
      fill={palette.clay}
    />
    <path
      d="M-100 1080 L-100 960 C300 910 700 950 1000 975 S1700 930 2040 965 L2040 1080 Z"
      fill={palette.clayDeep}
    />
    {/* Launch tower (left of the rocket) */}
    <g stroke={INK} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round">
      <rect x={760} y={420} width={30} height={420} fill={palette.cocoaLight} />
      <path d="M760 480 L790 540 M790 480 L760 540 M760 560 L790 620 M790 560 L760 620 M760 640 L790 700 M790 640 L760 700" fill="none" strokeWidth={3} />
      <path d="M790 640 L856 640" fill="none" />
    </g>
    {/* Pad */}
    <rect x={850} y={838} width={220} height={242} rx={10} fill={palette.cocoa} stroke={INK} strokeWidth={5} />
  </g>
);
