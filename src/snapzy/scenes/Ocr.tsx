import type React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { NOTE_LINES } from "../content/Apps";
import { DeskWindows, noteLine, type Rect } from "../content/Desk";
import { Cursor } from "../desktop/Cursor";
import { cameraAt, Desktop, WIDE } from "../desktop/Desktop";
import { KeyCaps } from "../desktop/KeyCaps";
import { Glass } from "../glass/Glass";
import { ease, pathAt, pressAt, SMOOTH, SNAPPY, swift, swiftInOut } from "../motion";
import { FONT_TEXT, pt } from "../theme";
import { OCR as T } from "../timing";
import { Dim, SizeBadge } from "../ui/CaptureFx";
import { Headline } from "../ui/Headline";
import { Scrim } from "../ui/Scrim";

// OCR (5 bars). ⇧⌘2, drag over three lines of the note, a light sweeps the
// selection and each line is picked out, then the text lands on a glass card:
// "Copied to clipboard". Recognition runs on the Mac (Apple Vision).

const L0 = noteLine(0);
const L2 = noteLine(2);
const SEL: Rect = { x: L0.x - pt(8), y: L0.y - pt(6), w: L0.w + pt(16), h: L2.y + L2.h - L0.y + pt(12) };

export const Ocr: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const head = swift(frame, fps, SMOOTH, 2) - swift(frame, fps, SMOOTH, 70);
  const keyShow = swiftInOut(frame, fps, T.keys - 8, T.keys + 70, SNAPPY);

  const dim = ease(frame, T.keys + 8, T.keys + 22) * (1 - ease(frame, T.copied, T.copied + 14));
  const drag = ease(frame, T.dragStart, T.dragEnd);
  const sel: Rect | null =
    frame >= T.dragStart && frame < T.copied + 14 ? { x: SEL.x, y: SEL.y, w: Math.max(1, SEL.w * drag), h: Math.max(1, SEL.h * drag) } : null;

  const sweep = ease(frame, T.scan, T.scan + 64);
  const sweepOn = frame >= T.scan && frame < T.scan + 70;

  const card = swiftInOut(frame, fps, T.copied, T.away, SNAPPY);
  const cardW = pt(560);
  const cardH = pt(196);

  const cursor = pathAt(frame, [
    [0, 1250, 760],
    [T.keys + 20, SEL.x, SEL.y],
    [T.dragStart, SEL.x, SEL.y],
    [T.dragEnd, SEL.x + SEL.w, SEL.y + SEL.h],
    [T.copied + 40, SEL.x + SEL.w + 120, SEL.y + SEL.h + 160],
  ]);
  const cross = frame >= T.keys + 10 && frame < T.copied;

  const camera = cameraAt(frame, [
    [0, WIDE],
    [T.keys + 20, WIDE],
    [T.dragStart, { x: SEL.x + SEL.w / 2, y: SEL.y + SEL.h / 2 + 60, scale: 1.45 }],
    [T.copied + 10, { x: SEL.x + SEL.w / 2, y: SEL.y + SEL.h / 2 + 60, scale: 1.45 }],
    [T.copied + 60, WIDE],
  ]);

  return (
    <Desktop
      scene="ocr"
      camera={camera}
      overlay={
        <>
          <DeskWindows />
          <Dim amount={dim} hole={sel} />
          {sel && frame < T.scan ? <SizeBadge rect={sel} /> : null}
          {T.lines.map((at, i) => {
            const r = noteLine(i);
            const on = ease(frame, at, at + 8) * (1 - ease(frame, T.copied, T.copied + 12));
            return on > 0.01 ? (
              <div
                key={at}
                style={{
                  position: "absolute",
                  left: r.x,
                  top: r.y,
                  width: r.w,
                  height: r.h - pt(4),
                  borderRadius: pt(5),
                  background: `rgba(30,120,255,${0.2 * on})`,
                  boxShadow: `inset 0 0 0 ${pt(1.5)}px rgba(30,120,255,${0.85 * on})`,
                }}
              />
            ) : null;
          })}
          {sweepOn ? (
            <div
              style={{
                position: "absolute",
                left: SEL.x + SEL.w * sweep - pt(30),
                top: SEL.y,
                width: pt(60),
                height: SEL.h,
                background: "linear-gradient(90deg, transparent, rgba(160,200,255,0.55), rgba(255,255,255,0.9) 50%, rgba(160,200,255,0.55), transparent)",
                filter: "blur(2px)",
                opacity: Math.sin(sweep * Math.PI),
              }}
            />
          ) : null}
          {frame > 60 ? (
            <Cursor x={cursor.x} y={cursor.y} kind={cross ? "cross" : "arrow"} press={pressAt(frame, T.dragStart)} opacity={ease(frame, 60, 76)} />
          ) : null}
        </>
      }
      screen={
        <>
          <Scrim amount={head} />
          <Headline title="Grab the text." sub="On-device text recognition with Apple Vision." show={head} y={pt(300)} />
          <KeyCaps keys={["⇧", "⌘", "2"]} show={keyShow} press={pressAt(frame, T.keys)} label="Capture Text (OCR)" />
          {card > 0.002 ? (
            <Glass
              width={cardW}
              height={cardH}
              radius={pt(26)}
              refraction={30}
              bevel={26}
              tint={0.1}
              shade={0.45}
              blur={20}
              style={{
                left: 960 - cardW / 2,
                top: 1080 - pt(110) - cardH + (1 - card) * pt(40),
                opacity: Math.min(1, card * 1.3),
                transform: `scale(${0.92 + 0.08 * card})`,
              }}
            >
              <div style={{ position: "absolute", inset: pt(18), fontFamily: FONT_TEXT, color: "white" }}>
                <div style={{ display: "flex", alignItems: "center", gap: pt(8), fontSize: pt(16), fontWeight: 600 }}>
                  <div
                    style={{
                      width: pt(18),
                      height: pt(18),
                      borderRadius: pt(9),
                      background: "#34c759",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width={pt(10)} height={pt(10)} viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth={1.8} strokeLinecap="round">
                      <path d="M2 5.2 4.2 7.4 8 2.8" />
                    </svg>
                  </div>
                  Copied to clipboard
                </div>
                <div style={{ marginTop: pt(14), fontSize: pt(15.5), lineHeight: 1.5, color: "rgba(255,255,255,0.92)" }}>
                  {NOTE_LINES.slice(0, 3).map((l, i) => (
                    <div key={l} style={{ opacity: ease(frame, T.copied + 8 + i * 8, T.copied + 20 + i * 8) }}>
                      {l}
                    </div>
                  ))}
                </div>
              </div>
            </Glass>
          ) : null}
        </>
      }
    />
  );
};
