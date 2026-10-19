import type React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Cursor } from "../desktop/Cursor";
import { cameraAt, Desktop, WIDE } from "../desktop/Desktop";
import { SNAPZY_ITEM_X } from "../desktop/MenuBar";
import { ease, keys, mix, pressAt, SMOOTH, SNAPPY, swift } from "../motion";
import { pt } from "../theme";
import { ONBOARD } from "../timing";
import { Headline } from "../ui/Headline";
import { OB_CONTINUE, OB_H, OB_START, OB_W, Onboarding } from "../ui/Onboarding";

// Onboarding (7 bars). A headline, then the onboarding window springs open and
// walks through its four steps (the cursor clicks Continue each time), lands on
// "You're All Set!", and on "Start Using Snapzy" the window shrinks into the
// Snapzy item in the menu bar.

const OB_TAPS = ONBOARD.taps;
const [TAP1, TAP2, TAP3, TAP4, TAP_START] = OB_TAPS;

const WIN_X = (1920 - OB_W) / 2;
const WIN_Y = 1080 / 2 - OB_H / 2 + pt(6);

export const Onboard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const head = swift(frame, fps, SMOOTH, 4) - swift(frame, fps, SMOOTH, 70);
  const open = swift(frame, fps, SNAPPY, 84);

  // Step and the slide-in of its content.
  const stepStarts = [96, TAP1 + 10, TAP2 + 10, TAP3 + 10, TAP4 + 12];
  let step = 0;
  for (let i = 0; i < stepStarts.length; i++) {
    if (frame >= stepStarts[i]) step = i;
  }
  const enter = swift(frame, fps, SNAPPY, stepStarts[step]);
  const checks = frame < 140 ? 0 : frame < 172 ? 1 : frame < 204 ? 2 : 3;
  const cards = ease(frame, stepStarts[4] + 14, stepStarts[4] + 74);

  // Shrink into the menu bar item after "Start Using Snapzy".
  const away = swift(frame, fps, SNAPPY, TAP_START + 12);
  const winScale = mix(0.94 + 0.06 * open, 0.02, away);
  const cx = mix(WIN_X + OB_W / 2, SNAPZY_ITEM_X, away);
  const cy = mix(WIN_Y + OB_H / 2, pt(12), away);
  const itemFlash = interpolate(frame, [TAP_START + 30, TAP_START + 40, TAP_START + 70], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cont = { x: WIN_X + OB_CONTINUE.x, y: WIN_Y + OB_CONTINUE.y };
  const start = { x: WIN_X + OB_START.x, y: WIN_Y + OB_START.y };
  const path: readonly (readonly [number, number, number])[] = [
    [0, 1500, 900],
    [150, 1500, 900],
    [TAP1 - 4, cont.x, cont.y],
    [TAP2 - 4, cont.x, cont.y],
    [TAP4 + 40, cont.x, cont.y],
    [TAP_START - 4, start.x, start.y],
    [TAP_START + 60, start.x + 120, start.y + 60],
  ];
  const cursorX = keys(frame, path.map(([f, x]) => [f, x] as const));
  const cursorY = keys(frame, path.map(([f, , y]) => [f, y] as const));
  const press = OB_TAPS.reduce((p, t) => Math.max(p, pressAt(frame, t)), 0);
  const pressedBtn = frame >= TAP_START - 3 && frame < TAP_START + 8 ? "start" : press > 0.1 ? "continue" : null;

  const camera = cameraAt(frame, [
    [0, WIDE],
    [100, WIDE],
    [190, { x: 960, y: WIN_Y + OB_H / 2, scale: 1.22 }],
    [620, { x: 960, y: WIN_Y + OB_H / 2, scale: 1.22 }],
    [TAP_START - 20, WIDE],
  ]);

  return (
    <Desktop
      scene="onboard"
      camera={camera}
      snapzyActive={itemFlash}
      overlay={
        <>
          {open > 0.002 && away < 0.98 ? (
            <div
              style={{
                position: "absolute",
                left: cx - OB_W / 2,
                top: cy - OB_H / 2,
                width: OB_W,
                height: OB_H,
                transform: `scale(${winScale})`,
                opacity: Math.min(1, open * 1.4) * (1 - ease(frame, TAP_START + 30, TAP_START + 48)),
                boxShadow: "0 30px 80px rgba(0,0,40,0.45)",
                borderRadius: pt(22),
              }}
            >
              <Onboarding step={step} enter={enter} checks={checks} cards={cards} pressed={pressedBtn} />
            </div>
          ) : null}
          {frame > 120 && frame < TAP_START + 60 ? (
            <Cursor x={cursorX} y={cursorY} press={press} opacity={ease(frame, 120, 140) * (1 - ease(frame, TAP_START + 40, TAP_START + 58))} />
          ) : null}
        </>
      }
      screen={<Headline title="Set up in a few steps." show={head} y={pt(330)} />}
    />
  );
};
