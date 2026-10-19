import type React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { NOTE_BODY } from "../content/Apps";
import { DeskSnapshot, DeskWindows, NOTES } from "../content/Desk";
import { Cursor } from "../desktop/Cursor";
import { cameraAt, Desktop, WIDE } from "../desktop/Desktop";
import { ease, mix, pathAt, pressAt, SMOOTH, SNAPPY, swift } from "../motion";
import { pt } from "../theme";
import { ANNOTATE as T } from "../timing";
import { AnnotateEditor, type AnnotateMode, type AnnotateTool, annotateHotspots } from "../ui/editors/AnnotateEditor";
import { BlurBox, Counter, CurvedArrow, MarkRect } from "../ui/editors/Annotations";
import { Headline } from "../ui/Headline";
import { QA_H, QA_W, QuickAccessCard, qaSlot } from "../ui/QuickAccess";
import { Scrim } from "../ui/Scrim";

// Annotate (10 bars). A capture of the note lands in Quick Access; clicking it
// grows the card into the annotation editor. Arrow, box, numbered steps, a blur
// over the e-mail address, then a gradient background with padding and round
// corners, the Mockup tilt, and Done.

const EW = pt(1120);
const EH = pt(700);
const EX = (1920 - EW) / 2;
const EY = (1080 - EH) / 2 + pt(8);

// Annotation geometry in content coordinates (the note window, NOTES.w x NOTES.h).
const LINE_X = pt(158) + NOTE_BODY.left;
const lineY = (i: number) => NOTE_BODY.top + i * NOTE_BODY.lineH + NOTE_BODY.lineH * 0.35;
const ARROW_FROM: [number, number] = [NOTES.w * 0.86, NOTES.h * 0.88];
const ARROW_TO: [number, number] = [LINE_X + pt(330), lineY(0) + pt(8)];
const TITLE_BOX = { x: LINE_X - pt(10), y: pt(70), w: pt(220), h: pt(42) };
const EMAIL = { x: LINE_X + pt(248), y: lineY(2) - pt(13), w: pt(168), h: pt(26) };
const COUNTERS: [number, number][] = [
  [LINE_X - pt(20), lineY(0)],
  [LINE_X - pt(20), lineY(1)],
];

