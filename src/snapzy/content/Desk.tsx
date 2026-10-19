import type React from "react";
import { Wallpaper } from "../desktop/Wallpaper";
import { pt } from "../theme";
import { ChartWindow, FinderWindow, NOTE_BODY, NotesWindow } from "./Apps";

// The made-up desktop that gets captured: three windows at fixed places, and a
// snapshot of any region of it (for thumbnails and flying captures).

export type Rect = { x: number; y: number; w: number; h: number };

export const NOTES: Rect = { x: 200, y: 150, w: 860, h: 440 };
export const FINDER: Rect = { x: 1000, y: 360, w: 760, h: 400 };
export const CHART: Rect = { x: 330, y: 640, w: 560, h: 300 };
export const SCREEN: Rect = { x: 0, y: 0, w: 1920, h: 1080 };

export type WinId = "notes" | "finder" | "chart";

export type WinState = { show?: number; highlight?: number; lift?: number };

const NOTES_SIDEBAR = pt(150) + pt(8);

/** Screen rect of a line of the note's body text. */
export const noteLine = (i: number): Rect => ({
  x: NOTES.x + NOTES_SIDEBAR + NOTE_BODY.left - pt(4),
  y: NOTES.y + NOTE_BODY.top + i * NOTE_BODY.lineH - pt(5),
  w: pt(420),
  h: NOTE_BODY.lineH,
});

/** The three windows. `order` is back to front. */
export const DeskWindows: React.FC<{
  state?: Partial<Record<WinId, WinState>>;
  order?: readonly WinId[];
  noteHighlight?: readonly number[];
  chartTip?: number;
}> = ({ state = {}, order = ["chart", "finder", "notes"], noteHighlight, chartTip = 0 }) => (
  <>
    {order.map((id) => {
      const s = state[id] ?? {};
      const show = s.show ?? 1;
      if (show <= 0.002) {
        return null;
      }
      const common = {
        highlight: s.highlight ?? 0,
        lift: s.lift ?? 0,
        dim: id !== order[order.length - 1],
        style: { opacity: Math.min(1, show), transform: `scale(${0.94 + 0.06 * show})` } as React.CSSProperties,
      };
      if (id === "notes") {
        return <NotesWindow key={id} x={NOTES.x} y={NOTES.y} width={NOTES.w} height={NOTES.h} lineHighlight={noteHighlight} {...common} />;
      }
      if (id === "finder") {
        return <FinderWindow key={id} x={FINDER.x} y={FINDER.y} width={FINDER.w} height={FINDER.h} {...common} />;
      }
      return (
        <div key={id}>
          <ChartWindow x={CHART.x} y={CHART.y} width={CHART.w} height={CHART.h} {...common} />
          {chartTip > 0.01 ? (
            <div
              style={{
                position: "absolute",
                left: CHART.x + CHART.w - pt(150),
                top: CHART.y + pt(40),
                padding: `${pt(6)}px ${pt(10)}px`,
                borderRadius: pt(8),
                background: "rgba(28,28,32,0.92)",
                color: "white",
                fontFamily: "inherit",
                fontSize: pt(12),
                opacity: chartTip,
                transform: `translateY(${(1 - chartTip) * pt(6)}px)`,
                boxShadow: "0 6px 16px rgba(0,0,0,0.3)",
                whiteSpace: "nowrap",
              }}
            >
              September · 94 signups
            </div>
          ) : null}
        </div>
      );
    })}
  </>
);

/**
 * A still picture of `region` of the desktop, drawn into a box of the given
 * size (contain). `windows` limits which windows are in the picture; with
 * `wallpaper` false the background is transparent (a window shot).
 */
export const DeskSnapshot: React.FC<{
  region: Rect;
  width: number;
  height: number;
  wallpaper?: boolean;
  windows?: readonly WinId[];
  chartTip?: number;
}> = ({ region, width, height, wallpaper = true, windows = ["chart", "finder", "notes"], chartTip = 0 }) => {
  const k = Math.min(width / region.w, height / region.h);
  const ox = (width - region.w * k) / 2;
  const oy = (height - region.h * k) / 2;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width, height, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: ox,
          top: oy,
          width: region.w * k,
          height: region.h * k,
          overflow: "hidden",
          borderRadius: wallpaper ? pt(4) : 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -region.x * k,
            top: -region.y * k,
            width: 1920,
            height: 1080,
            transformOrigin: "0 0",
            transform: `scale(${k})`,
          }}
        >
          {wallpaper ? <Wallpaper drift={0} /> : null}
          <DeskWindows
            order={(["chart", "finder", "notes"] as const).filter((w) => windows.includes(w))}
            chartTip={chartTip}
            state={{ notes: { lift: 0 }, finder: { lift: 0 }, chart: { lift: 0 } }}
          />
        </div>
      </div>
    </div>
  );
};
