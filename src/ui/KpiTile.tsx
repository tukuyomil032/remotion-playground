import type React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts, radius } from "../theme";

/** Dashboard KPI card. Pops in at `enterAt` (scene-local frame). */
export const KpiTile: React.FC<{
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  icon?: React.ReactNode;
  enterAt?: number;
  /** Critically damped entrance (no overshoot). */
  calm?: boolean;
  style?: React.CSSProperties;
}> = ({ label, value, sub, accent = colors.text, icon, enterAt = 0, calm = false, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - enterAt, fps, config: calm ? { damping: 200 } : { damping: 18, stiffness: 160 } });

  return (
    <div
      style={{
        flex: 1,
        padding: "20px 22px",
        background: colors.panel,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.card,
        fontFamily: fonts.ui,
        color: colors.text,
        opacity: Math.min(1, p * 1.5),
        transform: `translateY(${(1 - p) * 24}px) scale(${0.94 + 0.06 * p})`,
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, color: colors.textMuted, fontWeight: 500 }}>
        {icon}
        {label}
      </div>
      <div style={{ marginTop: 8, fontSize: 36, fontWeight: 700, color: accent, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      {sub ? <div style={{ marginTop: 4, fontSize: 14, color: colors.textFaint }}>{sub}</div> : null}
    </div>
  );
};
