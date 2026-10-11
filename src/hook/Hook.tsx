import type React from "react";
import { AbsoluteFill, Img, interpolate, interpolateColors, Sequence, staticFile, useCurrentFrame } from "remotion";
import { fonts } from "../fonts";
import { palette, shadows, strokes } from "../theme";
import { clamp01, drawStroke, easeIn, easeInOut, easeOut, lerp, swapAmount, useMove } from "../stage/motion";
import { PenText } from "../title/PenText";
import { ChoreList, LIST_CENTER } from "./ChoreList";

// Bars 0-4 on the butter background.
//
// Hook (bars 0-2): "Every Minecraft server needs this." is written, then the
// nine chores are written one by one and ticked off.
// Name (bars 2-4): one tomato line loops around the whole list. "What if it
// all lived in one window?" The loop tightens into a rounded window frame,
// the list lets go, and the icon and "MC-Vector" appear inside. The window
// then slides out to the right; op1 brings the real window back from the
// right.
//
// Script faces per moment (max two): headline Dancing + list Caveat, then
// question Caveat + Pacifico, then name Dancing alone.

type BeatProps = { from: number; durationInFrames: number };

const HEADLINE = "Every Minecraft server needs this.";
const HEADLINE_TOP = 148;
const HEADLINE_SIZE = 104;

const Headline: React.FC<{ at: number; until?: number }> = ({ at, until }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: HEADLINE_TOP, display: "flex", justifyContent: "center" }}>
    <PenText text={HEADLINE} at={at} durationFrames={46} font={fonts.script} size={HEADLINE_SIZE} weight={700} until={until} lineHeight={1.1} />
  </div>
);

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const LIST_AT = 34;

