import type React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { CHART, DeskSnapshot, DeskWindows, FINDER, NOTES, type Rect, SCREEN, type WinId } from "../content/Desk";
import { Cursor } from "../desktop/Cursor";
import { cameraAt, Desktop, WIDE } from "../desktop/Desktop";
import { MENU_BAR_H, SNAPZY_ITEM_X } from "../desktop/MenuBar";
import { Glass } from "../glass/Glass";
import { BOUNCY, ease, mix, pathAt, pressAt, SMOOTH, SNAPPY, swift, swiftInOut } from "../motion";
import { pt } from "../theme";
import { HISTORY as T } from "../timing";
import { type HistoryFilter, type HistoryItem, HistoryPanel, type HistoryRange, historyHotspots } from "../ui/editors/HistoryPanel";
import { Headline } from "../ui/Headline";
import { Scrim } from "../ui/Scrim";
import { MENU_H, MENU_W, MENU_X, MENU_Y, menuRowCenter, SnapzyMenu } from "../ui/SnapzyMenu";

// History (5 bars). From the menu bar, "Open History": the menu's glass grows
// into the capture history panel. Switch to Screenshots, narrow to 7D, hover a
// capture and Restore it; the panel folds back into the menu bar item.

const PW = pt(1000);
const PH = pt(560);
const PX = (1920 - PW) / 2;
const PY = MENU_BAR_H + pt(40);

const ALL: readonly WinId[] = ["chart", "finder", "notes"];
const HS0 = historyHotspots({ width: PW, height: PH, count: 8 });
/** The panel's thumbnail box: the card minus its padding, at a 0.62 ratio. */
const THUMB_W = HS0.cards[0].w - pt(16);
const THUMB_H = THUMB_W * 0.62;

const shot = (region: Rect, windows: readonly WinId[], wallpaper = true): React.ReactNode => (
  <div style={{ position: "absolute", inset: 0, background: wallpaper ? "#0b1235" : "#2a2b31" }}>
    <DeskSnapshot region={region} width={THUMB_W} height={THUMB_H} windows={windows} wallpaper={wallpaper} />
  </div>
);

const ITEMS: HistoryItem[] = [
  { id: "a", kind: "screenshot", label: "Snapzy_2026-10-19_09-48-02", ago: "1 min. ago", content: shot(SCREEN, ALL) },
  { id: "b", kind: "screenshot", label: "Snapzy_2026-10-19_09-47-31", ago: "2 min. ago", content: shot(NOTES, ["notes"], false) },
  { id: "c", kind: "screenshot", label: "Snapzy_2026-10-19_09-46-55", ago: "3 min. ago", content: shot(SCREEN, ALL) },
  { id: "d", kind: "screenshot", label: "Snapzy_2026-10-19_09-46-12", ago: "3 min. ago", content: shot(FINDER, ["finder"], false) },
  { id: "e", kind: "screenshot", label: "Snapzy_2026-10-18_21-03-40", ago: "13 hr. ago", content: shot(CHART, ["chart"], false) },
  { id: "f", kind: "screenshot", label: "Snapzy_2026-10-16_14-22-09", ago: "3 days ago", content: shot({ x: 200, y: 150, w: 1100, h: 620 }, ALL) },
  { id: "g", kind: "video", label: "Screen Recording_2026-10-19", ago: "5 min. ago", content: shot(SCREEN, ALL) },
  { id: "h", kind: "gif", label: "Snapzy_2026-10-12_10-05-44", ago: "1 week ago", content: shot(NOTES, ["notes"], false) },
];

