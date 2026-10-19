import type React from "react";
import { Glass } from "../glass/Glass";
import { FONT_TEXT, pt } from "../theme";

// A keyboard shortcut shown as glass key caps near the bottom of the screen.
// `show` 0..1 (spring) fades and lifts it; `press` 0..1 pushes the caps down.

const CAP = pt(46);

export const KeyCaps: React.FC<{ keys: readonly string[]; show: number; press?: number; label?: string; y?: number }> = ({
  keys,
  show,
  press = 0,
  label,
  y = 1080 - pt(150),
}) => {
  if (show <= 0.001) {
    return null;
  }
  const gap = pt(10);
  const width = keys.length * CAP + (keys.length - 1) * gap + pt(24) + (label ? pt(14) + label.length * pt(8.2) : 0);
  const height = CAP + pt(24);
  return (
    <Glass
      width={width}
      height={height}
      radius={height / 2}
      refraction={18}
      bevel={16}
      tint={0.12}
      shade={0.12}
      style={{
        left: (1920 - width) / 2,
        top: y + (1 - show) * pt(20),
        opacity: Math.min(1, show),
        transform: `scale(${0.9 + 0.1 * show})`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap, height: "100%", padding: `0 ${pt(12)}px`, boxSizing: "border-box" }}>
        {keys.map((k) => (
          <div
            key={k}
            style={{
              width: CAP,
              height: CAP,
              borderRadius: pt(11),
              background: "rgba(255,255,255,0.16)",
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.4), 0 ${pt(3) * (1 - press)}px 0 rgba(0,0,20,0.35)`,
              transform: `translateY(${pt(3) * press}px)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONT_TEXT,
              fontSize: pt(22),
              fontWeight: 500,
              color: "white",
            }}
          >
            {k}
          </div>
        ))}
        {label ? (
          <div style={{ fontFamily: FONT_TEXT, fontSize: pt(15), fontWeight: 500, color: "white", marginLeft: pt(4), whiteSpace: "nowrap" }}>
            {label}
          </div>
        ) : null}
      </div>
    </Glass>
  );
};
