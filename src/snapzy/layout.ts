// Scene layout for the Snapzy video. Pure TypeScript with no Remotion import,
// so scripts/snapzy/generate-audio.ts reads the same positions.
//
// 60 fps, 120 BPM -> 1 beat = 30 frames, 1 bar = 120 frames = 2 s. Every scene
// is a whole number of bars and starts and ends on the bare desktop, so scenes
// join without a visible cut. Scenes are written at reading pace (clicks at
// least 50 frames apart, the whole screen in view before and after each
// action), so they play at rate 1.

import { ANNOTATE, CAPTURE, HISTORY, OCR, ONBOARD, VIDEO } from "./timing";

export const FPS = 60;
export const BPM = 120;
export const FRAMES_PER_BEAT = (FPS * 60) / BPM; // 30
export const FRAMES_PER_BAR = FRAMES_PER_BEAT * 4; // 120
export const WIDTH = 1920;
export const HEIGHT = 1080;

export type SceneId = "open" | "onboard" | "capture" | "ocr" | "annotate" | "video" | "history" | "outro";

const LENGTHS: readonly [SceneId, number][] = [
  ["open", 3],
  ["onboard", 7],
  ["capture", 14],
  ["ocr", 5],
  ["annotate", 10],
  ["video", 7],
  ["history", 5],
  ["outro", 5],
];

export type SceneEntry = { id: SceneId; from: number; durationInFrames: number; startBar: number; endBar: number };

export const SCENES: readonly SceneEntry[] = (() => {
  let bar = 0;
  return LENGTHS.map(([id, bars]) => {
    const e = { id, from: bar * FRAMES_PER_BAR, durationInFrames: bars * FRAMES_PER_BAR, startBar: bar, endBar: bar + bars };
    bar += bars;
    return e;
  });
})();

export const sceneById = (id: SceneId): SceneEntry => {
  const s = SCENES.find((e) => e.id === id);
  if (!s) {
    throw new Error(`Unknown scene ${id}`);
  }
  return s;
};

export const TOTAL_BARS = SCENES[SCENES.length - 1].endBar;
export const DURATION_IN_FRAMES = TOTAL_BARS * FRAMES_PER_BAR;

// ---------------------------------------------------------------------------
// Sound cues, in scene-local frames (the scene files import these too, so a
// click and its sound can never drift apart).

export type SfxName = "tap" | "shutter" | "glass" | "tick" | "chime" | "scan" | "key";

export type Cue = { at: number; sfx: SfxName; volume?: number };

const tapAll = (list: readonly number[], volume = 0.7): Cue[] => list.map((at) => ({ at, sfx: "tap", volume }));
const keysAt = (at: number, n = 3): Cue[] => Array.from({ length: n }, (_, i) => ({ at: at - 4 + i * 3, sfx: "key", volume: 0.5 }));
const shot = (at: number): Cue => ({ at, sfx: "shutter", volume: 0.8 });

const CUES: Record<SceneId, readonly Cue[]> = {
  open: [{ at: 20, sfx: "glass", volume: 0.8 }, { at: 76, sfx: "chime", volume: 0.45 }],
  onboard: [{ at: 84, sfx: "glass", volume: 0.6 }, ...tapAll(ONBOARD.taps), { at: ONBOARD.taps[4] + 14, sfx: "glass", volume: 0.6 }],
  capture: [
    ...tapAll([CAPTURE.menuTap, CAPTURE.menuClose, CAPTURE.dragStart, CAPTURE.appShot - 1, CAPTURE.activeMenuTap, CAPTURE.activeClick, CAPTURE.delayMenuTap, CAPTURE.delayClick]),
    { at: CAPTURE.menuTap + 2, sfx: "glass", volume: 0.5 },
    { at: CAPTURE.activeMenuTap + 2, sfx: "glass", volume: 0.4 },
    { at: CAPTURE.delayMenuTap + 2, sfx: "glass", volume: 0.4 },
    ...keysAt(CAPTURE.areaKeys),
    ...keysAt(CAPTURE.appKeys),
    ...keysAt(CAPTURE.appA, 1),
    ...keysAt(CAPTURE.fullKeys),
    ...CAPTURE.count.map((at): Cue => ({ at, sfx: "tick", volume: 0.6 })),
    ...[CAPTURE.areaShot, CAPTURE.appShot, CAPTURE.fullShot, CAPTURE.activeShot, CAPTURE.delayShot].map(shot),
  ],
  ocr: [
    ...keysAt(OCR.keys),
    { at: OCR.dragStart, sfx: "tap", volume: 0.6 },
    { at: OCR.scan, sfx: "scan", volume: 0.7 },
    { at: OCR.copied, sfx: "chime", volume: 0.5 },
  ],
  annotate: [
    { at: ANNOTATE.cardIn, sfx: "glass", volume: 0.4 },
    ...tapAll([
      ANNOTATE.cardClick,
      ANNOTATE.toolArrow,
      ANNOTATE.toolRect,
      ANNOTATE.toolCounter,
      ...ANNOTATE.counters,
      ANNOTATE.toolBlur,
      ANNOTATE.gradient,
      ANNOTATE.mockup,
      ANNOTATE.done,
    ]),
    { at: ANNOTATE.cardClick + 4, sfx: "glass", volume: 0.6 },
    { at: ANNOTATE.mockup + 4, sfx: "glass", volume: 0.4 },
    { at: ANNOTATE.done + 8, sfx: "chime", volume: 0.45 },
  ],
  video: [
    { at: VIDEO.open, sfx: "glass", volume: 0.5 },
    ...tapAll([VIDEO.trimStart[0], VIDEO.trimEnd[0], VIDEO.addZoom, VIDEO.play, VIDEO.convert]),
    { at: VIDEO.exported, sfx: "chime", volume: 0.5 },
    { at: VIDEO.close, sfx: "glass", volume: 0.4 },
  ],
  history: [
    ...tapAll([HISTORY.menuTap, HISTORY.open, HISTORY.tabScreens, HISTORY.range7d, HISTORY.restore]),
    { at: HISTORY.menuTap + 2, sfx: "glass", volume: 0.4 },
    { at: HISTORY.open + 4, sfx: "glass", volume: 0.6 },
    { at: HISTORY.close, sfx: "glass", volume: 0.5 },
  ],
  outro: [{ at: 30, sfx: "glass", volume: 0.6 }, { at: 62, sfx: "chime", volume: 0.45 }],
};

/** Every cue on the video's absolute timeline. */
export const SFX_CUES: readonly (Cue & { frame: number })[] = SCENES.flatMap((s) =>
  CUES[s.id].map((c) => ({ ...c, frame: s.from + c.at })),
).sort((a, b) => a.frame - b.frame);
