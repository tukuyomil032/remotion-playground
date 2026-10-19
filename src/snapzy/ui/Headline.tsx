import type React from "react";
import { FONT_DISPLAY, FONT_TEXT, pt } from "../theme";

// A product-page headline: large SF Pro Display, tight tracking, a short
// subline. `show` 0..1 brings it in from a slight blur and offset; the scene
// passes a falling value to take it away the same way.

export const Headline: React.FC<{
  title: string;
  sub?: string;
  show: number;
  y?: number;
  size?: number;
  align?: "center" | "left";
  x?: number;
}> = ({ title, sub, show, y = 400, size = pt(72), align = "center", x = 0 }) => {
  if (show <= 0.002) {
    return null;
  }
  const s = Math.min(1, show);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        right: align === "center" ? 0 : undefined,
        top: y,
        textAlign: align,
        color: "white",
        opacity: s,
        filter: `blur(${(1 - s) * 14}px)`,
        transform: `translateY(${(1 - show) * pt(24)}px) scale(${0.97 + 0.03 * show})`,
        textShadow: "0 2px 30px rgba(0,0,40,0.25)",
      }}
    >
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: size, fontWeight: 600, letterSpacing: -size * 0.025, lineHeight: 1.05 }}>{title}</div>
      {sub ? (
        <div
          style={{
            fontFamily: FONT_TEXT,
            fontSize: size * 0.3,
            fontWeight: 500,
            letterSpacing: 0,
            marginTop: size * 0.28,
            color: "rgba(255,255,255,0.82)",
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
};
