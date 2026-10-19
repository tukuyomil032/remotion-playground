import type React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { fonts } from "../fonts";
import { palette, strokes } from "../theme";
import { FRAMES_PER_BAR } from "../timeline";
import { clamp01, drawStroke, easeIn, easeInOut, easeOut, swapAmount } from "../stage/motion";
import { Doodle, type DoodleKind } from "./Doodle";
import { PenText } from "./PenText";

// Title scene ("Create.", "Run." ...) on the flat butter background.
// Two script faces at most on this screen: Dancing Script (title) and
// Pacifico (emphasis word). The explanation line is Inter.
//
// Local timing (frames after enterAt):
//   0   counter "01 / 05" fades in
//   4   title is written (30 frames)
//   28  hand-drawn underline (18)
//   30  doodle is drawn (40)
//   38  explanation line blurs in (16)
//   52  emphasis word is written (26)
//   durationInFrames - 16: everything blurs out

export type TitleCardProps = {
  /** Feature number, 1-based. */
  n: number;
  /** Number of features. Default 5. */
  total?: number;
  /** Main headline (Dancing Script), e.g. "Create." */
  title: string;
  /** Emphasis word or phrase (Pacifico, tomato), e.g. "in one form". */
  em?: string;
  /** One-line explanation (Inter). Facts only. */
  sub: string;
  doodle: DoodleKind;
  /** Local frame where the card starts. Default 0. */
  enterAt?: number;
  /** Scene length in frames, for the exit. Default one bar (120). */
  durationInFrames?: number;
};

const TITLE_SIZE = 230;
const EXIT_FRAMES = 16;

const UNDERLINE_D = "M8 22 C 170 8, 330 30, 520 17 S 840 27, 992 11";

export const TitleCard: React.FC<TitleCardProps> = ({
  n,
  total = 5,
  title,
  em,
  sub,
  doodle,
  enterAt = 0,
  durationInFrames = FRAMES_PER_BAR,
}) => {
  const frame = useCurrentFrame();
  const t = (local: number): number => enterAt + local;

  const counter = interpolate(frame, [t(0), t(14)], [0, 1], { ...clamp01, easing: easeOut });
  const underline = interpolate(frame, [t(28), t(46)], [0, 1], { ...clamp01, easing: easeInOut });
  const subIn = swapAmount(frame, t(38), undefined, 16);
  const exit = interpolate(frame, [durationInFrames - EXIT_FRAMES, durationInFrames], [0, 1], {
    ...clamp01,
    easing: easeIn,
  });
  const label = `${String(n).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

  return (
    <AbsoluteFill
      style={{
        opacity: 1 - exit,
        filter: exit > 0.005 ? `blur(${exit * 12}px)` : undefined,
        transform: `translateY(${-24 * exit}px)`,
      }}
    >
      {/* Section counter */}
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 72,
          fontFamily: fonts.ui,
          fontSize: 24,
          fontWeight: 600,
          letterSpacing: "0.06em",
          color: palette.ink,
          opacity: 0.62 * counter,
          transform: `translateY(${(1 - counter) * 10}px)`,
        }}
      >
        {label}
      </div>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 30 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Title + doodle + underline */}
          <div style={{ position: "relative", display: "inline-block" }}>
            <PenText text={title} at={t(4)} durationFrames={30} size={TITLE_SIZE} font={fonts.script} weight={700} lineHeight={1.05} />
            <div
              style={{
                position: "absolute",
                left: "calc(100% + 40px)",
                top: -18,
                transform: "rotate(7deg)",
              }}
            >
              <Doodle kind={doodle} at={t(30)} size={150} color={palette.cocoa} />
            </div>
            <svg
              width="108%"
              height={36}
              viewBox="0 0 1000 36"
              preserveAspectRatio="none"
              fill="none"
              style={{ position: "absolute", left: "-4%", bottom: -22, overflow: "visible" }}
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

          {/* Explanation line */}
          <div
            style={{
              marginTop: 58,
              fontFamily: fonts.ui,
              fontSize: 36,
              fontWeight: 500,
              color: palette.inkSoft,
              opacity: subIn,
              filter: subIn < 0.995 ? `blur(${(1 - subIn) * 10}px)` : undefined,
              transform: `translateY(${(1 - subIn) * 8}px)`,
              whiteSpace: "pre",
            }}
          >
            {sub}
          </div>

          {/* Emphasis word */}
          {em ? (
            <div style={{ marginTop: 30, transform: "rotate(-3deg)" }}>
              <PenText text={em} at={t(52)} durationFrames={26} size={66} font={fonts.emphasis} weight={400} color={palette.tomato} lineHeight={1.3} />
            </div>
          ) : null}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