const HookBody: React.FC = () => {
  const frame = useCurrentFrame();
  // Tiny tomato aside after the last tick.
  const asideAt = 186;
  const aside = interpolate(frame, [asideAt - 4, asideAt + 6], [0, 1], { ...clamp01, easing: easeOut });

  return (
    <AbsoluteFill>
      <Headline at={6} />
      <ChoreList at={LIST_AT} />
      {aside > 0 ? (
        <div style={{ position: "absolute", left: 1300, top: 866, transform: "rotate(-5deg)", opacity: aside }}>
          <PenText text="...every single time." at={asideAt} durationFrames={30} font={fonts.note} size={60} weight={700} color={palette.tomato} lineHeight={1} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const Hook: React.FC<BeatProps> = ({ from, durationInFrames }) => (
  <Sequence from={from} durationInFrames={durationInFrames} name="hook Every server needs this">
    <HookBody />
  </Sequence>
);

// ---------------------------------------------------------------------------
// Name
// ---------------------------------------------------------------------------

// Loop around the list (hand-drawn ellipse) and the window it becomes.
const LOOP_A = 800;
const LOOP_B = 340;
const LOOP_TILT = (-2.5 * Math.PI) / 180;
/** The stroke goes a bit past a full turn, like a quick pen loop. */
const LOOP_SWEEP = Math.PI * 2 * 1.09;
const LOOP_START = (200 * Math.PI) / 180;
const SAMPLES = 260;

const WIN_W = 1200;
const WIN_H = 660;
const WIN_R = 30;
const WIN_CX = 960;
const WIN_CY = LIST_CENTER.y;
const WIN_LEFT = WIN_CX - WIN_W / 2;
const WIN_TOP = WIN_CY - WIN_H / 2;
const BAR_H = 70;

/** Point where a ray from the center at (c, s) meets a rounded rect (half sizes hw, hh, radius r). */
const rayRoundRect = (c: number, s: number, hw: number, hh: number, r: number): { x: number; y: number } => {
  const ac = Math.abs(c);
  const as = Math.abs(s);
  let t = Math.min(ac > 1e-6 ? hw / ac : Infinity, as > 1e-6 ? hh / as : Infinity);
  const px = t * ac;
  const py = t * as;
  if (px > hw - r && py > hh - r) {
    // Corner arc centered at (hw - r, hh - r).
    const ox = hw - r;
    const oy = hh - r;
    const b = ac * ox + as * oy;
    const cc = ox * ox + oy * oy - r * r;
    t = b + Math.sqrt(Math.max(0, b * b - cc));
  }
  return { x: Math.sign(c) * t * ac, y: Math.sign(s) * t * as };
};

/** Loop (m = 0) -> window frame (m = 1), as an SVG path in screen px. */
const loopPath = (m: number): string => {
  const pts: string[] = [];
  const hand = 1 - m;
  const cx = lerp(LIST_CENTER.x, WIN_CX, m);
  const cy = lerp(LIST_CENTER.y, WIN_CY, m);
  for (let i = 0; i <= SAMPLES; i++) {
    const u = i / SAMPLES;
    const th = LOOP_START + u * LOOP_SWEEP;
    // Hand-drawn: a little wobble, and the pen ends slightly inside its start.
    const wobble = 1 + hand * (0.022 * Math.sin(3 * th + 0.7) + 0.014 * Math.sin(7 * th + 1.9) + 0.035 - 0.07 * u);
    const ex = LOOP_A * Math.cos(th) * wobble;
    const ey = LOOP_B * Math.sin(th) * wobble;
    const tilt = LOOP_TILT * hand;
    const lx = ex * Math.cos(tilt) - ey * Math.sin(tilt);
    const ly = ex * Math.sin(tilt) + ey * Math.cos(tilt);
    const w = rayRoundRect(Math.cos(th), Math.sin(th), WIN_W / 2, WIN_H / 2, WIN_R);
    const x = cx + lerp(lx, w.x, m);
    const y = cy + lerp(ly, w.y, m);
    pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return pts.join(" ");
};

// Name timing (local frames).
const N = {
  headlineOut: 0,
  loopAt: 2,
  loopEnd: 38,
  askAt: 14,
  emAt: 46,
  listOut: 96,
  morphAt: 100,
  morphEnd: 146,
  askOut: 118,
  barAt: 134,
  fillAt: 136,
  iconAt: 140,
  nameAt: 146,
  subAt: 172,
  slideAt: 210,
} as const;

const NameBody: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();

  const loopP = interpolate(frame, [N.loopAt, N.loopEnd], [0, 1], { ...clamp01, easing: easeInOut });
  const morph = interpolate(frame, [N.morphAt, N.morphEnd], [0, 1], { ...clamp01, easing: easeInOut });
  const strokeColor = interpolateColors(morph, [0, 1], [palette.tomato, palette.ink]);
  const strokeW = lerp(strokes.underline, 6, morph);

  const barP = interpolate(frame, [N.barAt, N.barAt + 16], [0, 1], { ...clamp01, easing: easeInOut });
  const fill = interpolate(frame, [N.fillAt, N.fillAt + 18], [0, 1], { ...clamp01, easing: easeOut });
  const icon = useMove(N.iconAt);
  const sub = swapAmount(frame, N.subAt, undefined, 16);

  const slide = interpolate(frame, [N.slideAt, durationInFrames], [0, 1], { ...clamp01, easing: easeIn });
  const slideX = 1560 * slide;
  const slideY = 50 * slide;
  const tilt = 7 * slide;

  const dots = [palette.tomato, palette.clay, palette.cocoaLight];

  return (
    <AbsoluteFill>
      <Headline at={-100} until={N.headlineOut} />
      <ChoreList at={-1000} exitAt={N.listOut} />

      {/* The question. Caveat + Pacifico. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 92,
          display: "flex",
          justifyContent: "center",
          alignItems: "baseline",
          gap: 26,
        }}
      >
        <PenText text="What if it all lived in" at={N.askAt} durationFrames={32} font={fonts.note} size={92} weight={700} until={N.askOut} lineHeight={1.2} />
        <PenText
          text="one window?"
          at={N.emAt}
          durationFrames={26}
          font={fonts.emphasis}
          size={84}
          weight={400}
          color={palette.tomato}
          until={N.askOut + 4}
          lineHeight={1.2}
          style={{ transform: "rotate(-3deg)" }}
        />
      </div>

      {/* Loop -> window, then the window leaves to the right. */}
      <AbsoluteFill
        style={{
          transform: `translate(${slideX}px, ${slideY}px) rotate(${tilt}deg)`,
          transformOrigin: `${WIN_CX}px ${WIN_CY}px`,
        }}
      >
        {fill > 0 ? (
          <div
            style={{
              position: "absolute",
              left: WIN_LEFT,
              top: WIN_TOP,
              width: WIN_W,
              height: WIN_H,
              borderRadius: WIN_R,
              background: palette.butterLight,
              boxShadow: shadows.card,
              opacity: fill,
            }}
          />
        ) : null}

        <svg width={1920} height={1080} viewBox="0 0 1920 1080" fill="none" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {loopP > 0 ? (
            <path
              d={loopPath(morph)}
              stroke={strokeColor}
              strokeWidth={strokeW}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              {...drawStroke(loopP)}
            />
          ) : null}
          {barP > 0 ? (
            <>
              <path
                d={`M ${WIN_LEFT + 2} ${WIN_TOP + BAR_H} C ${WIN_LEFT + 400} ${WIN_TOP + BAR_H - 2}, ${WIN_LEFT + 800} ${WIN_TOP + BAR_H + 2}, ${WIN_LEFT + WIN_W - 2} ${WIN_TOP + BAR_H}`}
                stroke={palette.ink}
                strokeWidth={4}
                strokeLinecap="round"
                pathLength={1}
                {...drawStroke(barP)}
              />
              {dots.map((c, i) => {
                const p = interpolate(frame, [N.barAt + i * 4, N.barAt + i * 4 + 10], [0, 1], { ...clamp01, easing: easeOut });
                return (
                  <circle
                    key={c}
                    cx={WIN_LEFT + 40 + i * 34}
                    cy={WIN_TOP + BAR_H / 2}
                    r={10 * p}
                    fill={c}
                    stroke={palette.ink}
                    strokeWidth={3}
                  />
                );
              })}
            </>
          ) : null}
        </svg>

        {/* Icon + name inside the window. Dancing Script only. */}
        <div
          style={{
            position: "absolute",
            left: WIN_LEFT,
            top: WIN_TOP + BAR_H,
            width: WIN_W,
            height: WIN_H - BAR_H,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 44 }}>
            {icon > 0.001 ? (
              <Img
                src={staticFile("brand/icon.png")}
                style={{
                  width: 176,
                  height: 176,
                  borderRadius: "50%",
                  boxShadow: shadows.card,
                  opacity: Math.min(1, icon * 1.6),
                  transform: `scale(${0.7 + 0.3 * icon}) rotate(${(1 - icon) * -14}deg)`,
                }}
              />
            ) : (
              <div style={{ width: 176, height: 176 }} />
            )}
            <PenText text="MC-Vector" at={N.nameAt} durationFrames={30} font={fonts.script} size={176} weight={700} lineHeight={1.1} />
          </div>
          <div
            style={{
              fontFamily: fonts.ui,
              fontSize: 36,
              fontWeight: 500,
              color: palette.inkSoft,
              opacity: sub,
              filter: sub < 0.995 ? `blur(${(1 - sub) * 10}px)` : undefined,
              transform: `translateY(${(1 - sub) * 8}px)`,
            }}
          >
            Your Minecraft servers, in one window.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Name: React.FC<BeatProps> = ({ from, durationInFrames }) => (
  <Sequence from={from} durationInFrames={durationInFrames} name="name What if / MC-Vector">
    <NameBody durationInFrames={durationInFrames} />
  </Sequence>
);
