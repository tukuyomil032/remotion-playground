import type React from "react";
import { Img, staticFile } from "remotion";
import { Glass } from "../glass/Glass";
import { pt } from "../theme";

// A glass Dock with abstract app tiles (soft gradients, no third-party logos)
// and the real Snapzy icon. `lift` slides it down out of view (0 = shown).

const TILES: readonly [string, string][] = [
  ["#4fa8ff", "#1765f0"],
  ["#ffffff", "#d9dde6"],
  ["#ff6a5a", "#e8304a"],
  ["#ffd166", "#f59e0b"],
  ["#5ee0a0", "#14a36a"],
  ["#a78bfa", "#6d43e8"],
  ["snapzy", ""],
  ["#3a3f4b", "#1d2028"],
  ["#ff9f6b", "#f2602b"],
  ["#7dd3fc", "#2c8fd6"],
];

const SIZE = pt(50);
const GAP = pt(7);

export const DOCK_W = TILES.length * SIZE + (TILES.length - 1) * GAP + pt(14) * 2 + pt(16);
export const DOCK_H = SIZE + pt(16);

export const Dock: React.FC<{ hide?: number }> = ({ hide = 0 }) => {
  const top = 1080 - DOCK_H - pt(6) + hide * (DOCK_H + pt(20));
  return (
    <Glass
      width={DOCK_W}
      height={DOCK_H}
      radius={pt(24)}
      refraction={22}
      bevel={18}
      tint={0.1}
      style={{ left: (1920 - DOCK_W) / 2, top }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: GAP, padding: `${pt(8)}px ${pt(14)}px`, height: "100%", boxSizing: "border-box" }}>
        {TILES.map(([a, b], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: GAP }}>
            {i === 7 ? <div style={{ width: 1, height: SIZE * 0.8, background: "rgba(255,255,255,0.3)", marginRight: pt(2) }} /> : null}
            {a === "snapzy" ? (
              <Img src={staticFile("snapzy/icon.png")} style={{ width: SIZE, height: SIZE }} />
            ) : (
              <div
                style={{
                  width: SIZE,
                  height: SIZE,
                  borderRadius: SIZE * 0.24,
                  background: `linear-gradient(160deg, ${a}, ${b})`,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45), 0 2px 6px rgba(0,0,30,0.25)",
                }}
              />
            )}
          </div>
        ))}
      </div>
    </Glass>
  );
};
