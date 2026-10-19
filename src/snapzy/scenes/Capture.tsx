import type React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { CHART, DeskSnapshot, DeskWindows, FINDER, NOTES, type Rect, SCREEN } from "../content/Desk";
import { Cursor } from "../desktop/Cursor";
import { cameraAt, Desktop, WIDE } from "../desktop/Desktop";
import { KeyCaps } from "../desktop/KeyCaps";
import { SNAPZY_ITEM_X } from "../desktop/MenuBar";
import { BOUNCY, ease, pathAt, pressAt, SMOOTH, SNAPPY, swift, swiftInOut } from "../motion";
import { pt } from "../theme";
import { CAPTURE as T } from "../timing";
import { CountDrop, Dim, Flash, FlyingShot, SizeBadge } from "../ui/CaptureFx";
import { Headline } from "../ui/Headline";
import { QA_H, QA_W, QuickAccessCard, qaSlot } from "../ui/QuickAccess";
import { MENU_H, MENU_W, MENU_X, MENU_Y, menuRowCenter, SnapzyMenu } from "../ui/SnapzyMenu";

// Capture (14 bars). The windows arrive, the Snapzy menu opens from its menu
// bar item and we look at the capture modes, then five captures in a row:
// area (⇧⌘4 and drag), application window (A, then click a window),
// fullscreen (⇧⌘3), the active window and a delayed capture (3, 2, 1 while a
// tooltip is open). Each one flies into a Quick Access card in the corner.

const AREA_A = { x: NOTES.x + 175, y: NOTES.y + 58 };
const AREA_B = { x: NOTES.x + 770, y: NOTES.y + 300 };
const AREA: Rect = { x: AREA_A.x, y: AREA_A.y, w: AREA_B.x - AREA_A.x, h: AREA_B.y - AREA_A.y };
const TIP = { x: CHART.x + CHART.w - pt(60), y: CHART.y + pt(110) };

type Shot = { at: number; region: Rect; wallpaper: boolean; windows: readonly ("notes" | "finder" | "chart")[]; tip?: number };

const SHOTS: readonly Shot[] = [
  { at: T.areaShot, region: AREA, wallpaper: true, windows: ["chart", "finder", "notes"] },
  { at: T.appShot, region: FINDER, wallpaper: false, windows: ["finder"] },
  { at: T.fullShot, region: SCREEN, wallpaper: true, windows: ["chart", "finder", "notes"] },
  { at: T.activeShot, region: NOTES, wallpaper: false, windows: ["notes"] },
  { at: T.delayShot, region: SCREEN, wallpaper: true, windows: ["chart", "finder", "notes"], tip: 1 },
];

const FLIGHT = 40;
const DISMISS = 1610;
const CLICKS = [T.menuTap, T.menuClose, T.dragStart, T.appShot, T.activeMenuTap, T.activeClick, T.delayMenuTap, T.delayClick] as const;

const card = (slotY: number): Rect => {
  const s = qaSlot(0);
  return { x: s.x + pt(7), y: s.y - slotY + pt(7), w: QA_W - pt(14), h: QA_H - pt(14) };
};

