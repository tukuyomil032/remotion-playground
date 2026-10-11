import type React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts, radius } from "../theme";

export type ToastTone = "default" | "success" | "error" | "info";

const TONE: Record<ToastTone, string> = {
  default: colors.textMuted,
  success: colors.success,
  error: colors.danger,
  info: colors.info,
};

/**
 * Bottom-right toast (Sonner-style). Slides up at `showAt`, out at `hideAt`.
 * Pass `progress` (0..1) to render a download progress card with a bar.
 */
export const Toast: React.FC<{
  title: string;
  message?: string;
  tone?: ToastTone;
  showAt?: number;
  hideAt?: number;
  progress?: number;
  /** Stack index from the bottom (0 = lowest). */
  index?: number;
  /** Flat progress bar (solid success color, no gradient). */
  flat?: boolean;
  style?: React.CSSProperties;
}> = ({ title, message, tone = "default", showAt = 0, hideAt, progress, index = 0, flat = false, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - showAt, fps, config: { damping: 200 } });
  const exit =
    hideAt === undefined
      ? 0
      : interpolate(frame, [hideAt, hideAt + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const visible = enter * (1 - exit);
  if (frame < showAt || visible <= 0.001) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        right: 32,
        bottom: 32 + index * 96,
        width: 380,
        padding: "16px 18px",
        background: colors.panel,
        border: `1px solid ${colors.border}`,
        borderLeft: `3px solid ${TONE[tone]}`,
        borderRadius: radius.control + 4,
        boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
        fontFamily: fonts.ui,
        color: colors.text,
        opacity: visible,
        transform: `translateY(${(1 - enter) * 40 + exit * 20}px)`,
        ...style,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 600 }}>
        <span>{title}</span>
        {progress !== undefined ? (
          <span style={{ color: colors.textMuted, fontVariantNumeric: "tabular-nums" }}>
            {Math.round(progress * 100)}%
          </span>
        ) : null}
      </div>
      {message ? <div style={{ marginTop: 4, fontSize: 14, color: colors.textMuted }}>{message}</div> : null}
      {progress !== undefined ? (
        <div style={{ marginTop: 10, height: 6, borderRadius: 3, background: colors.border, overflow: "hidden" }}>
          <div
            style={{
              width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
              height: "100%",
              background: flat ? colors.success : `linear-gradient(90deg, ${colors.green}, ${colors.success})`,
            }}
          />
        </div>
      ) : null}
    </div>
  );
};
