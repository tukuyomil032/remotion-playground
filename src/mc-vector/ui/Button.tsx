import type React from "react";
import { colors, fonts, radius } from "../theme";

export type ButtonVariant = "primary" | "secondary" | "success" | "danger" | "ghost" | "dashed";

const VARIANTS: Record<ButtonVariant, React.CSSProperties> = {
  primary: { background: "#ffffff", color: "#09090b", border: "1px solid #ffffff" },
  secondary: { background: colors.panel, color: colors.text, border: `1px solid ${colors.borderStrong}` },
  success: { background: colors.success, color: "#ffffff", border: `1px solid ${colors.success}` },
  danger: { background: colors.danger, color: "#ffffff", border: `1px solid ${colors.danger}` },
  ghost: { background: "transparent", color: colors.textMuted, border: "1px solid transparent" },
  dashed: { background: "transparent", color: colors.textMuted, border: `1px dashed ${colors.borderStrong}` },
};

export const Button: React.FC<{
  children: React.ReactNode;
  variant?: ButtonVariant;
  /** 0..1 — visual press amount (scales down slightly). */
  pressed?: number;
  /** 0..1 — hover highlight amount. */
  hover?: number;
  disabled?: boolean;
  icon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  style?: React.CSSProperties;
}> = ({ children, variant = "secondary", pressed = 0, hover = 0, disabled = false, icon, size = "md", style }) => {
  const pad = size === "sm" ? "6px 12px" : size === "lg" ? "14px 26px" : "9px 18px";
  const fontSize = size === "sm" ? 14 : size === "lg" ? 20 : 16;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: pad,
        fontSize,
        fontWeight: 600,
        fontFamily: fonts.ui,
        borderRadius: radius.control,
        whiteSpace: "nowrap",
        transform: `scale(${1 - pressed * 0.05})`,
        filter: `brightness(${1 + hover * 0.15})`,
        opacity: disabled ? 0.4 : 1,
        ...VARIANTS[variant],
        ...style,
      }}
    >
      {icon}
      {children}
    </div>
  );
};
