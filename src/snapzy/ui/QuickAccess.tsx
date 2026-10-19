import type React from "react";
import { Glass } from "../glass/Glass";
import { FONT_TEXT, pt } from "../theme";

// The Quick Access card that appears after each capture: a floating glass card
// in the bottom-right corner with the capture's thumbnail. On hover it shows
// Copy / Save and the corner buttons (delete, close, edit), as in the app.

export const QA_W = pt(200);
export const QA_H = pt(128);
export const QA_RIGHT = pt(22);
export const QA_BOTTOM = pt(96);

/** Screen top-left of the card at `slot` (0 = newest, at the bottom). */
export const qaSlot = (slot: number): { x: number; y: number } => ({
  x: 1920 - QA_RIGHT - QA_W,
  y: 1080 - QA_BOTTOM - QA_H - slot * (QA_H + pt(12)),
});

const Pill: React.FC<{ label: string; pressed?: boolean }> = ({ label, pressed = false }) => (
  <div
    style={{
      padding: `${pt(4)}px ${pt(14)}px`,
      borderRadius: pt(20),
      background: pressed ? "rgba(255,255,255,0.75)" : "rgba(20,20,28,0.78)",
      color: pressed ? "#111" : "white",
      fontFamily: FONT_TEXT,
      fontSize: pt(12),
      fontWeight: 600,
      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    }}
  >
    {label}
  </div>
);

const RoundIcon: React.FC<{ d: string; style: React.CSSProperties }> = ({ d, style }) => (
  <div
    style={{
      position: "absolute",
      width: pt(20),
      height: pt(20),
      borderRadius: pt(10),
      background: "rgba(20,20,28,0.8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      ...style,
    }}
  >
    <svg width={pt(10)} height={pt(10)} viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth={1.5} strokeLinecap="round">
      <path d={d} />
    </svg>
  </div>
);

export const QuickAccessCard: React.FC<{
  x: number;
  y: number;
  /** 0..1 spring: slides in from the right edge. */
  show: number;
  hover?: number;
  pressed?: "copy" | "save" | null;
  scale?: number;
  children: React.ReactNode;
}> = ({ x, y, show, hover = 0, pressed = null, scale = 1, children }) => {
  if (show <= 0.002) {
    return null;
  }
  const dx = (1 - show) * (QA_W + QA_RIGHT + pt(20));
  return (
    <Glass
      width={QA_W}
      height={QA_H}
      radius={pt(16)}
      refraction={16}
      bevel={14}
      tint={0.1}
      shade={0.25}
      style={{ left: x + dx, top: y, transform: `scale(${scale})`, transformOrigin: "100% 100%" }}
    >
      <div style={{ position: "absolute", inset: pt(7), borderRadius: pt(10), overflow: "hidden", background: "#f4f4f6" }}>
        {children}
      </div>
      {hover > 0.01 ? (
        <div style={{ position: "absolute", inset: 0, opacity: hover }}>
          <div style={{ position: "absolute", inset: pt(7), borderRadius: pt(10), background: "rgba(0,0,10,0.35)", backdropFilter: "blur(3px)" }} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: pt(7),
            }}
          >
            <Pill label="Copy" pressed={pressed === "copy"} />
            <Pill label="Save" pressed={pressed === "save"} />
          </div>
          <RoundIcon d="M2 3h6M4 3V2h2v1M3 3l.4 5h3.2L7 3" style={{ left: pt(4), top: pt(4) }} />
          <RoundIcon d="M2.5 2.5l5 5M7.5 2.5l-5 5" style={{ right: pt(4), top: pt(4) }} />
          <RoundIcon d="M2 8l1-3 4-4 2 2-4 4Z" style={{ left: pt(4), bottom: pt(4) }} />
        </div>
      ) : null}
    </Glass>
  );
};
