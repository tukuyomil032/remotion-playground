import type React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { fonts } from "../fonts";
import { palette, shadows, strokes } from "../theme";
import { SECURITY_CUES } from "../timeline";
import { clamp01, drawStroke, easeIn, easeInOut, easeOut } from "../stage/motion";
import { PenText } from "../title/PenText";

// Security scene: a paper table on the butter background (the Backdrop under
// it is drawn by Promo). Scene-local frames, 600 long.
//
// Timing (SECURITY_CUES):
//   10       heading is written
//   80       card and header line are drawn like pen lines
//   rows[i]  row i starts: icon strokes, then Protection, What it does (+20),
//            Why it's good (+52), tomato underline under the Why words (+64)
//   540      Rust · Tauri circle is drawn; the camera is back at 1.0
//   575-599  the whole scene fades and blurs out

const ROWS_AT = SECURITY_CUES.rows;
const OUTRO_AT = SECURITY_CUES.outro;
const FADE_AT = 575;

const CARD = { x: 210, y: 262, w: 1500, headH: 68, rowH: 118 } as const;
const CARD_H = CARD.headH + ROWS_AT.length * CARD.rowH;

// Column text boxes, relative to the card (icon sits in the first column).
const COL1 = { left: 102, width: 270 };
const COL2 = { left: 414, width: 600 };
const COL3 = { left: 1054, width: 386 };

// Ink, not inkSoft: inkSoft already has 74% alpha, and the 0.7 settle on
// passed rows would push it below a readable contrast. Weight 400 keeps it
// visually lighter than the Protection column.
const WHAT_STYLE: React.CSSProperties = {
  fontFamily: fonts.ui,
  fontWeight: 400,
  fontSize: 25,
  lineHeight: 1.42,
  color: palette.ink,
};

type IconKind = "shield" | "lock" | "tray" | "key" | "box";

type RowData = {
  protection: string;
  what: string;
  whyPre: string;
  whyHi: string;
  icon: IconKind;
};

const ROW_DATA: readonly RowData[] = [
  {
    protection: "Strict CSP",
    what: "Scripts run only from the app itself. Network calls go only to named hosts.",
    whyPre: "Injected scripts can't ",
    whyHi: "phone home.",
    icon: "shield",
  },
  {
    protection: "Least-privilege permissions",
    what: "Capabilities are split by purpose. None allows running shell commands.",
    whyPre: "The UI can't run ",
    whyHi: "arbitrary commands.",
    icon: "lock",
  },
  {
    protection: "Allow-listed downloads",
    what: "Jars, plugins, Java and ngrok come only from named hosts, with size limits and checksum checks.",
    whyPre: "No surprise files from ",
    whyHi: "random places.",
    icon: "tray",
  },
  {
    protection: "Tokens in the OS keychain",
    what: "The ngrok token lives in Keychain / Credential Manager. The UI only knows whether it's set.",
    whyPre: "No plain-text secrets ",
    whyHi: "lying around.",
    icon: "key",
  },
  {
    protection: "Safe archive handling",
    what: "Extraction caps size, entry count and depth, and rejects \u201c..\u201d, absolute paths and symlinks.",
    whyPre: "Zip bombs and path tricks ",
    whyHi: "don't land.",
    icon: "box",
  },
];

