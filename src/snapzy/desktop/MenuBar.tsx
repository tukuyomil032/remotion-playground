import type React from "react";
import { FONT_TEXT, pt } from "../theme";
import { SnapzyGlyph } from "../ui/SnapzyGlyph";

// The macOS menu bar: transparent over the wallpaper (as on macOS 26), white
// text. No Apple logo. The Snapzy status item sits among a few generic ones;
// `snapzyActive` draws its pressed (highlighted) capsule.

export const MENU_BAR_H = pt(24);

/** Screen x of the Snapzy status item's center (menus open under it). */
export const SNAPZY_ITEM_X = 1920 - pt(236);

const Wifi: React.FC = () => (
  <svg width={pt(17)} height={pt(13)} viewBox="0 0 17 13" fill="none" stroke="white" strokeWidth={1.7} strokeLinecap="round">
    <path d="M1.5 4.5a10 10 0 0 1 14 0" />
    <path d="M4 7.2a6.3 6.3 0 0 1 9 0" />
    <path d="M6.5 9.8a2.8 2.8 0 0 1 4 0" />
  </svg>
);

const Battery: React.FC = () => (
  <svg width={pt(26)} height={pt(12)} viewBox="0 0 26 12" fill="none">
    <rect x={0.75} y={0.75} width={22} height={10.5} rx={3.2} stroke="white" strokeOpacity={0.55} strokeWidth={1.3} />
    <rect x={2.4} y={2.4} width={16} height={7.2} rx={1.8} fill="white" />
    <path d="M24.5 4v4" stroke="white" strokeOpacity={0.55} strokeWidth={1.6} strokeLinecap="round" />
  </svg>
);

const ControlCenter: React.FC = () => (
  <svg width={pt(16)} height={pt(13)} viewBox="0 0 16 13" fill="none" stroke="white" strokeWidth={1.5}>
    <rect x={1} y={1} width={14} height={4.4} rx={2.2} />
    <rect x={1} y={7.6} width={14} height={4.4} rx={2.2} />
    <circle cx={4.6} cy={3.2} r={1.1} fill="white" />
    <circle cx={11.4} cy={9.8} r={1.1} fill="white" />
  </svg>
);

const Search: React.FC = () => (
  <svg width={pt(14)} height={pt(14)} viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth={1.7} strokeLinecap="round">
    <circle cx={6} cy={6} r={4.4} />
    <path d="M9.4 9.4 13 13" />
  </svg>
);

export const MenuBar: React.FC<{ app?: string; menus?: readonly string[]; snapzyActive?: number }> = ({
  app = "Finder",
  menus = ["File", "Edit", "View", "Go", "Window", "Help"],
  snapzyActive = 0,
}) => {
  const text: React.CSSProperties = {
    fontFamily: FONT_TEXT,
    fontSize: pt(13),
    color: "white",
    textShadow: "0 1px 6px rgba(0,0,20,0.25)",
    letterSpacing: 0.1,
  };
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 1920,
        height: MENU_BAR_H,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `0 ${pt(14)}px 0 ${pt(20)}px`,
        boxSizing: "border-box",
        background: "linear-gradient(180deg, rgba(0,0,30,0.18), rgba(0,0,30,0))",
      }}
    >
      <div style={{ display: "flex", gap: pt(19), alignItems: "center", ...text }}>
        <span style={{ fontWeight: 700 }}>{app}</span>
        {menus.map((m) => (
          <span key={m} style={{ fontWeight: 500 }}>
            {m}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: pt(16), alignItems: "center", ...text }}>
        <div
          style={{
            position: "relative",
            width: pt(30),
            height: pt(20),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: pt(10),
              background: `rgba(255,255,255,${0.28 * snapzyActive})`,
            }}
          />
          <SnapzyGlyph size={pt(15)} color="white" />
        </div>
        <ControlCenter />
        <Wifi />
        <Battery />
        <Search />
        <span style={{ fontWeight: 500 }}>Mon Oct 19</span>
        <span style={{ fontWeight: 500, marginLeft: -pt(8) }}>9:41 AM</span>
      </div>
    </div>
  );
};
