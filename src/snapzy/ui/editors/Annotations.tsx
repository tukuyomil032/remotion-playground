import type { CSSProperties, FC, ReactNode } from "react";
import { FONT_DISPLAY } from "../../theme";

// Annotation overlay primitives. They are positioned in the coordinate space of
// their parent (the screenshot being edited), with x/y in px, so the scene
// author drops them next to the canvas content. Pure functions of props.

export const ANNOTATION_RED = "#ff3b30";

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

const Overlay: FC<{ children: ReactNode; style?: CSSProperties }> = ({ children, style }) => (
  <svg
    width={1}
    height={1}
    style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none", ...style }}
  >
    {children}
  </svg>
);

export const CurvedArrow: FC<{
  from: [number, number];
  to: [number, number];
  /** Sideways offset of the bezier control point, px (sign picks the side). */
  bend?: number;
  color?: string;
  width?: number;
  /** 0..1 draw-on progress; the arrowhead fades in after 0.9. */
  progress?: number;
}> = ({ from, to, bend = 80, color = ANNOTATION_RED, width = 6, progress = 1 }) => {
  const p = clamp01(progress);
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  const cx = (from[0] + to[0]) / 2 + (-dy / len) * bend;
  const cy = (from[1] + to[1]) / 2 + (dx / len) * bend;
  // The shaft stops short of the tip so the head sits on a clean end.
  const head = width * 4.2;
  const tx = to[0] - cx;
  const ty = to[1] - cy;
  const tl = Math.hypot(tx, ty) || 1;
  const ux = tx / tl;
  const uy = ty / tl;
  const bx = to[0] - ux * head * 0.8;
  const by = to[1] - uy * head * 0.8;
  const headOpacity = clamp01((p - 0.9) / 0.1);
  const half = head * 0.5;
  const px = -uy;
  const py = ux;
  const tri = `${to[0]},${to[1]} ${bx + px * half},${by + py * half} ${bx - px * half},${by - py * half}`;
  return (
    <Overlay>
      <path
        d={`M ${from[0]} ${from[1]} Q ${cx} ${cy} ${bx} ${by}`}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - p}
      />
      <polygon points={tri} fill={color} stroke={color} strokeWidth={width * 0.3} strokeLinejoin="round" opacity={headOpacity} />
    </Overlay>
  );
};

export const MarkRect: FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
  width?: number;
  radius?: number;
  progress?: number;
}> = ({ x, y, w, h, color = ANNOTATION_RED, width = 5, radius = 8, progress = 1 }) => (
  <Overlay>
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={radius}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - clamp01(progress)}
    />
  </Overlay>
);

/** Numbered marker: (x, y) is the center of the circle. */
export const Counter: FC<{ x: number; y: number; n: number; color?: string; scale?: number; size?: number }> = ({
  x,
  y,
  n,
  color = ANNOTATION_RED,
  scale = 1,
  size = 44,
}) => (
  <div
    style={{
      position: "absolute",
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
      borderRadius: size,
      background: color,
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: FONT_DISPLAY,
      fontWeight: 700,
      fontSize: size * 0.56,
      boxShadow: "0 2px 6px rgba(0,0,0,0.35), inset 0 0 0 2px rgba(255,255,255,0.25)",
      transform: `scale(${scale})`,
      opacity: scale <= 0 ? 0 : 1,
    }}
  >
    {n}
  </div>
);

/** Redaction: blurs and pixelates whatever is behind it. */
export const BlurBox: FC<{ x: number; y: number; w: number; h: number; amount?: number }> = ({
  x,
  y,
  w,
  h,
  amount = 12,
}) => {
  const cell = Math.max(8, Math.round(amount));
  const cols = Math.ceil(w / cell);
  const rows = Math.ceil(h / cell);
  // Deterministic mosaic: each cell gets a grey of varying strength.
  const hash = (i: number): number => {
    const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    return s - Math.floor(s);
  };
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: 4,
        overflow: "hidden",
        backdropFilter: `blur(${amount}px) saturate(0.9)`,
        WebkitBackdropFilter: `blur(${amount}px) saturate(0.9)`,
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${cell}px)`,
        gridAutoRows: `${cell}px`,
      }}
    >
      {Array.from({ length: cols * rows }, (_, i) => (
        <div key={i} style={{ background: `rgba(90,94,108,${0.12 + hash(i) * 0.5})` }} />
      ))}
    </div>
  );
};

/** Free text: (x, y) is the top-left of the text. */
export const TextLabel: FC<{ x: number; y: number; text: string; color?: string; size?: number }> = ({
  x,
  y,
  text,
  color = ANNOTATION_RED,
  size = 56,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      color,
      fontFamily: FONT_DISPLAY,
      fontWeight: 500,
      fontSize: size,
      lineHeight: 1.1,
      whiteSpace: "pre",
      textShadow: "0 1px 4px rgba(0,0,0,0.25)",
    }}
  >
    {text}
  </div>
);