// Icon strokes in a 120 x 120 box. Each entry is drawn one after another.
const ICONS: Record<IconKind, readonly { d: string; color: string }[]> = {
  shield: [
    { d: "M60 12 C 76 22, 90 25, 104 25 C 104 62, 96 90, 60 110 C 24 90, 16 62, 16 25 C 30 25, 44 22, 60 12 Z", color: palette.cocoa },
    { d: "M42 62 L 56 76 L 80 50", color: palette.tomato },
  ],
  lock: [
    { d: "M42 48 L 42 34 C 42 16, 78 16, 78 34 L 78 48", color: palette.cocoa },
    { d: "M30 56 C 30 50, 34 48, 40 48 L 80 48 C 86 48, 90 50, 90 56 L 90 98 C 90 104, 86 106, 80 106 L 40 106 C 34 106, 30 104, 30 98 Z", color: palette.cocoa },
    { d: "M60 66 C 66 66, 69 72, 66 78 L 69 92 L 51 92 L 54 78 C 51 72, 54 66, 60 66 Z", color: palette.tomato },
  ],
  tray: [
    { d: "M60 12 L 60 76", color: palette.cocoa },
    { d: "M44 60 L 60 76 L 76 60", color: palette.cocoa },
    { d: "M14 70 L 36 70 C 40 84, 80 84, 84 70 L 106 70 L 96 102 C 94 106, 90 108, 86 108 L 34 108 C 30 108, 26 106, 24 102 Z", color: palette.cocoa },
  ],
  key: [
    { d: "M58 60 C 58 49, 49 42, 40 42 C 31 42, 22 49, 22 60 C 22 71, 31 78, 40 78 C 49 78, 58 71, 58 60 Z", color: palette.cocoa },
    { d: "M56 60 L 104 60", color: palette.cocoa },
    { d: "M90 60 L 90 74", color: palette.tomato },
    { d: "M104 60 L 104 70", color: palette.tomato },
  ],
  box: [
    { d: "M18 36 L 60 18 L 102 36 L 102 88 L 60 106 L 18 88 Z", color: palette.cocoa },
    { d: "M18 36 L 60 54 L 102 36", color: palette.cocoa },
    { d: "M60 54 L 60 106", color: palette.cocoa },
    { d: "M42 74 L 56 88 L 80 62", color: palette.tomato },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const alpha = (hex: string, a: number): string => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a.toFixed(3)})`;
};

type Pt = { x: number; y: number };

/** One slightly bent pen segment from a to b (cubic, no sharp corners). */
const wobble = (seed: string, a: Pt, b: Pt, amp = 3): string => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const o1 = (random(`${seed}-1`) - 0.5) * 2 * amp;
  const o2 = (random(`${seed}-2`) - 0.5) * 2 * amp;
  const c1x = a.x + dx / 3 + nx * o1;
  const c1y = a.y + dy / 3 + ny * o1;
  const c2x = a.x + (2 * dx) / 3 + nx * o2;
  const c2y = a.y + (2 * dy) / 3 + ny * o2;
  return `C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
};

const lineD = (seed: string, a: Pt, b: Pt): string => `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} ${wobble(seed, a, b)}`;

const CARD_BORDER_D = (() => {
  const w = CARD.w;
  const h = CARD_H;
  const tl = { x: -4, y: -3 };
  const tr = { x: w + 4, y: -6 };
  const br = { x: w + 6, y: h + 3 };
  const bl = { x: -2, y: h + 5 };
  return `M ${tl.x} ${tl.y} ${wobble("card-top", tl, tr)} ${wobble("card-right", tr, br)} ${wobble("card-bottom", br, bl)} ${wobble("card-left", bl, tl)}`;
})();

const HEADER_LINE_D = lineD("card-head", { x: 0, y: CARD.headH }, { x: CARD.w, y: CARD.headH - 2 });

/** Draw progress for a pen-line entrance (ease in-out, no overshoot). */
const penProgress = (frame: number, start: number, dur: number): number =>
  interpolate(frame, [start, start + dur], [0, 1], { ...clamp01, easing: easeInOut });

/** Blur-to-sharp reveal with a small rise (Protection / What / Why). */
const reveal = (t: number, alphaMul = 1): React.CSSProperties => ({
  opacity: t * alphaMul,
  filter: t < 0.995 ? `blur(${((1 - t) * 6).toFixed(2)}px)` : undefined,
  transform: `translateY(${((1 - t) * 14).toFixed(2)}px)`,
});

const cellStyle = (left: number, width: number): React.CSSProperties => ({
  position: "absolute",
  top: 0,
  left,
  width,
  height: CARD.rowH,
  display: "flex",
  alignItems: "center",
});

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