export const Annotate: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const head = swift(frame, fps, SMOOTH, 2) - swift(frame, fps, SMOOTH, 66);
  const cardShow = swift(frame, fps, SNAPPY, T.cardIn);
  const hover = ease(frame, T.cardHover, T.cardHover + 10);

  // Card -> editor.
  const grow = swift(frame, fps, SNAPPY, T.cardClick + 4);
  const close = swift(frame, fps, SNAPPY, T.done + 8);
  const editorOn = frame >= T.cardClick + 4;
  const slot = qaSlot(0);
  const sx = mix(QA_W / EW, 1, grow) * (1 - 0.06 * close);
  const sy = mix(QA_H / EH, 1, grow) * (1 - 0.06 * close);
  const ex = mix(slot.x, EX, grow);
  const ey = mix(slot.y, EY, grow);
  const editorOpacity = Math.min(1, grow * 2) * (1 - close);
  const uiOpacity = ease(frame, T.cardClick + 14, T.cardClick + 34);

  // Editor state.
  let tool: AnnotateTool = "arrow";
  if (frame >= T.toolRect) tool = "rect";
  if (frame >= T.toolCounter) tool = "counter";
  if (frame >= T.toolBlur) tool = "blur";
  const mode: AnnotateMode = frame >= T.mockup ? "mockup" : "annotate";
  const padding = 40 * ease(frame, T.padding[0], T.padding[1]);
  const corners = 18 * ease(frame, T.corners[0], T.corners[1]);
  const gradient = frame >= T.gradient ? 1 : null;

  const hs = annotateHotspots({ width: EW, height: EH, mode, showBackgroundPanel: true, contentWidth: NOTES.w, contentHeight: NOTES.h, padding });
  const hs0 = annotateHotspots({ width: EW, height: EH, mode: "annotate", showBackgroundPanel: true, contentWidth: NOTES.w, contentHeight: NOTES.h, padding: 0 });
  const toScreen = (cx: number, cy: number) => ({ x: EX + hs0.canvas.x + cx * hs0.canvas.scale, y: EY + hs0.canvas.y + cy * hs0.canvas.scale });
  const at = (p: { x: number; y: number }) => ({ x: EX + p.x, y: EY + p.y });

  const arrowP = ease(frame, T.arrow[0], T.arrow[1]);
  const rectP = ease(frame, T.rect[0], T.rect[1]);
  const blurP = ease(frame, T.blur[0], T.blur[1]);

  const a0 = toScreen(...ARROW_FROM);
  const a1 = toScreen(...ARROW_TO);
  const r0 = toScreen(TITLE_BOX.x, TITLE_BOX.y);
  const r1 = toScreen(TITLE_BOX.x + TITLE_BOX.w, TITLE_BOX.y + TITLE_BOX.h);
  const c0 = toScreen(...COUNTERS[0]);
  const c1 = toScreen(...COUNTERS[1]);
  const b0 = toScreen(EMAIL.x, EMAIL.y);
  const b1 = toScreen(EMAIL.x + EMAIL.w, EMAIL.y + EMAIL.h);
  const tb = (t: AnnotateTool) => at(hs0.tools[t]);
  // The panel scrolls after the gradient pick so Padding and Corners are in view.
  const SCROLL = hs0.panelScrollForSliders;
  const panelScroll = SCROLL * ease(frame, T.gradient + 16, T.padding[0] - 12);
  const scrolled = annotateHotspots({ width: EW, height: EH, mode: "annotate", showBackgroundPanel: true, contentWidth: NOTES.w, contentHeight: NOTES.h, panelScroll: SCROLL });
  const padHs = scrolled.padding;
  const corHs = scrolled.corners;
  const grad = at(hs0.gradients[1]);
  const mock = at(hs0.modes.mockup);
  const done = at(hs.done);

  const cursor = pathAt(frame, [
    [0, 1300, 760],
    [T.cardHover - 6, slot.x + QA_W * 0.5, slot.y + QA_H * 0.55],
    [T.cardClick, slot.x + QA_W * 0.5, slot.y + QA_H * 0.55],
    [T.toolArrow - 6, tb("arrow").x, tb("arrow").y],
    [T.arrow[0], a0.x, a0.y],
    [T.arrow[1], a1.x, a1.y],
    [T.toolRect - 6, tb("rect").x, tb("rect").y],
    [T.rect[0], r0.x, r0.y],
    [T.rect[1], r1.x, r1.y],
    [T.toolCounter - 6, tb("counter").x, tb("counter").y],
    [T.counters[0] - 4, c0.x, c0.y],
    [T.counters[1] - 4, c1.x, c1.y],
    [T.toolBlur - 6, tb("blur").x, tb("blur").y],
    [T.blur[0], b0.x, b0.y],
    [T.blur[1], b1.x, b1.y],
    [T.gradient - 6, grad.x, grad.y],
    [T.padding[0] - 4, EX + padHs.x0, EY + padHs.y],
    [T.padding[1], EX + mix(padHs.x0, padHs.x1, 0.4), EY + padHs.y],
    [T.corners[0] - 4, EX + corHs.x0, EY + corHs.y],
    [T.corners[1], EX + mix(corHs.x0, corHs.x1, 18 / 40), EY + corHs.y],
    [T.mockup - 6, mock.x, mock.y],
    [T.done - 6, done.x, done.y],
    [T.done + 50, done.x - 80, done.y + 120],
  ]);
  const clicks = [T.cardClick, T.toolArrow, T.arrow[0], T.toolRect, T.rect[0], T.toolCounter, ...T.counters, T.toolBlur, T.blur[0], T.gradient, T.padding[0], T.corners[0], T.mockup, T.done];
  const press = clicks.reduce((p, t) => Math.max(p, pressAt(frame, t)), 0);
  const drawing =
    (frame >= T.arrow[0] && frame <= T.arrow[1]) ||
    (frame >= T.rect[0] && frame <= T.rect[1]) ||
    (frame >= T.blur[0] && frame <= T.blur[1]) ||
    (frame >= T.padding[0] && frame <= T.padding[1]) ||
    (frame >= T.corners[0] && frame <= T.corners[1]);

  let pressed: string | undefined;
  for (const [f, id] of [
    [T.toolArrow, "tool-arrow"],
    [T.toolRect, "tool-rect"],
    [T.toolCounter, "tool-counter"],
    [T.toolBlur, "tool-blur"],
    [T.gradient, "gradient-1"],
    [T.mockup, "mode-mockup"],
    [T.done, "done"],
  ] as const) {
    if (frame >= f - 2 && frame < f + 8) pressed = id;
  }

  const drawCam = { x: EX + EW * 0.56, y: EY + EH * 0.47, scale: 1.18 };
  const panelCam = { x: EX + EW * 0.4, y: EY + EH * 0.55, scale: 1.12 };
  const camera = cameraAt(frame, [
    [0, WIDE],
    [T.cardClick + 30, WIDE],
    [T.arrow[0] - 10, drawCam],
    [T.blur[1] + 10, drawCam],
    [T.gradient - 20, panelCam],
    [T.corners[1] + 10, panelCam],
    [T.mockup + 10, WIDE],
  ]);

  return (
    <Desktop
      scene="annotate"
      camera={camera}
      dockHide={grow * (1 - close)}
      overlay={
        <>
          <DeskWindows />
          {!editorOn || grow < 0.05 ? (
            <QuickAccessCard x={slot.x} y={slot.y} show={cardShow} hover={hover} scale={1}>
              <DeskSnapshot region={NOTES} width={QA_W - pt(14)} height={QA_H - pt(14)} wallpaper={false} windows={["notes"]} />
            </QuickAccessCard>
          ) : null}
          {editorOn && editorOpacity > 0.002 ? (
            <div
              style={{
                position: "absolute",
                left: ex,
                top: ey,
                width: EW,
                height: EH,
                transformOrigin: "0 0",
                transform: `scale(${sx}, ${sy})`,
                opacity: editorOpacity,
                borderRadius: pt(22),
                boxShadow: "0 30px 90px rgba(0,0,40,0.5)",
              }}
            >
              <div style={{ position: "absolute", inset: 0, opacity: uiOpacity }}>
                <AnnotateEditor
                  width={EW}
                  height={EH}
                  tool={tool}
                  mode={mode}
                  showBackgroundPanel
                  selectedGradient={gradient}
                  padding={padding}
                  corners={corners}
                  shadow={40}
                  zoomLabel="72%"
                  pressed={pressed}
                  contentWidth={NOTES.w}
                  contentHeight={NOTES.h}
                  panelScroll={panelScroll}
                  overlay={
                    <>
                      {frame >= T.rect[0] ? (
                        <MarkRect x={TITLE_BOX.x} y={TITLE_BOX.y} w={TITLE_BOX.w * rectP} h={TITLE_BOX.h * rectP} progress={1} />
                      ) : null}
                      {frame >= T.counters[0] ? <Counter x={COUNTERS[0][0]} y={COUNTERS[0][1]} n={1} scale={swift(frame, fps, SNAPPY, T.counters[0])} /> : null}
                      {frame >= T.counters[1] ? <Counter x={COUNTERS[1][0]} y={COUNTERS[1][1]} n={2} scale={swift(frame, fps, SNAPPY, T.counters[1])} /> : null}
                      {frame >= T.blur[0] ? <BlurBox x={EMAIL.x} y={EMAIL.y} w={Math.max(1, EMAIL.w * blurP)} h={EMAIL.h} amount={6} /> : null}
                      {frame >= T.arrow[0] ? <CurvedArrow from={ARROW_FROM} to={ARROW_TO} bend={-0.45} progress={arrowP} width={pt(4)} /> : null}
                    </>
                  }
                >
                  <DeskSnapshot region={NOTES} width={NOTES.w} height={NOTES.h} wallpaper={false} windows={["notes"]} />
                </AnnotateEditor>
              </div>
              <div style={{ position: "absolute", inset: 0, opacity: 1 - uiOpacity, borderRadius: pt(22), overflow: "hidden", background: "#1e1f24" }}>
                <DeskSnapshot region={NOTES} width={EW} height={EH} wallpaper={false} windows={["notes"]} />
              </div>
            </div>
          ) : null}
          {frame > 100 && frame < T.done + 50 ? (
            <Cursor x={cursor.x} y={cursor.y} press={press} kind={drawing && frame < T.gradient ? "cross" : "arrow"} opacity={ease(frame, 100, 116) * (1 - ease(frame, T.done + 30, T.done + 48))} />
          ) : null}
        </>
      }
      screen={
        <>
          <Scrim amount={head} />
          <Headline title="Mark it up." sub="Arrows, boxes, steps, blur, and a background in one window." show={head} y={pt(300)} />
        </>
      }
    />
  );
};
