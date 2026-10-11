import type React from "react";
import { AbsoluteFill, Easing, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { fonts } from "../fonts";
import { clamp01, drawStroke, easeInOut, easeOut } from "../stage/motion";
import { PenText } from "../title/PenText";
import { palette } from "../theme";
import { SPEED_CUES } from "../timeline";
import { Explosion, ExplosionDefs } from "./Explosion";
import { Flame, Rocket, CREAM, type PartName, type PartPoses } from "./Rocket";
import { Balloons, Birds, Clouds, Ground, Stars } from "./Sky";
import { GroundBlast, Plume, SmokeDefs } from "./Smoke";

// Speed scene: a very small rocket lifts off, the world slides down, it reaches
// space and bursts like a paper cut-out, and the burst turns into the two
// numbers (install size, startup time). 600 frames, rate 1.
// The rocket, sky and ground are flat paper-cut shapes with ink outlines. The
// smoke and the explosion (Smoke.tsx, Explosion.tsx) are drawn soft and real.

const C = SPEED_CUES;
const INK = palette.ink;
const SPACE = "#8a5636";

/** Size and startup numbers shown at the end. Startup is measured (see docs/mc-vector-facts.md). */
const SIZE_MB = 30;
const STARTUP_S = 0.3;

const ROCKET_X = 960;
const PAD_Y = 696;
const FLIGHT_Y = 540;
const FLIGHT_START = C.ignite;
const FLIGHT_END = C.burst;
const SCROLL_TOTAL = 5600;

const c01 = (n: number): number => Math.min(1, Math.max(0, n));

const quadIn = Easing.in(Easing.quad);

const scrollAt = (f: number): number =>
  SCROLL_TOTAL * quadIn(c01((f - FLIGHT_START) / (FLIGHT_END - FLIGHT_START)));

const rocketY = (f: number): number =>
  interpolate(f, [FLIGHT_START, FLIGHT_START + 110], [PAD_Y, FLIGHT_Y], { ...clamp01, easing: easeInOut });

const rocketShake = (f: number): number => {
  const pre = interpolate(f, [60, 150], [0, 4], clamp01);
  const climb = interpolate(f, [150, 330, C.burst - 10, C.burst], [3, 3, 3, 9], clamp01);
  const amp = f < 150 ? pre : climb;
  return Math.sin(f * 2.3) * amp;
};

// ---------------------------------------------------------------------------
// Burst: the pieces of the rocket
// ---------------------------------------------------------------------------

const PART_FLIGHT: Record<PartName, { dx: number; dy: number; spin: number }> = {
  nose: { dx: 150, dy: -620, spin: 140 },
  finL: { dx: -640, dy: -120, spin: -230 },
  finR: { dx: 640, dy: -60, spin: 260 },
  body: { dx: 90, dy: 620, spin: 70 },
  window: { dx: -330, dy: -520, spin: 320 },
  nozzle: { dx: 360, dy: 560, spin: -200 },
};

const partPoses = (b: number): PartPoses => {
  const d = easeOut(c01(b / 52));
  const opacity = 1 - c01((b - 28) / 24);
  const poses: PartPoses = {};
  for (const name of Object.keys(PART_FLIGHT) as PartName[]) {
    const p = PART_FLIGHT[name];
    poses[name] = { x: p.dx * d, y: p.dy * d, rotate: p.spin * d, opacity, char: c01(b / 30) };
  }
  return poses;
};

// ---------------------------------------------------------------------------
// Numbers and doodles
// ---------------------------------------------------------------------------

const Feather: React.FC<{ progress: number }> = ({ progress }) => (
  <svg width={150} height={150} viewBox="0 0 120 120" fill="none" style={{ overflow: "visible" }}>
    <g stroke={palette.cocoa} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
      <path pathLength={1} {...drawStroke(progress * 1.4)} d="M20 100 C 30 60, 60 24, 100 14 C 96 56, 66 90, 20 100 Z" />
      <path pathLength={1} {...drawStroke(progress * 1.4 - 0.3)} d="M20 100 C 44 76, 66 52, 92 22" />
      <path pathLength={1} {...drawStroke(progress * 1.4 - 0.4)} d="M50 76 L 40 52 M64 62 L 60 40" />
    </g>
  </svg>
);

const Stopwatch: React.FC<{ progress: number; spin: number }> = ({ progress, spin }) => (
  <svg width={150} height={150} viewBox="0 0 120 120" fill="none" style={{ overflow: "visible" }}>
    <g stroke={palette.cocoa} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
      <path
        pathLength={1}
        {...drawStroke(progress * 1.4)}
        d="M60 28 C 82 26, 98 44, 98 66 C 98 88, 80 104, 60 104 C 40 104, 22 88, 22 66 C 22 44, 38 28, 62 28"
      />
      <path pathLength={1} {...drawStroke(progress * 1.4 - 0.4)} d="M50 14 L 70 14 M60 14 L 60 28 M86 34 L 94 26" />
      <g transform={`rotate(${spin} 60 66)`} opacity={c01(progress * 3 - 1.2)}>
        <path d="M60 66 L 60 44" stroke={palette.tomato} />
      </g>
    </g>
  </svg>
);

const NumberBlock: React.FC<{
  frame: number;
  at: number;
  x: number;
  label: string;
  value: string;
  unit: string;
  sub: string;
  doodle: React.ReactNode;
}> = ({ frame, at, x, label, value, unit, sub, doodle }) => {
  const a = frame - at;
  const inT = easeOut(c01(a / 26));
  const sharp = easeOut(c01(a / 18));
  const leave = c01((frame - C.leave) / 26);
  const opacity = c01(a / 10) * (1 - leave);
  return (
    <div
      style={{
        position: "absolute",
        left: x - 450,
        top: 150,
        width: 900,
        height: 780,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity,
        transform: `translateY(${(1 - inT) * 46}px) scale(${0.86 + 0.14 * inT})`,
        filter: `blur(${(1 - sharp) * 12 + leave * 8}px)`,
      }}
    >
      <div style={{ height: 150 }}>{doodle}</div>
      <div style={{ fontFamily: fonts.note, fontSize: 84, fontWeight: 700, color: palette.tomato, marginTop: 8 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: -10 }}>
        <span style={{ fontFamily: fonts.emphasis, fontSize: 250, color: INK, lineHeight: 1.15 }}>{value}</span>
        <span style={{ fontFamily: fonts.script, fontSize: unit.length > 1 ? 120 : 170, fontWeight: 700, color: palette.cocoa }}>
          {unit}
        </span>
      </div>
      <div style={{ fontFamily: fonts.ui, fontSize: 32, color: palette.inkSoft, marginTop: 10, textAlign: "center" }}>
        {sub}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

const COUNT_LABELS = ["3", "2", "1"] as const;

/** Air thins out as the rocket climbs; the plume stops in space. */
const airAt = (e: number): number => 1 - c01((e - 255) / 90);
const nozzleY = (e: number): number => rocketY(e) + 168;

export const SpeedScene: React.FC = () => {
  const frame = useCurrentFrame();
  const scroll = scrollAt(frame);

  const bg = interpolateColors(
    frame,
    [0, FLIGHT_START, 270, 345, C.burst + 14, C.burst + 48],
    [palette.butter, palette.butter, palette.clay, SPACE, SPACE, palette.butter],
  );
  const starsAmount = interpolate(frame, [290, 340, C.burst + 4, C.burst + 36], [0, 1, 1, 0], clamp01);

  const shakeAmp = 10 * (1 - c01((frame - FLIGHT_START) / 50)) * (frame >= FLIGHT_START ? 1 : 0);
  const shakeX = Math.sin(frame * 2.3) * shakeAmp;
  const shakeY = Math.cos(frame * 3.1) * shakeAmp;

  const ry = rocketY(frame);
  const rx = ROCKET_X + rocketShake(frame);
  const flameLen =
    frame < FLIGHT_START
      ? 0
      : interpolate(frame, [FLIGHT_START, FLIGHT_START + 10], [0, 96], clamp01) + Math.sin(frame * 0.9) * 12;

  const burstB = frame - C.burst;
  const burstShake = burstB >= 0 ? 16 * (1 - c01(burstB / 30)) : 0;
  const burstShakeX = Math.sin(burstB * 2.9) * burstShake;
  const burstShakeY = Math.cos(burstB * 3.7) * burstShake;
  const leave = c01((frame - C.leave) / 29);

  // Altitude counter
  const p = c01((frame - FLIGHT_START) / (FLIGHT_END - FLIGHT_START));
  const altitude = Math.round(100000 * Math.pow(p, 2.4));
  const altText = altitude.toLocaleString("en-US");
  const altColor = interpolateColors(frame, [286, 312], [INK, CREAM]);
  const altOpacity = interpolate(frame, [FLIGHT_START, FLIGHT_START + 14, C.burst - 4, C.burst + 4], [0, 1, 1, 0], clamp01);

  // Size / startup numbers
  const sizeCount = Math.round(SIZE_MB * easeOut(c01((frame - C.sizeText) / 30)));
  const timeCount = Math.round(STARTUP_S * 10 * easeOut(c01((frame - C.timeText) / 26))) / 10;
  const clockProgress = c01((frame - C.timeText) / 24);
  const clockSpin = (frame - C.timeText - 8) * 22;

  const dividerP = c01((frame - (C.sizeText + 40)) / 30);

  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0, overflow: "hidden" }}
      >
        <SmokeDefs frame={frame} />
        {burstB >= 0 ? <ExplosionDefs b={burstB} /> : null}
        <Stars amount={starsAmount} frame={frame} scroll={scroll} />
        <g transform={`translate(${shakeX} ${shakeY})`}>
          <g transform={`translate(0 ${scroll * 0.55})`}>
            <path
              d="M-100 1080 L-100 820 L260 640 L520 780 L800 600 L1100 800 L1400 640 L1700 790 L2040 660 L2040 1080 Z"
              fill={palette.butterDeep}
              opacity={0.9}
            />
          </g>
          <Clouds scroll={scroll} />
          <g transform={`translate(0 ${scroll})`}>
            <Ground />
            <GroundBlast frame={frame} ignite={C.ignite} x={ROCKET_X} />
          </g>
          <Balloons scroll={scroll} frame={frame} />
          <Birds scroll={scroll} frame={frame} />
          {frame >= FLIGHT_START ? (
            <Plume
              frame={frame}
              scroll={scroll}
              first={C.ignite + 6}
              last={C.burst}
              x={ROCKET_X}
              emitY={nozzleY}
              scrollAt={scrollAt}
              air={airAt}
            />
          ) : null}
          {burstB < 0 ? (
            <g transform={`translate(${rx} ${ry})`}>
              <Flame length={flameLen} frame={frame} />
              <Rocket />
            </g>
          ) : null}
        </g>
        {burstB >= 0 ? (
          <g transform={`translate(${burstShakeX} ${burstShakeY})`}>
            <Explosion
              b={burstB}
              cx={ROCKET_X}
              cy={FLIGHT_Y}
              debris={
                <g transform={`translate(${ROCKET_X} ${FLIGHT_Y})`}>
                  <Rocket poses={partPoses(burstB)} />
                </g>
              }
            />
          </g>
        ) : null}
        {/* Hand-drawn divider between the two numbers */}
        <path
          pathLength={1}
          {...drawStroke(dividerP)}
          d="M960 250 C 944 380, 976 520, 960 660 C 948 760, 972 820, 960 880"
          stroke={palette.cocoaLight}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
          opacity={(1 - leave) * 0.7}
        />
      </svg>

      {/* "this small." note */}
      <div
        style={{
          position: "absolute",
          left: 1140,
          top: 700,
          transform: "rotate(-5deg)",
          opacity: 1 - c01((frame - 140) / 20),
        }}
      >
        <PenText text="this small." at={C.note} font={fonts.note} size={96} color={palette.cocoa} weight={700} />
      </div>
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0, opacity: 1 - c01((frame - 140) / 20) }}
      >
        <path
          pathLength={1}
          {...drawStroke((frame - (C.note + 34)) / 26)}
          d="M1128 776 C 1104 786, 1084 778, 1066 758 M1066 758 L 1092 756 M1066 758 L 1076 782"
          stroke={palette.cocoa}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      {/* Countdown */}
      {C.countdown.map((c, i) => {
        const a = frame - c;
        if (a < 0 || a > 30) {
          return null;
        }
        const t = easeOut(c01(a / 10));
        const opacity = c01(a / 4) * (1 - c01((a - 20) / 10));
        return (
          <div
            key={c}
            style={{
              position: "absolute",
              left: 1130,
              top: 250,
              width: 360,
              textAlign: "center",
              fontFamily: fonts.emphasis,
              fontSize: 330,
              color: palette.tomato,
              opacity,
              transform: `scale(${0.7 + 0.3 * t})`,
            }}
          >
            {COUNT_LABELS[i]}
          </div>
        );
      })}

      {/* Altitude */}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 64,
          opacity: altOpacity,
          color: altColor,
          fontFamily: fonts.note,
          fontWeight: 700,
          fontSize: 64,
          lineHeight: 1.1,
        }}
      >
        <div style={{ fontSize: 40, opacity: 0.8 }}>altitude</div>
        <div>{altText} m</div>
      </div>

      {/* Results */}
      <NumberBlock
        frame={frame}
        at={C.sizeText}
        x={500}
        label="about"
        value={`${sizeCount}`}
        unit="MB"
        sub="installed on macOS · about 14 MB to download"
        doodle={<Feather progress={c01((frame - C.sizeText) / 40)} />}
      />
      <NumberBlock
        frame={frame}
        at={C.timeText}
        x={1420}
        label="opens in about"
        value={timeCount.toFixed(1)}
        unit="s"
        sub="window up, measured on an M1 Mac"
        doodle={<Stopwatch progress={clockProgress} spin={clockSpin} />}
      />

    </AbsoluteFill>
  );
};
