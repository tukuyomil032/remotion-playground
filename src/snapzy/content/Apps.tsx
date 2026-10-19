import type React from "react";
import { pt } from "../theme";
import { MacWindow, type MacWindowProps } from "./MacWindow";

// Made-up app windows that get captured in the video. Everything here is
// invented content: no real people, files or conversations.

type Placed = Omit<MacWindowProps, "children" | "sidebar" | "title">;

const SideItem: React.FC<{ label: string; active?: boolean; icon: string }> = ({ label, active = false, icon }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: pt(8),
      margin: `0 ${pt(8)}px`,
      padding: `${pt(5)}px ${pt(8)}px`,
      borderRadius: pt(7),
      background: active ? "rgba(0,0,0,0.08)" : "transparent",
      fontSize: pt(13),
      color: "#1d1d1f",
    }}
  >
    <span style={{ width: pt(14), height: pt(14), borderRadius: pt(3.5), background: icon, display: "inline-block" }} />
    {label}
  </div>
);

export const NOTE_TITLE = "Weekend in Kyoto";
export const NOTE_LINES = [
  "Day 1: Fushimi Inari at sunrise, breakfast nearby.",
  "Day 2: Arashiyama bamboo grove, bikes by the river.",
  "Book the ryokan by Friday. Contact: mia@example.com",
  "Pack: camera, charger, rain jacket.",
] as const;

/** Body text geometry (from the window's top-left), so scenes can select and read exact lines. */
export const NOTE_BODY = { left: pt(36), top: pt(128), lineH: pt(30), fontSize: pt(15) } as const;

export const NotesWindow: React.FC<Placed & { lineHighlight?: readonly number[] }> = ({ lineHighlight = [], ...w }) => (
  <MacWindow
    {...w}
    sidebarWidth={pt(150)}
    sidebar={
      <div style={{ display: "flex", flexDirection: "column", gap: pt(2) }}>
        <div style={{ fontSize: pt(11), fontWeight: 600, color: "#8e8e93", margin: `${pt(4)}px ${pt(16)}px` }}>iCloud</div>
        <SideItem label="All iCloud" icon="#f5c542" />
        <SideItem label="Notes" icon="#f5c542" />
        <SideItem label="Travel" icon="#f5c542" active />
        <SideItem label="Recipes" icon="#f5c542" />
      </div>
    }
  >
    <div style={{ position: "absolute", left: 0, right: 0, top: pt(4), textAlign: "center", fontSize: pt(11.5), color: "#8e8e93" }}>
      October 18, 2026 at 9:12 PM
    </div>
    <div
      style={{
        position: "absolute",
        left: NOTE_BODY.left,
        top: pt(34),
        fontSize: pt(24),
        fontWeight: 700,
        letterSpacing: -0.3,
      }}
    >
      {NOTE_TITLE}
    </div>
    {NOTE_LINES.map((line, i) => (
      <div
        key={line}
        style={{
          position: "absolute",
          left: NOTE_BODY.left,
          top: NOTE_BODY.top - pt(44) + i * NOTE_BODY.lineH,
          fontSize: NOTE_BODY.fontSize,
          color: "#2c2c2e",
          whiteSpace: "nowrap",
          background: lineHighlight.includes(i) ? "rgba(30,120,255,0.18)" : "transparent",
          borderRadius: pt(3),
        }}
      >
        {line}
      </div>
    ))}
  </MacWindow>
);

const FILES: readonly [string, string, string, string][] = [
  ["folder", "Design Systems", "Today, 1:52 PM", "--"],
  ["folder", "Snapzy Captures", "Today, 10:14 AM", "--"],
  ["doc", "Product Roadmap.key", "Yesterday", "12.4 MB"],
  ["doc", "config.toml", "Oct 18, 2026", "4 KB"],
  ["doc", "Release_Notes.md", "Oct 15, 2026", "18 KB"],
  ["doc", "Moodboard.png", "Oct 12, 2026", "2.1 MB"],
];

export const FinderWindow: React.FC<Placed> = (w) => (
  <MacWindow
    {...w}
    title="Desktop"
    sidebarWidth={pt(150)}
    sidebar={
      <div style={{ display: "flex", flexDirection: "column", gap: pt(2) }}>
        <div style={{ fontSize: pt(11), fontWeight: 600, color: "#8e8e93", margin: `${pt(4)}px ${pt(16)}px` }}>Favorites</div>
        <SideItem label="Applications" icon="#4f8cff" />
        <SideItem label="Desktop" icon="#4f8cff" active />
        <SideItem label="Documents" icon="#4f8cff" />
        <SideItem label="Downloads" icon="#4f8cff" />
      </div>
    }
  >
    <div style={{ padding: `${pt(4)}px ${pt(16)}px`, fontSize: pt(12.5) }}>
      <div style={{ display: "flex", color: "#8e8e93", fontSize: pt(11.5), padding: `${pt(4)}px 0`, borderBottom: "1px solid #ececf0" }}>
        <span style={{ flex: 1 }}>Name</span>
        <span style={{ width: pt(120) }}>Date Modified</span>
        <span style={{ width: pt(60), textAlign: "right" }}>Size</span>
      </div>
      {FILES.map(([kind, name, date, size], i) => (
        <div
          key={name}
          style={{
            display: "flex",
            alignItems: "center",
            padding: `${pt(5)}px ${pt(4)}px`,
            borderRadius: pt(5),
            background: i % 2 === 1 ? "#f6f6f8" : "transparent",
          }}
        >
          <span style={{ flex: 1, display: "flex", alignItems: "center", gap: pt(8) }}>
            <span
              style={{
                width: pt(15),
                height: kind === "folder" ? pt(12) : pt(15),
                borderRadius: pt(2.5),
                background: kind === "folder" ? "#5aa9ff" : "#e4e4ea",
                boxShadow: kind === "folder" ? "none" : "inset 0 0 0 1px #d0d0d6",
              }}
            />
            {name}
          </span>
          <span style={{ width: pt(120), color: "#6e6e73" }}>{date}</span>
          <span style={{ width: pt(60), textAlign: "right", color: "#6e6e73" }}>{size}</span>
        </div>
      ))}
    </div>
  </MacWindow>
);

/** A small bar chart window (Numbers-like), used for the fullscreen and timer shots. */
export const ChartWindow: React.FC<Placed> = (w) => (
  <MacWindow {...w} title="Q3 Signups">
    <div style={{ position: "absolute", inset: pt(18), display: "flex", alignItems: "flex-end", gap: pt(10) }}>
      {[38, 52, 46, 64, 58, 76, 88, 72, 94].map((h, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${h}%`,
            borderRadius: pt(5),
            background: i === 8 ? "linear-gradient(180deg,#5b84ff,#1a4dff)" : "linear-gradient(180deg,#c9d6ff,#9fb3ff)",
          }}
        />
      ))}
    </div>
  </MacWindow>
);
