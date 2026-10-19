import type React from "react";
import { colors, fonts, radius } from "../theme";

// Static Dashboard content shown inside the app window before the cursor
// clicks a sidebar item (op3, op4, op5). Flat, no animation: it only has to
// look like the view the previous scene ended on. All numbers are fictional.

const TILES: readonly { label: string; value: string; sub: string; accent: string }[] = [
  { label: "Status", value: "Online", sub: "Paper 1.21.10", accent: colors.success },
  { label: "Current TPS", value: "20.0", sub: "Healthy", accent: colors.success },
  { label: "CPU", value: "14%", sub: "of 4 cores", accent: colors.text },
  { label: "Memory", value: "2,140 MB", sub: "of 4,096 MB", accent: colors.text },
];

const LINE = "M0 90 L60 84 L120 92 L180 70 L240 78 L300 62 L360 74 L420 58 L480 66 L540 52 L600 60 L660 48 L720 56 L780 44";

export const DashboardStub: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      padding: 24,
      display: "flex",
      flexDirection: "column",
      gap: 20,
      fontFamily: fonts.ui,
      color: colors.text,
    }}
  >
    <div style={{ display: "flex", gap: 16 }}>
      {TILES.map((t) => (
        <div
          key={t.label}
          style={{
            flex: 1,
            padding: "20px 22px",
            background: colors.window,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.card,
          }}
        >
          <div style={{ fontSize: 15, color: colors.textMuted, fontWeight: 500 }}>{t.label}</div>
          <div style={{ marginTop: 8, fontSize: 34, fontWeight: 700, color: t.accent, fontVariantNumeric: "tabular-nums" }}>
            {t.value}
          </div>
          <div style={{ marginTop: 4, fontSize: 14, color: colors.textFaint }}>{t.sub}</div>
        </div>
      ))}
    </div>
    <div style={{ display: "flex", gap: 16, flex: 1 }}>
      {["CPU", "Memory", "TPS"].map((title, i) => (
        <div
          key={title}
          style={{
            flex: 1,
            padding: "18px 20px",
            background: colors.window,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.card,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, color: colors.textSecondary }}>{title}</div>
          <svg width="100%" height={180} viewBox="0 0 780 120" preserveAspectRatio="none" style={{ marginTop: 24 }}>
            <path
              d={LINE}
              transform={`translate(0 ${i * 6})`}
              fill="none"
              stroke={i === 2 ? colors.green : colors.borderStrong}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      ))}
    </div>
  </div>
);
