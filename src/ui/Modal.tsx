import type React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { colors, fonts, radius } from "../theme";

// MC-Vector's modal curve: cubic-bezier(0.16, 1, 0.3, 1).
const modalEase = Easing.bezier(0.16, 1, 0.3, 1);

/**
 * Centered modal with backdrop. Opens at `openAt` (scene-local frame) and
 * optionally closes at `closeAt`. Backdrop fades in ~11 frames (180 ms),
 * panel scales/lifts in 12 frames (200 ms).
 */
export const Modal: React.FC<{
  title?: string;
  children: React.ReactNode;
  openAt?: number;
  closeAt?: number;
  width?: number;
  footer?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ title, children, openAt = 0, closeAt, width = 640, footer, style }) => {
  const frame = useCurrentFrame();
  const opening = interpolate(frame, [openAt, openAt + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: modalEase,
  });
  const closing =
    closeAt === undefined
      ? 1
      : interpolate(frame, [closeAt, closeAt + 10], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: modalEase,
        });
  const p = Math.min(opening, closing);
  const backdrop = interpolate(frame, [openAt, openAt + 11], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }) * closing;

  if (p <= 0 && backdrop <= 0) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `rgba(0,0,0,${0.55 * backdrop})`,
      }}
    >
      <div
        style={{
          width,
          background: colors.panel,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.card,
          boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
          fontFamily: fonts.ui,
          color: colors.text,
          opacity: p,
          transform: `translateY(${(1 - p) * 12}px) scale(${0.96 + 0.04 * p})`,
          overflow: "hidden",
          ...style,
        }}
      >
        {title ? (
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${colors.border}`, fontSize: 22, fontWeight: 700 }}>
            {title}
          </div>
        ) : null}
        <div style={{ padding: 24 }}>{children}</div>
        {footer ? (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              padding: "16px 24px",
              borderTop: `1px solid ${colors.border}`,
            }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
};