export const History: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const head = swift(frame, fps, SMOOTH, 2) - swift(frame, fps, SMOOTH, 66);
  const menu = swiftInOut(frame, fps, T.menuTap, T.open + 2, BOUNCY);
  const hoverRow = frame >= T.menuTap + 30 && frame < T.open + 4 ? "Open History" : undefined;

  // Menu -> panel -> back into the menu bar item.
  const grow = swift(frame, fps, SNAPPY, T.open + 2);
  const fold = swift(frame, fps, SNAPPY, T.close);
  const itemW = pt(30);
  const itemH = pt(20);
  const fromMenu: Rect = { x: MENU_X, y: MENU_Y, w: MENU_W, h: MENU_H };
  const panel: Rect = { x: PX, y: PY, w: PW, h: PH };
  const item: Rect = { x: SNAPZY_ITEM_X - itemW / 2, y: (MENU_BAR_H - itemH) / 2, w: itemW, h: itemH };
  const lerp = (a: Rect, b: Rect, t: number): Rect => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), w: mix(a.w, b.w, t), h: mix(a.h, b.h, t) });
  const r = fold > 0.001 ? lerp(panel, item, fold) : lerp(fromMenu, panel, grow);
  const panelOn = frame >= T.open + 2 && fold < 0.995;
  const content = ease(frame, T.open + 20, T.open + 40) * (1 - ease(frame, T.close, T.close + 12));

  const filter: HistoryFilter = frame >= T.tabScreens ? "screenshots" : "all";
  const range: HistoryRange = frame >= T.range7d ? "7d" : "any";
  const hoverId = frame >= T.hover && frame < T.close ? "b" : undefined;

  const hs = historyHotspots({ width: PW, height: PH, count: ITEMS.length });
  const at = (p: { x: number; y: number }) => ({ x: PX + p.x, y: PY + p.y });
  const tab = at(hs.tabs.screenshots);
  const rng = at(hs.ranges["7d"]);
  const card = hs.cards[1];
  const cardC = { x: PX + card.x + card.w / 2, y: PY + card.y + card.h * 0.42 };
  const restore = { x: PX + card.x + card.w / 2, y: PY + card.y + card.h * 0.72 };
  const row = menuRowCenter("Open History");

  const cursor = pathAt(frame, [
    [0, 1300, 780],
    [T.menuTap - 4, SNAPZY_ITEM_X, pt(12)],
    [T.open - 30, row.x, row.y],
    [T.open, row.x, row.y],
    [T.tabScreens - 6, tab.x, tab.y],
    [T.range7d - 6, rng.x, rng.y],
    [T.hover, cardC.x, cardC.y],
    [T.restore - 6, restore.x, restore.y],
    [T.restore + 50, restore.x + 160, restore.y + 220],
  ]);
  const clicks = [T.menuTap, T.open, T.tabScreens, T.range7d, T.restore];
  const press = clicks.reduce((p, t) => Math.max(p, pressAt(frame, t)), 0);
  let pressed: string | undefined;
  if (Math.abs(frame - T.tabScreens) < 6) pressed = "tab-screenshots";
  if (Math.abs(frame - T.range7d) < 6) pressed = "range-7d";
  if (Math.abs(frame - T.restore) < 6) pressed = "restore";

  const panelCam = { x: PX + PW / 2, y: PY + PH / 2, scale: 1.18 };
  const camera = cameraAt(frame, [
    [0, WIDE],
    [T.open + 20, WIDE],
    [T.open + 60, panelCam],
    [T.restore + 10, panelCam],
    [T.close + 20, WIDE],
  ]);

  return (
    <Desktop
      scene="history"
      camera={camera}
      snapzyActive={Math.max(Math.min(1, menu), ease(frame, T.close + 30, T.close + 40) * (1 - ease(frame, T.close + 50, T.close + 80)))}
      overlay={
        <>
          <DeskWindows />
          <SnapzyMenu open={menu} hover={hoverRow} press={pressAt(frame, T.open)} />
          {panelOn ? (
            <Glass
              width={r.w}
              height={r.h}
              radius={mix(pt(14), pt(26), Math.min(1, grow)) * (1 - 0.5 * fold)}
              refraction={34}
              bevel={30}
              tint={0.08}
              shade={0.64}
              blur={24}
              light={0.2 + 0.4 * grow}
              style={{ left: r.x, top: r.y }}
            >
              <div style={{ position: "absolute", left: 0, top: 0, width: PW, height: PH, opacity: content }}>
                <HistoryPanel width={PW} height={PH} filter={filter} range={range} items={ITEMS} hoverId={hoverId} pressed={pressed} />
              </div>
            </Glass>
          ) : null}
          {frame > 70 && frame < T.restore + 60 ? (
            <Cursor x={cursor.x} y={cursor.y} press={press} opacity={ease(frame, 70, 86) * (1 - ease(frame, T.restore + 30, T.restore + 56))} />
          ) : null}
        </>
      }
      screen={
        <>
          <Scrim amount={head} />
          <Headline title="Find it again." sub="Every screenshot, recording, and GIF, searchable on your Mac." show={head} y={pt(300)} />
        </>
      }
    />
  );
};