const IconDraw: React.FC<{ kind: IconKind; at: number }> = ({ kind, at }) => {
  const frame = useCurrentFrame();
  return (
    <svg width={54} height={54} viewBox="0 0 120 120" fill="none" style={{ display: "block", overflow: "visible" }}>
      {ICONS[kind].map((s, j) => {
        const p = penProgress(frame, at + j * 6, 16);
        if (p <= 0) {
          return null;
        }
        return (
          <path
            key={j}
            d={s.d}
            stroke={s.color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            {...drawStroke(p)}
          />
        );
      })}
    </svg>
  );
};

const SecurityRow: React.FC<{ index: number; row: RowData }> = ({ index, row }) => {
  const frame = useCurrentFrame();
  const at = ROWS_AT[index];
  const end = index + 1 < ROWS_AT.length ? ROWS_AT[index + 1] : OUTRO_AT;

  // Active row: lifts from its start until the next row starts.
  const lift = penProgress(frame, at, 24);
  const release = interpolate(frame, [end, end + 24], [0, 1], { ...clamp01, easing: easeInOut });
  const active = lift * (1 - release);
  // Passed rows settle to 0.7 text opacity (never lower).
  const settle = interpolate(frame, [end, end + 30], [0, 1], { ...clamp01, easing: easeInOut });
  const dim = 1 - 0.3 * settle;

  const protectionIn = interpolate(frame, [at, at + 24], [0, 1], { ...clamp01, easing: easeOut });
  const whatIn = interpolate(frame, [at + 20, at + 44], [0, 1], { ...clamp01, easing: easeOut });
  const whyIn = interpolate(frame, [at + 52, at + 76], [0, 1], { ...clamp01, easing: easeOut });
  const underline = penProgress(frame, at + 64, 20);

  const divider = penProgress(frame, 96 + index * 4, 20);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: CARD.headH + index * CARD.rowH,
        width: CARD.w,
        height: CARD.rowH,
        transform: `translateY(${(-6 * active).toFixed(2)}px)`,
        background: active > 0.001 ? alpha(palette.butterDeep, 0.45 * active) : undefined,
        boxShadow:
          active > 0.001
            ? `0 ${(8 * active).toFixed(2)}px ${(18 * active).toFixed(2)}px rgba(70, 40, 20, ${(0.16 * active).toFixed(3)})`
            : undefined,
        borderRadius: 4,
      }}
    >
      {index < ROWS_AT.length - 1 ? (
        <svg style={{ position: "absolute", left: 0, top: CARD.rowH, width: 1, height: 1, overflow: "visible" }}>
          <path
            d={lineD(`row-${index}`, { x: 0, y: CARD.rowH }, { x: CARD.w, y: CARD.rowH + (random(`row-end-${index}`) - 0.5) * 4 })}
            stroke={palette.ink}
            strokeWidth={strokes.doodle}
            strokeLinecap="round"
            fill="none"
            pathLength={1}
            {...drawStroke(divider)}
          />
        </svg>
      ) : null}

      {/* Icon */}
      <div style={{ position: "absolute", left: 30, top: (CARD.rowH - 54) / 2 }}>
        <IconDraw kind={row.icon} at={at} />
      </div>

      {/* Protection */}
      <div style={{ ...cellStyle(COL1.left, COL1.width) }}>
        <div
          style={{
            fontFamily: fonts.ui,
            fontWeight: 600,
            fontSize: 28,
            lineHeight: 1.25,
            color: palette.ink,
            ...reveal(protectionIn),
          }}
        >
          {row.protection}
        </div>
      </div>

      {/* What it does */}
      <div style={{ ...cellStyle(COL2.left, COL2.width) }}>
        <div style={{ ...WHAT_STYLE, ...reveal(whatIn, dim) }}>{row.what}</div>
      </div>

      {/* Why it's good */}
      <div style={{ ...cellStyle(COL3.left, COL3.width) }}>
        <div
          style={{
            fontFamily: fonts.note,
            fontWeight: 500,
            fontSize: 34,
            lineHeight: 1.12,
            color: palette.ink,
            ...reveal(whyIn, dim),
          }}
        >
          {row.whyPre}
          <span style={{ position: "relative", display: "inline-block", whiteSpace: "nowrap" }}>
            {row.whyHi}
            <svg
              aria-hidden
              viewBox="0 0 100 14"
              preserveAspectRatio="none"
              fill="none"
              style={{ position: "absolute", left: 0, bottom: -9, width: "100%", height: 14, overflow: "visible" }}
            >
              {underline > 0 ? (
                <path
                  d="M 2 8 C 28 3, 58 12, 98 5"
                  stroke={palette.tomato}
                  strokeWidth={strokes.arrow}
                  strokeLinecap="round"
                  pathLength={1}
                  {...drawStroke(underline)}
                />
              ) : null}
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
};

const CardLines: React.FC = () => {
  const frame = useCurrentFrame();
  const border = penProgress(frame, 80, 28);
  const header = penProgress(frame, 88, 20);
  return (
    <svg style={{ position: "absolute", left: 0, top: 0, width: 1, height: 1, overflow: "visible" }}>
      <path
        d={CARD_BORDER_D}
        stroke={palette.ink}
        strokeWidth={strokes.doodle}
        strokeLinecap="round"
        fill="none"
        pathLength={1}
        {...drawStroke(border)}
      />
      <path
        d={HEADER_LINE_D}
        stroke={palette.ink}
        strokeWidth={strokes.doodle}
        strokeLinecap="round"
        fill="none"
        pathLength={1}
        {...drawStroke(header)}
      />
    </svg>
  );
};

