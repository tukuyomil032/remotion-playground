import type React from "react";
import { AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { fonts } from "../fonts";
import { palette, shadows, strokes } from "../theme";
import { clamp01, drawStroke, easeInOut, easeOut, lerp, swapAmount, useMove } from "../stage/motion";
import { PenText } from "../title/PenText";

// Bars 24-28 on the butter background.
// "Stop babysitting." (Dancing Script) / "Start playing." ("playing." in
// Pacifico, tomato) is written large, then shrinks to the top. The icon
// appears small, the install commands are typed on two paper slips
// (JetBrains Mono), then the repository and a small "Built with Rust" line.
// Script faces on this screen: Dancing Script + Pacifico only; everything
// else is Inter or JetBrains Mono.

type BeatProps = { from: number; durationInFrames: number };

// Local timing.
const T = {
  stopAt: 8,
  startAt: 58,
  playingAt: 76,
  underlineAt: 108,
  liftAt: 172,
  liftEnd: 220,
  iconAt: 208,
  macSlipAt: 236,
  winSlipAt: 248,
  mac1At: 254,
  mac2At: 284,
  winAt: 320,
  repoAt: 356,
  footAt: 392,
} as const;

const LIFT_SCALE = 0.58;
/** Tagline center y: big (centered) -> small (top). */
const TAG_Y0 = 510;
const TAG_Y1 = 196;

const UNDERLINE_D = "M6 20 C 90 9, 190 26, 300 14 S 450 22, 494 10";

const Tagline: React.FC = () => {
  const frame = useCurrentFrame();
  const lift = interpolate(frame, [T.liftAt, T.liftEnd], [0, 1], { ...clamp01, easing: easeInOut });
  const underline = interpolate(frame, [T.underlineAt, T.underlineAt + 18], [0, 1], { ...clamp01, easing: easeInOut });
  const y = lerp(TAG_Y0, TAG_Y1, lift) - 540;
  const s = lerp(1, LIFT_SCALE, lift);

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        transform: `translateY(${y}px) scale(${s})`,
        transformOrigin: "50% 50%",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <PenText text="Stop babysitting." at={T.stopAt} durationFrames={42} font={fonts.script} size={156} weight={700} lineHeight={1.12} />
        <div style={{ display: "flex", alignItems: "baseline", gap: 40 }}>
          <PenText text="Start" at={T.startAt} durationFrames={18} font={fonts.script} size={156} weight={700} lineHeight={1.12} />
          <div style={{ position: "relative", transform: "rotate(-3deg)" }}>
            <PenText text="playing." at={T.playingAt} durationFrames={30} font={fonts.emphasis} size={136} weight={400} color={palette.tomato} lineHeight={1.3} />
            <svg
              width="104%"
              height={30}
              viewBox="0 0 500 30"
              preserveAspectRatio="none"
              fill="none"
              style={{ position: "absolute", left: "-2%", bottom: 2, overflow: "visible" }}
            >
              {underline > 0 ? (
                <path
                  d={UNDERLINE_D}
                  stroke={palette.tomato}
                  strokeWidth={strokes.underline}
                  strokeLinecap="round"
                  pathLength={1}
                  {...drawStroke(underline)}
                />
              ) : null}
            </svg>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Typed with string slicing; the untyped rest keeps its width so nothing shifts. */
const Typed: React.FC<{ text: string; at: number; framesPerChar?: number }> = ({ text, at, framesPerChar = 1 }) => {
  const frame = useCurrentFrame();
  const n = Math.max(0, Math.min(text.length, Math.floor((frame - at) / framesPerChar)));
  const typing = frame >= at && n < text.length;
  // Caret shows while typing and for a short beat after, blinking every 15 frames.
  const caretOn = frame >= at && frame < at + text.length * framesPerChar + 24 && Math.floor((frame - at) / 15) % 2 === 0;
  return (
    <span style={{ position: "relative", whiteSpace: "pre" }}>
      {text.slice(0, n)}
      <span
        style={{
          display: "inline-block",
          width: 0,
          overflow: "visible",
        }}
      >
        {caretOn || typing ? (
          <span
            style={{
              display: "inline-block",
              width: 3,
              height: "1.05em",
              marginLeft: 2,
              transform: "translateY(0.18em)",
              background: palette.tomato,
            }}
          />
        ) : null}
      </span>
      <span style={{ visibility: "hidden" }}>{text.slice(n)}</span>
    </span>
  );
};

const CommandLine: React.FC<{ text: string; at: number }> = ({ text, at }) => {
  const frame = useCurrentFrame();
  const shown = frame >= at - 2;
  return (
    <div style={{ display: "flex", gap: 16, fontFamily: fonts.mono, fontSize: 31, fontWeight: 500, color: palette.ink, lineHeight: 1.5 }}>
      <span style={{ color: palette.cocoaLight, opacity: shown ? 1 : 0 }}>$</span>
      <Typed text={text} at={at} />
    </div>
  );
};

const Slip: React.FC<{ at: number; label: string; rotate: number; children: React.ReactNode }> = ({ at, label, rotate, children }) => {
  const frame = useCurrentFrame();
  const v = useMove(at, 26, 160);
  const tape = interpolate(frame, [at + 6, at + 16], [0, 1], { ...clamp01, easing: easeOut });
  // Always laid out (hidden before `at`) so the other slip never shifts.
  return (
    <div
      style={{
        visibility: frame < at ? "hidden" : "visible",
        position: "relative",
        padding: "26px 36px 24px",
        background: palette.butterLight,
        borderRadius: 10,
        boxShadow: shadows.card,
        opacity: Math.min(1, v * 1.4),
        transform: `translateY(${(1 - v) * 30}px) rotate(${rotate * v + (1 - v) * rotate * 2.5}deg)`,
      }}
    >
      {/* A strip of tape holding the slip. */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: -16,
          width: 120,
          height: 30,
          marginLeft: -60,
          background: palette.clay,
          opacity: 0.6 * tape,
          transform: `rotate(${-rotate * 2 - 3}deg)`,
          borderRadius: 3,
        }}
      />
      <div style={{ fontFamily: fonts.ui, fontSize: 22, fontWeight: 600, color: palette.cocoa, marginBottom: 10 }}>{label}</div>
      {children}
    </div>
  );
};

const OutroBody: React.FC = () => {
  const frame = useCurrentFrame();
  const icon = useMove(T.iconAt);
  const brand = swapAmount(frame, T.iconAt + 6, undefined, 16);
  const repo = swapAmount(frame, T.repoAt, undefined, 16);
  const repoLine = interpolate(frame, [T.repoAt + 10, T.repoAt + 30], [0, 1], { ...clamp01, easing: easeInOut });
  const foot = swapAmount(frame, T.footAt, undefined, 18);

  const blurIn = (v: number): React.CSSProperties => ({
    opacity: v,
    filter: v < 0.995 ? `blur(${(1 - v) * 10}px)` : undefined,
    transform: `translateY(${(1 - v) * 10}px)`,
  });

  return (
    <AbsoluteFill>
      <Tagline />

      {/* Icon + name (small). */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 384, display: "flex", justifyContent: "center", alignItems: "center", gap: 20 }}>
        {icon > 0.001 ? (
          <Img
            src={staticFile("mc-vector/brand/icon.png")}
            style={{
              width: 84,
              height: 84,
              borderRadius: "50%",
              boxShadow: shadows.card,
              opacity: Math.min(1, icon * 1.6),
              transform: `scale(${0.6 + 0.4 * icon})`,
            }}
          />
        ) : null}
        <div style={{ fontFamily: fonts.ui, fontSize: 44, fontWeight: 800, letterSpacing: -0.5, color: palette.ink, ...blurIn(brand) }}>MC-Vector</div>
      </div>

      {/* Install commands on paper slips. */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 540, display: "flex", justifyContent: "center", alignItems: "flex-start", gap: 64 }}>
        <Slip at={T.macSlipAt} label="macOS" rotate={-1.3}>
          <CommandLine text="brew tap tukuyomil032/tap" at={T.mac1At} />
          <CommandLine text="brew install --cask mc-vector" at={T.mac2At} />
        </Slip>
        <Slip at={T.winSlipAt} label="Windows" rotate={1.2}>
          <CommandLine text="scoop install mc-vector" at={T.winAt} />
        </Slip>
      </div>

      {/* Repository. */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 820, display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative", fontFamily: fonts.mono, fontSize: 36, fontWeight: 500, color: palette.ink, ...blurIn(repo) }}>
          github.com/tukuyomil032/MC-Vector
          <svg
            width="102%"
            height={20}
            viewBox="0 0 500 20"
            preserveAspectRatio="none"
            fill="none"
            style={{ position: "absolute", left: "-1%", bottom: -16, overflow: "visible" }}
          >
            {repoLine > 0 ? (
              <path
                d="M4 12 C 120 6, 260 16, 380 9 S 470 12, 496 8"
                stroke={palette.tomato}
                strokeWidth={strokes.arrow}
                strokeLinecap="round"
                pathLength={1}
                {...drawStroke(repoLine)}
              />
            ) : null}
          </svg>
        </div>
      </div>

      {/* Small print. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 912,
          textAlign: "center",
          fontFamily: fonts.ui,
          fontSize: 26,
          fontWeight: 500,
          color: palette.inkSoft,
          ...blurIn(foot),
        }}
      >
        Built with Rust · macOS · Windows
      </div>
    </AbsoluteFill>
  );
};

export const Outro: React.FC<BeatProps> = ({ from, durationInFrames }) => (
  <Sequence from={from} durationInFrames={durationInFrames} name="outro Stop babysitting">
    <OutroBody />
  </Sequence>
);
