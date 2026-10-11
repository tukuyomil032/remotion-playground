import type React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { fonts } from "../fonts";
import { palette } from "../theme";
import { clamp01, easeOut } from "../stage/motion";

// Text that appears as if written with a pen: a slanted clip edge sweeps from
// left to right. Three faint copies just ahead of the edge soften it (no
// mask ramps). Layout is reserved from frame 0, so nothing jumps.

const penEase = Easing.bezier(0.3, 0.05, 0.45, 1);

/** Width of each soft step ahead of the edge, px. */
const SOFT_STEP = 7;
const SOFT_OPACITY = [0.55, 0.3, 0.12] as const;

export type PenTextProps = {
  text: string;
  /** Local frame where writing starts. */
  at?: number;
  /** Frames to write the whole string. Default: about 2.6 frames per character, at least 18. */
  durationFrames?: number;
  /** Font family. Default Dancing Script (fonts.script). */
  font?: string;
  /** Font size in px. Default 200. */
  size?: number;
  color?: string;
  weight?: number;
  /** Optional local frame where the text blurs out (12 frames). */
  until?: number;
  lineHeight?: number;
  style?: React.CSSProperties;
};

/** Default writing time for a string. */
export const penDuration = (text: string): number => Math.max(18, Math.round(text.length * 2.6));

const clipAt = (p: number, ahead: number, slant: number): string => {
  // The edge travels from fully hidden (left) to fully shown (right),
  // including the soft steps and the slant.
  const span = 2 * slant + SOFT_STEP * SOFT_OPACITY.length;
  const edge = `(${p} * (100% + ${span}px) - ${slant + SOFT_STEP * SOFT_OPACITY.length - ahead}px)`;
  return `polygon(-30% -60%, calc(${edge} + ${slant}px) -60%, calc(${edge} - ${slant}px) 160%, -30% 160%)`;
};

export const PenText: React.FC<PenTextProps> = ({
  text,
  at = 0,
  durationFrames,
  font = fonts.script,
  size = 200,
  color = palette.ink,
  weight = 700,
  until,
  lineHeight = 1.15,
  style,
}) => {
  const frame = useCurrentFrame();
  const dur = durationFrames ?? penDuration(text);
  const p = interpolate(frame, [at, at + dur], [0, 1], { ...clamp01, easing: penEase });
  const out = until === undefined ? 1 : 1 - interpolate(frame, [until, until + 12], [0, 1], { ...clamp01, easing: easeOut });
  const slant = size * 0.1;

  const base: React.CSSProperties = {
    display: "block",
    fontFamily: font,
    fontSize: size,
    fontWeight: weight,
    lineHeight,
    color,
    whiteSpace: "pre",
    // Room for script swashes that overhang the advance width; the wrapper's
    // negative margin cancels it in the layout.
    padding: "0.08em 0.2em",
  };

  const writing = p > 0 && p < 1;

  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        fontSize: size,
        margin: "-0.08em -0.2em",
        opacity: out,
        filter: out < 0.995 ? `blur(${(1 - out) * 12}px)` : undefined,
        ...style,
      }}
    >
      <span
        style={{
          ...base,
          visibility: p <= 0 ? "hidden" : "visible",
          clipPath: writing ? clipAt(p, 0, slant) : undefined,
        }}
      >
        {text}
      </span>
      {writing
        ? SOFT_OPACITY.map((o, k) => (
            <span
              key={k}
              aria-hidden
              style={{
                ...base,
                position: "absolute",
                inset: 0,
                opacity: o,
                clipPath: clipAt(p, SOFT_STEP * (k + 1), slant),
              }}
            >
              {text}
            </span>
          ))
        : null}
    </span>
  );
};
