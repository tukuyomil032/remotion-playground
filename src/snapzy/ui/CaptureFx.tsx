import type React from "react";
import { Glass } from "../glass/Glass";
import { FONT_DISPLAY, FONT_TEXT, pt } from "../theme";
import type { Rect } from "../content/Desk";

// Pieces of the capture moment: the dimmed screen with a clear selection, the
// size badge, the shutter flash, the countdown drop, and a capture flying into
// its Quick Access slot.

/** Dims everything except `hole` (if given). */
export const Dim: React.FC<{ amount: number; hole?: Rect | null; outline?: boolean }> = ({ amount, hole = null, outline = true }) => {
  if (amount <= 0.002) {
    return null;
  }
  if (!hole) {
    return <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,12,${0.38 * amount})` }} />;
  }
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: hole.x,
          top: hole.y,
          width: hole.w,
          height: hole.h,
          boxShadow: `0 0 0 4000px rgba(0,0,12,${0.38 * amount})`,
          outline: outline ? `${pt(1.2)}px solid rgba(255,255,255,${0.95 * amount})` : undefined,
        }}
      />
    </div>
  );
};

export const SizeBadge: React.FC<{ rect: Rect; opacity?: number }> = ({ rect, opacity = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: rect.x + rect.w - pt(96),
      top: rect.y + rect.h + pt(8),
      padding: `${pt(3)}px ${pt(8)}px`,
      borderRadius: pt(6),
      background: "rgba(20,20,26,0.85)",
      color: "white",
      fontFamily: FONT_TEXT,
      fontSize: pt(12),
      fontWeight: 600,
      opacity,
      whiteSpace: "nowrap",
      fontVariantNumeric: "tabular-nums",
    }}
  >
    {Math.round((rect.w * 3) / 4)} × {Math.round((rect.h * 3) / 4)}
  </div>
);

/** White flash over a rect: `t` frames since the shutter. */
export const Flash: React.FC<{ t: number; rect: Rect }> = ({ t, rect }) => {
  if (t < 0 || t > 16) {
    return null;
  }
  const o = t < 3 ? t / 3 : 1 - (t - 3) / 13;
  return (
    <div
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        background: "white",
        opacity: 0.75 * o,
        borderRadius: pt(4),
      }}
    />
  );
};

/** A big glass drop with a countdown number. */
export const CountDrop: React.FC<{ n: number; show: number }> = ({ n, show }) => {
  if (show <= 0.002) {
    return null;
  }
  const size = pt(190);
  return (
    <Glass
      width={size}
      height={size}
      radius={size / 2}
      refraction={44}
      bevel={40}
      tint={0.08}
      shade={0.18}
      style={{ left: 960 - size / 2, top: 500 - size / 2, transform: `scale(${0.6 + 0.4 * show})`, opacity: Math.min(1, show * 1.4) }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT_DISPLAY,
          fontSize: pt(110),
          fontWeight: 600,
          color: "white",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {n}
      </div>
    </Glass>
  );
};

/** A capture moving from where it was taken (`from`) to a card slot (`to`). */
export const FlyingShot: React.FC<{ from: Rect; to: Rect; t: number; children: (w: number, h: number) => React.ReactNode }> = ({
  from,
  to,
  t,
  children,
}) => {
  if (t <= 0 || t >= 1) {
    return null;
  }
  const x = from.x + (to.x - from.x) * t;
  const y = from.y + (to.y - from.y) * t;
  const w = from.w + (to.w - from.w) * t;
  const h = from.h + (to.h - from.h) * t;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: pt(6 + 6 * t),
        overflow: "hidden",
        boxShadow: `0 ${pt(12)}px ${pt(36)}px rgba(0,0,30,0.45)`,
        transform: `rotate(${Math.sin(t * Math.PI) * -2}deg)`,
      }}
    >
      {children(w, h)}
    </div>
  );
};
