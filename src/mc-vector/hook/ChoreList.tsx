import type React from "react";
import { interpolate, random, useCurrentFrame } from "remotion";
import { fonts } from "../fonts";
import { palette, strokes } from "../theme";
import { clamp01, drawStroke, easeInOut, easeOut } from "../stage/motion";
import { PenText } from "../title/PenText";

// The nine chores every Minecraft server needs, as a hand-written checklist
// (Caveat) on the butter background. Each row: a hand-drawn box, the word
// written with a pen, then a tomato tick. Shared by Hook (writes it) and
// Name (shows it finished, circles it, then lets it go).

export const CHORES = ["Java", "jar", "EULA", "ports", "properties", "plugins", "logs", "backups", "updates"] as const;

/** Grid geometry in screen px (1920 x 1080). 3 columns x 3 rows. */
export const LIST_COL_W = 440;
export const LIST_ROW_H = 134;
export const LIST_LEFT = 960 - (LIST_COL_W * 3) / 2 + 70;
export const LIST_TOP = 430;
/** Center of the list block, used by the loop that circles it. */
export const LIST_CENTER = { x: 960, y: LIST_TOP + LIST_ROW_H * 1.5 - 10 };

const TEXT_SIZE = 86;
const BOX = 58;

// Slightly uneven square, 60 x 60 box.
const BOX_D = "M8 10 C 22 8, 38 9, 52 8 C 53 22, 52 38, 53 52 C 38 53, 22 52, 9 53 C 8 38, 9 22, 8 10";
// Quick tick that overshoots the box a little.
const TICK_D = "M12 32 C 18 36, 22 42, 26 48 C 34 32, 44 16, 60 2";

/** Local frames for one row, relative to its start. */
const BOX_FRAMES = 8;
const TEXT_DELAY = 4;
const TICK_FRAMES = 10;

const textFrames = (word: string): number => Math.max(14, Math.round(word.length * 2.2));

export type ChoreListProps = {
  /** Local frame where the first row starts. Pass a large negative number to show it finished. */
  at: number;
  /** Frames between rows. Default 15 (half a beat). */
  stagger?: number;
  /** Optional local frame where rows start to blur out, one after another. */
  exitAt?: number;
  /** Frames between rows on the way out. Default 3. */
  exitStagger?: number;
};

const Row: React.FC<{ word: string; index: number; start: number; exitAt?: number }> = ({ word, index, start, exitAt }) => {
  const frame = useCurrentFrame();
  const col = index % 3;
  const row = Math.floor(index / 3);
  const tf = textFrames(word);

  const boxP = interpolate(frame, [start, start + BOX_FRAMES], [0, 1], { ...clamp01, easing: easeInOut });
  const tickAt = start + TEXT_DELAY + tf + 2;
  const tickP = interpolate(frame, [tickAt, tickAt + TICK_FRAMES], [0, 1], { ...clamp01, easing: easeOut });
  const out = exitAt === undefined ? 0 : interpolate(frame, [exitAt, exitAt + 12], [0, 1], { ...clamp01, easing: easeOut });

  if (boxP <= 0 || out >= 0.998) {
    return null;
  }

  // Hand-written rows are never perfectly aligned.
  const jx = (random(`chore-x-${index}`) - 0.5) * 22;
  const jy = (random(`chore-y-${index}`) - 0.5) * 14;
  const rot = (random(`chore-r-${index}`) - 0.5) * 4;

  const stroke = { strokeLinecap: "round", strokeLinejoin: "round", fill: "none", pathLength: 1 } as const;

  return (
    <div
      style={{
        position: "absolute",
        left: LIST_LEFT + col * LIST_COL_W + jx,
        top: LIST_TOP + row * LIST_ROW_H + jy,
        display: "flex",
        alignItems: "center",
        gap: 22,
        transform: `rotate(${rot}deg) translateY(${-10 * out}px)`,
        transformOrigin: "0% 50%",
        opacity: 1 - out,
        filter: out > 0.005 ? `blur(${out * 10}px)` : undefined,
      }}
    >
      <svg width={BOX} height={BOX} viewBox="0 0 60 60" style={{ flexShrink: 0, overflow: "visible" }}>
        <path d={BOX_D} stroke={palette.cocoa} strokeWidth={strokes.doodle} {...stroke} {...drawStroke(boxP)} />
        {tickP > 0 ? (
          <path d={TICK_D} stroke={palette.tomato} strokeWidth={strokes.arrow + 1} {...stroke} {...drawStroke(tickP)} />
        ) : null}
      </svg>
      <PenText
        text={word}
        at={start + TEXT_DELAY}
        durationFrames={tf}
        font={fonts.note}
        size={TEXT_SIZE}
        weight={700}
        color={palette.ink}
        lineHeight={1}
      />
    </div>
  );
};

export const ChoreList: React.FC<ChoreListProps> = ({ at, stagger = 15, exitAt, exitStagger = 3 }) => (
  <>
    {CHORES.map((word, i) => (
      <Row
        key={word}
        word={word}
        index={i}
        start={at + i * stagger}
        exitAt={exitAt === undefined ? undefined : exitAt + i * exitStagger}
      />
    ))}
  </>
);
