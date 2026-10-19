import type React from "react";
import { FONT_TEXT, pt } from "../theme";

// A generic light-appearance macOS window: rounded corners, traffic lights,
// a title, and a body. Used for the made-up apps that get captured (Notes,
// Finder). `highlight` tints it blue (Application Capture hover);
// `dim` greys out the traffic lights (inactive window).

export const TrafficLights: React.FC<{ dim?: boolean; size?: number }> = ({ dim = false, size = pt(12) }) => (
  <div style={{ display: "flex", gap: size * 0.66 }}>
    {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
      <div
        key={c}
        style={{
          width: size,
          height: size,
          borderRadius: size,
          background: dim ? "#d9d9de" : c,
          boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.15)",
        }}
      />
    ))}
  </div>
);

export type MacWindowProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  dim?: boolean;
  highlight?: number;
  /** 0..1 lifts the window with a stronger shadow (active / captured). */
  lift?: number;
  sidebar?: React.ReactNode;
  sidebarWidth?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
};

export const MacWindow: React.FC<MacWindowProps> = ({
  x,
  y,
  width,
  height,
  title,
  dim = false,
  highlight = 0,
  lift = 0,
  sidebar,
  sidebarWidth = pt(170),
  children,
  style,
}) => {
  const titleH = pt(44);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        borderRadius: pt(16),
        background: "#ffffff",
        overflow: "hidden",
        fontFamily: FONT_TEXT,
        color: "#1d1d1f",
        boxShadow: `0 0 0 0.5px rgba(0,0,0,0.2), 0 ${pt(10 + 14 * lift)}px ${pt(40 + 30 * lift)}px rgba(0,0,40,${0.3 + 0.2 * lift})`,
        ...style,
      }}
    >
      {sidebar ? (
        <div
          style={{
            position: "absolute",
            left: pt(8),
            top: pt(8),
            bottom: pt(8),
            width: sidebarWidth,
            borderRadius: pt(12),
            background: "#f2f2f5",
            boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.06)",
            paddingTop: titleH,
            boxSizing: "border-box",
          }}
        >
          {sidebar}
        </div>
      ) : null}
      <div style={{ position: "absolute", left: pt(20), top: pt(19) }}>
        <TrafficLights dim={dim} />
      </div>
      {title ? (
        <div
          style={{
            position: "absolute",
            left: sidebar ? sidebarWidth + pt(24) : 0,
            right: 0,
            top: pt(13),
            textAlign: sidebar ? "left" : "center",
            fontSize: pt(14),
            fontWeight: 600,
            color: dim ? "#9a9aa0" : "#1d1d1f",
          }}
        >
          {title}
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: sidebar ? sidebarWidth + pt(8) : 0,
          right: 0,
          top: titleH,
          bottom: 0,
        }}
      >
        {children}
      </div>
      {highlight > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: pt(16),
            background: `rgba(30,120,255,${0.22 * highlight})`,
            boxShadow: `inset 0 0 0 ${pt(3)}px rgba(30,120,255,${0.9 * highlight})`,
          }}
        />
      ) : null}
    </div>
  );
};