const HeaderLabels: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [96, 120], [0, 1], { ...clamp01, easing: easeOut });
  const label: React.CSSProperties = {
    position: "absolute",
    top: 0,
    height: CARD.headH,
    display: "flex",
    alignItems: "center",
    fontFamily: fonts.note,
    fontWeight: 700,
    fontSize: 40,
    lineHeight: 1,
    color: palette.cocoa,
    opacity: t,
    filter: t < 0.995 ? `blur(${((1 - t) * 4).toFixed(2)}px)` : undefined,
  };
  return (
    <>
      <div style={{ ...label, left: COL1.left }}>Protection</div>
      <div style={{ ...label, left: COL2.left }}>What it does</div>
      <div style={{ ...label, left: COL3.left }}>Why it&apos;s good</div>
    </>
  );
};

const Heading: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: 60,
      height: 170,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      whiteSpace: "pre",
    }}
  >
    <PenText
      text="Built to be"
      at={SECURITY_CUES.heading}
      size={124}
      font={fonts.script}
      weight={700}
      lineHeight={1.1}
      style={{ marginRight: 30 }}
    />
    <PenText
      text="safe."
      at={SECURITY_CUES.heading + 32}
      durationFrames={20}
      size={124}
      font={fonts.emphasis}
      weight={400}
      color={palette.tomato}
      lineHeight={1.1}
    />
  </div>
);

/** Hand-drawn tomato ring around "Rust · Tauri", drawn from the outro cue. */
const RING_D = (() => {
  const cx = 160;
  const cy = 52;
  const rx = 138;
  const ry = 46;
  const steps = 56;
  const start = -0.3;
  const sweep = Math.PI * 2 + 0.5;
  const pts: Pt[] = [];
  for (let k = 0; k <= steps; k++) {
    const th = start + (sweep * k) / steps;
    const jr = 1 + (random(`ring-${k}`) - 0.5) * 0.025;
    pts.push({ x: cx + Math.cos(th) * rx * jr, y: cy + Math.sin(th) * ry * jr });
  }
  return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} ${pts
    .slice(1)
    .map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ")}`;
})();

const Footer: React.FC = () => {
  const frame = useCurrentFrame();
  const ring = penProgress(frame, OUTRO_AT, 30);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 1400,
          top: 958,
          width: 320,
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <PenText
          text="Rust · Tauri"
          at={520}
          durationFrames={30}
          size={46}
          font={fonts.note}
          weight={700}
          color={palette.cocoa}
          lineHeight={1}
        />
      </div>
      <svg
        width={320}
        height={104}
        viewBox="0 0 320 104"
        fill="none"
        style={{ position: "absolute", left: 1400, top: 940, overflow: "visible" }}
      >
        {ring > 0 ? (
          <path
            d={RING_D}
            stroke={palette.tomato}
            strokeWidth={strokes.doodle}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            {...drawStroke(ring)}
          />
        ) : null}
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

export const SecurityScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Slow camera: 1.0 -> 1.04 (and a small rise) over 80-480, back to 1.0 by 540.
  const up = interpolate(frame, [80, 480], [0, 1], { ...clamp01, easing: easeInOut });
  const back = interpolate(frame, [480, OUTRO_AT], [0, 1], { ...clamp01, easing: easeInOut });
  const k = up - back;

  // Paper card fades in as its border is drawn.
  const paper = interpolate(frame, [80, 100], [0, 1], { ...clamp01, easing: easeInOut });

  // Scene-out.
  const out = interpolate(frame, [FADE_AT, 599], [0, 1], { ...clamp01, easing: easeIn });

  return (
    <AbsoluteFill
      style={{
        opacity: 1 - out,
        filter: out > 0.005 ? `blur(${(out * 6).toFixed(2)}px)` : undefined,
      }}
    >
      <Heading />

      <AbsoluteFill
        style={{
          transformOrigin: "50% 50%",
          transform: `translateY(${(-10 * k).toFixed(2)}px) scale(${(1 + 0.04 * k).toFixed(4)})`,
        }}
      >
        <div style={{ position: "absolute", left: CARD.x, top: CARD.y, width: CARD.w, height: CARD_H }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: palette.butterLight,
              borderRadius: 4,
              boxShadow: shadows.card,
              opacity: paper,
            }}
          />
          <CardLines />
          <HeaderLabels />
          {ROW_DATA.map((row, i) => (
            <SecurityRow key={row.protection} index={i} row={row} />
          ))}
        </div>
      </AbsoluteFill>

      <Footer />
    </AbsoluteFill>
  );
};
