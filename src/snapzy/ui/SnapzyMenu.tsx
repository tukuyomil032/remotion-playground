import type React from "react";
import { MENU_BAR_H, SNAPZY_ITEM_X } from "../desktop/MenuBar";
import { Glass } from "../glass/Glass";
import { mix } from "../motion";
import { FONT_TEXT, pt } from "../theme";

// Snapzy's menu bar menu, as Liquid Glass. `open` 0..1 (a spring) morphs the
// glass from the status item's capsule into the full menu; the rows fade in
// once the shape is mostly there. `hover` is the highlighted row label.
// Rows follow v2.1.0-beta.6; shortcuts are the README defaults (blank where
// the README lists none).

type Row = { label: string; keys?: string; disabled?: boolean } | "sep";

export const MENU_ROWS: readonly Row[] = [
  { label: "Capture Area", keys: "⇧⌘4" },
  { label: "Capture Markup", keys: "⇧⌘7" },
  { label: "Application Capture" },
  { label: "Capture Fullscreen", keys: "⇧⌘3" },
  { label: "Capture Active Window" },
  { label: "Scrolling Capture", keys: "⇧⌘6" },
  { label: "Capture Text (OCR)", keys: "⇧⌘2" },
  { label: "Capture Subject", keys: "⇧⌘1" },
  { label: "Delayed Capture (3s)" },
  "sep",
  { label: "Record Screen", keys: "⇧⌘5" },
  "sep",
  { label: "Open Annotate", keys: "⇧⌘A" },
  { label: "Edit Video...", keys: "⇧⌘E" },
  { label: "Open History" },
  { label: "Keyboard Shortcuts", keys: "⇧⌘K" },
  "sep",
  { label: "Preferences...", keys: "⌘," },
  { label: "Quit Snapzy", keys: "⌘Q" },
];

const ROW_H = pt(24);
const SEP_H = pt(11);
const PAD = pt(6);
export const MENU_W = pt(262);
export const MENU_H = MENU_ROWS.reduce((h, r) => h + (r === "sep" ? SEP_H : ROW_H), 0) + PAD * 2;
export const MENU_X = Math.min(SNAPZY_ITEM_X - pt(16), 1920 - MENU_W - pt(8));
export const MENU_Y = MENU_BAR_H + pt(4);

/** Screen center of a row, for aiming the cursor. */
export const menuRowCenter = (label: string): { x: number; y: number } => {
  let y = MENU_Y + PAD;
  for (const r of MENU_ROWS) {
    if (r === "sep") {
      y += SEP_H;
      continue;
    }
    if (r.label === label) {
      return { x: MENU_X + pt(80), y: y + ROW_H / 2 };
    }
    y += ROW_H;
  }
  throw new Error(`No menu row ${label}`);
};

export const SnapzyMenu: React.FC<{ open: number; hover?: string; press?: number }> = ({ open, hover, press = 0 }) => {
  if (open <= 0.002) {
    return null;
  }
  const o = Math.max(0, open);
  // From the status item capsule to the menu.
  const fromW = pt(30);
  const fromH = pt(20);
  const fromX = SNAPZY_ITEM_X - fromW / 2;
  const fromY = (MENU_BAR_H - fromH) / 2;
  const w = mix(fromW, MENU_W, o);
  const h = mix(fromH, MENU_H, o);
  const x = mix(fromX, MENU_X, o);
  const y = mix(fromY, MENU_Y, o);
  const r = mix(fromH / 2, pt(14), Math.min(1, o));
  const rows = Math.max(0, Math.min(1, (o - 0.55) / 0.35));

  let cy = PAD;
  return (
    <Glass
      width={w}
      height={h}
      radius={r}
      refraction={24}
      bevel={20}
      tint={0.1}
      shade={0.42}
      blur={22}
      light={0.2 + 0.3 * o}
      style={{ left: x, top: y }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, width: MENU_W, opacity: rows, fontFamily: FONT_TEXT }}>
        {MENU_ROWS.map((row, i) => {
          if (row === "sep") {
            const top = cy;
            cy += SEP_H;
            return (
              <div
                key={`sep${i}`}
                style={{ position: "absolute", left: pt(14), right: pt(14), top: top + SEP_H / 2, height: 1, background: "rgba(255,255,255,0.16)" }}
              />
            );
          }
          const top = cy;
          cy += ROW_H;
          const active = row.label === hover;
          return (
            <div
              key={row.label}
              style={{
                position: "absolute",
                left: PAD,
                right: PAD,
                top,
                height: ROW_H,
                borderRadius: pt(7),
                background: active ? `rgba(30,120,255,${0.9 - 0.25 * press})` : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: `0 ${pt(10)}px`,
                fontSize: pt(13),
                color: row.disabled ? "rgba(255,255,255,0.35)" : "white",
              }}
            >
              <span>{row.label}</span>
              {row.keys ? <span style={{ color: active ? "white" : "rgba(255,255,255,0.55)", letterSpacing: 1 }}>{row.keys}</span> : null}
            </div>
          );
        })}
      </div>
    </Glass>
  );
};