export const Capture: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const head = swift(frame, fps, SMOOTH, 2) - swift(frame, fps, SMOOTH, 62);
  const windowsIn = (i: number) => swift(frame, fps, SNAPPY, T.windowsIn + i * 8);

  // Menu: three visits.
  const menuOpen =
    swiftInOut(frame, fps, T.menuTap, T.menuClose, BOUNCY) +
    swiftInOut(frame, fps, T.activeMenuTap, T.activeClick + 2, BOUNCY) +
    swiftInOut(frame, fps, T.delayMenuTap, T.delayClick + 2, BOUNCY);
  let hover: string | undefined;
  for (const [at, label] of T.hover) {
    if (frame >= at - 4 && frame < T.menuClose) hover = label;
  }
  if (frame >= T.activeMenuTap + 30 && frame < T.activeClick + 4) hover = "Capture Active Window";
  if (frame >= T.delayMenuTap + 30 && frame < T.delayClick + 4) hover = "Delayed Capture (3s)";
  const menuPress = Math.max(pressAt(frame, T.activeClick), pressAt(frame, T.delayClick));
  const itemActive = Math.min(1, Math.max(0, menuOpen));

  // Cursor.
  const item = { x: SNAPZY_ITEM_X, y: pt(12) };
  const row = (label: string) => menuRowCenter(label);
  const finderC = { x: FINDER.x + FINDER.w * 0.55, y: FINDER.y + FINDER.h * 0.45 };
  const notesC = { x: NOTES.x + NOTES.w * 0.5, y: NOTES.y + NOTES.h * 0.55 };
  const cursor = pathAt(frame, [
    [0, 1300, 760],
    [110, 1300, 760],
    [T.menuTap - 4, item.x, item.y],
    ...T.hover.map(([at, label]) => [at - 6, row(label).x, row(label).y] as const),
    [T.hover[4][0] + 30, row("Delayed Capture (3s)").x, row("Delayed Capture (3s)").y],
    [T.menuClose - 4, 1180, 330],
    [T.areaKeys + 20, AREA_A.x, AREA_A.y],
    [T.dragStart, AREA_A.x, AREA_A.y],
    [T.dragEnd, AREA_B.x, AREA_B.y],
    [T.areaShot + 30, AREA_B.x + 60, AREA_B.y + 80],
    [T.appHoverNotes - 4, notesC.x, notesC.y],
    [T.appHoverFinder - 4, finderC.x, finderC.y],
    [T.appShot + 20, finderC.x, finderC.y],
    [T.fullKeys - 10, 1380, 880],
    [T.activeMenuTap - 30, 1380, 880],
    [T.activeMenuTap - 4, item.x, item.y],
    [T.activeClick - 6, row("Capture Active Window").x, row("Capture Active Window").y],
    [T.activeClick + 30, 1250, 600],
    [T.delayMenuTap - 4, item.x, item.y],
    [T.delayClick - 6, row("Delayed Capture (3s)").x, row("Delayed Capture (3s)").y],
    [T.count[0] + 30, TIP.x, TIP.y],
    [T.delayShot + 30, TIP.x, TIP.y],
  ]);
  const press = CLICKS.reduce((p, t) => Math.max(p, pressAt(frame, t)), 0);
  const crossOn = frame >= T.areaKeys + 10 && frame < T.areaShot + 4;
  const cursorKind = crossOn ? "cross" : "arrow";

  // Area selection.
  const areaDim = ease(frame, T.areaKeys + 6, T.areaKeys + 20) * (1 - ease(frame, T.areaShot, T.areaShot + 10));
  const drag = ease(frame, T.dragStart, T.dragEnd);
  const sel: Rect | null =
    frame >= T.dragStart && frame < T.areaShot + 10
      ? { x: AREA_A.x, y: AREA_A.y, w: Math.max(1, AREA.w * drag), h: Math.max(1, AREA.h * drag) }
      : null;

  // Application window mode.
  const appDim = ease(frame, T.appA + 4, T.appA + 16) * (1 - ease(frame, T.appShot, T.appShot + 10));
  const notesHi = appDim * (frame >= T.appHoverNotes && frame < T.appHoverFinder ? 1 : 0);
  const finderHi = appDim * (frame >= T.appHoverFinder ? 1 : 0);
  // Active window: Notes glows before the shot.
  const activeHi = ease(frame, T.activeClick + 2, T.activeClick + 10) * (1 - ease(frame, T.activeShot + 4, T.activeShot + 14));

  // Delayed capture: tooltip open while counting down.
  const tip = ease(frame, T.count[0] + 34, T.count[0] + 44) * (1 - ease(frame, T.delayShot + 30, T.delayShot + 40));

  // Quick Access stack.
  const arrived = (k: number) => frame >= SHOTS[k].at + FLIGHT;
  const step = QA_H + pt(12);
  const cards = SHOTS.map((s, k) => {
    // Slides up one slot each time a newer card lands.
    let lift = 0;
    for (let j = k + 1; j < SHOTS.length; j++) {
      lift += swift(frame, fps, SNAPPY, SHOTS[j].at + FLIGHT - 6);
    }
    const out = swift(frame, fps, SMOOTH, DISMISS + (SHOTS.length - 1 - k) * 6);
    const fade = Math.max(0, Math.min(1, 3 - lift));
    return { k, lift, show: arrived(k) ? (1 - out) * fade : 0 };
  });

  const camera = cameraAt(frame, [
    [0, WIDE],
    [T.menuTap, WIDE],
    [T.menuTap + 40, { x: MENU_X + MENU_W / 2 - pt(60), y: MENU_Y + MENU_H / 2 - pt(40), scale: 1.55 }],
    [T.menuClose - 10, { x: MENU_X + MENU_W / 2 - pt(60), y: MENU_Y + MENU_H / 2 - pt(40), scale: 1.55 }],
    [T.areaKeys, WIDE],
    [T.dragStart - 10, { x: AREA.x + AREA.w / 2, y: AREA.y + AREA.h / 2 + 40, scale: 1.3 }],
    [T.areaShot + 20, { x: AREA.x + AREA.w / 2, y: AREA.y + AREA.h / 2 + 40, scale: 1.3 }],
    [T.areaShot + 60, WIDE],
  ]);

  const keyShow = (at: number, len = 70) => swiftInOut(frame, fps, at - 8, at + len, SNAPPY);

  return (
    <Desktop
      scene="capture"
      camera={camera}
      snapzyActive={itemActive}
      overlay={
        <>
          <DeskWindows
            state={{
              notes: { show: windowsIn(2), highlight: Math.max(notesHi, activeHi), lift: activeHi },
              finder: { show: windowsIn(1), highlight: finderHi },
              chart: { show: windowsIn(0) },
            }}
            chartTip={tip}
          />
          <Dim amount={areaDim} hole={sel} />
          {sel && frame >= T.dragStart + 8 ? <SizeBadge rect={sel} opacity={1 - ease(frame, T.areaShot, T.areaShot + 6)} /> : null}
          <Dim amount={appDim} />
          {/* Lift the hovered window above the dim. */}
          {appDim > 0.01 ? (
            <DeskWindows
              order={[frame >= T.appHoverFinder ? "finder" : "notes"]}
              state={{ notes: { highlight: notesHi }, finder: { highlight: finderHi } }}
            />
          ) : null}
          {SHOTS.map((s) => (
            <Flash key={`f${s.at}`} t={frame - s.at} rect={s.region} />
          ))}
          {cards.map(({ k, lift, show }) => {
            const slot = qaSlot(0);
            return (
              <QuickAccessCard key={k} x={slot.x} y={slot.y - lift * step} show={show} scale={1}>
                <DeskSnapshot
                  region={SHOTS[k].region}
                  width={QA_W - pt(14)}
                  height={QA_H - pt(14)}
                  wallpaper={SHOTS[k].wallpaper}
                  windows={SHOTS[k].windows}
                  chartTip={SHOTS[k].tip ?? 0}
                />
              </QuickAccessCard>
            );
          })}
          {SHOTS.map((s) => (
            <FlyingShot key={`s${s.at}`} from={s.region} to={card(0)} t={ease(frame, s.at + 4, s.at + FLIGHT)}>
              {(w, h) => <DeskSnapshot region={s.region} width={w} height={h} wallpaper={s.wallpaper} windows={s.windows} chartTip={s.tip ?? 0} />}
            </FlyingShot>
          ))}
          <SnapzyMenu open={menuOpen} hover={hover} press={menuPress} />
          {T.count.map((at, i) => (
            <CountDrop key={at} n={3 - i} show={swiftInOut(frame, fps, at, at + 48, BOUNCY)} />
          ))}
          {frame > 96 ? <Cursor x={cursor.x} y={cursor.y} press={press} kind={cursorKind} opacity={ease(frame, 96, 110)} /> : null}
        </>
      }
      screen={
        <>
          <Headline title="Capture anything." show={head} y={pt(320)} />
          <KeyCaps keys={["⇧", "⌘", "4"]} show={keyShow(T.areaKeys)} press={pressAt(frame, T.areaKeys)} label="Capture Area" />
          <KeyCaps keys={["⇧", "⌘", "4"]} show={keyShow(T.appKeys, 40)} press={pressAt(frame, T.appKeys)} />
          <KeyCaps keys={["A"]} show={keyShow(T.appA)} press={pressAt(frame, T.appA)} label="Application Capture" />
          <KeyCaps keys={["⇧", "⌘", "3"]} show={keyShow(T.fullKeys)} press={pressAt(frame, T.fullKeys)} label="Capture Fullscreen" />
          <Flash t={frame - T.fullShot} rect={SCREEN} />
          <Flash t={frame - T.delayShot} rect={SCREEN} />
        </>
      }
    />
  );
};
