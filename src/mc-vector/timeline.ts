// Global timing for the MC-Vector promo (v5). The scene table, segments and
// bar positions live in ./layout (pure TypeScript, shared with the audio
// script); this file adds the stage level and the sound cues.

import { Easing, interpolate } from "remotion";
import { BEATS, OP_SPECS, beatById, beatFrame } from "./layout";

export * from "./layout";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------------------------------------------------------------------------
// Stage level: butter (title scenes) <-> clay (operation scenes)
// ---------------------------------------------------------------------------

/** Frames before / after an op boundary over which the background color turns. */
export const STAGE_TURN_LEAD = 24;
export const STAGE_TURN_TAIL = 72;

const stageEase = Easing.bezier(0.45, 0, 0.55, 1);

/**
 * 0 = title scene (butter background), 1 = operation scene (clay background).
 * Turns smoothly around every op boundary: it starts STAGE_TURN_LEAD frames
 * before an op begins and finishes STAGE_TURN_TAIL frames in (while the
 * window slides in); the reverse happens around the op's end.
 * Pass an absolute composition frame.
 */
export const stageLevelAt = (frame: number): number => {
  let level = 0;
  for (const b of BEATS) {
    if (b.kind !== "op") {
      continue;
    }
    const v = interpolate(
      frame,
      [b.from - STAGE_TURN_LEAD, b.from + STAGE_TURN_TAIL, b.to - STAGE_TURN_TAIL, b.to + STAGE_TURN_LEAD],
      [0, 1, 1, 0],
      { ...clamp, easing: stageEase },
    );
    level = Math.max(level, v);
  }
  return level;
};

// ---------------------------------------------------------------------------
// Sound cues (v3: few, quiet, soft). Files live in public/mc-vector/audio/sfx-<name>.wav
// and are synthesized by scripts/generate-audio.ts.
// ---------------------------------------------------------------------------

/**
 * tap: rounded short click. chime: soft completion. pen: pen on paper (quiet).
 * page: soft paper swish (window in / out).
 */
export type SfxName =
  | "tap"
  | "chime"
  | "pen"
  | "page"
  | "countdown"
  | "ignite"
  | "rocket"
  | "boom"
  | "row";

export type SfxCue = {
  /** Absolute frame in the composition. */
  frame: number;
  sfx: SfxName;
  /** 0..1, default 1. */
  volume?: number;
  note?: string;
};

/** Default levels: SFX stay well under the BGM. */
const SFX_VOLUME = {
  pen: 0.24,
  tap: 0.28,
  page: 0.32,
  chime: 0.4,
} as const;

/** Hook checklist: nine items written one after another (scene-local frames). */
const HOOK_ITEMS = 9;
const HOOK_FIRST_ITEM = 30;
const HOOK_ITEM_GAP = 20;

/**
 * Speed scene key frames (scene-local, rate 1, 600 frames). SpeedScene and the
 * sound cues both read these.
 */
export const SPEED_CUES = {
  /** "this small." note appears. */
  note: 20,
  /** 3, 2, 1. */
  countdown: [60, 90, 120],
  ignite: 150,
  /** Rocket reaches space; the burst starts. */
  burst: 390,
  /** "about 30 MB" lands. */
  sizeText: 440,
  /** "opens in about X s" lands. */
  timeText: 510,
  /** Scene fades back to butter from here. */
  leave: 570,
} as const;

/**
 * Security scene key frames (scene-local, rate 1, 600 frames). Each row's
 * Protection label starts at rows[i]; its "Why" column lands at rows[i] + 52.
 */
export const SECURITY_CUES = {
  /** Heading is written. */
  heading: 10,
  /** Table frame is drawn. */
  frame: 80,
  rows: [130, 210, 290, 370, 450],
  /** Rust · Tauri circle. */
  outro: 540,
} as const;

const buildSfxCues = (): SfxCue[] => {
  const cues: SfxCue[] = [];
  const add = (frame: number, sfx: SfxName, volume: number, note: string): void => {
    cues.push({ frame, sfx, volume, note });
  };

  const hook = beatById("hook");
  for (let i = 0; i < HOOK_ITEMS; i++) {
    add(beatFrame(hook, HOOK_FIRST_ITEM + i * HOOK_ITEM_GAP), "pen", 0.2, `hook item ${i + 1}`);
  }
  // A little after the last item finishes writing.
  add(beatFrame(hook, HOOK_FIRST_ITEM + HOOK_ITEMS * HOOK_ITEM_GAP + 5), "chime", 0.28, "hook checklist done");

  const name = beatById("name");
  add(beatFrame(name, 30), "pen", SFX_VOLUME.pen, "name circle");
  add(beatFrame(name, 100), "page", 0.28, "name window frame");
  add(beatFrame(name, 150), "chime", SFX_VOLUME.chime, "name icon");

  const speed = beatById("speed");
  add(speed.from + SPEED_CUES.note, "pen", SFX_VOLUME.pen, "speed note");
  SPEED_CUES.countdown.forEach((f, i) => add(speed.from + f, "countdown", 0.34, `countdown ${3 - i}`));
  add(speed.from + SPEED_CUES.ignite, "ignite", 0.5, "ignite");
  add(speed.from + SPEED_CUES.ignite + 10, "rocket", 0.34, "rocket climb");
  add(speed.from + SPEED_CUES.burst, "boom", 0.55, "burst");
  add(speed.from + SPEED_CUES.sizeText, "chime", 0.4, "size text");
  add(speed.from + SPEED_CUES.timeText, "chime", 0.4, "startup text");

  for (const b of BEATS) {
    if (b.kind === "title") {
      add(b.from, "page", SFX_VOLUME.page, `${b.id} window out`);
      add(beatFrame(b, 4), "pen", SFX_VOLUME.pen, `${b.id} heading`);
      add(beatFrame(b, 38), "tap", 0.22, `${b.id} description`);
    } else if (b.kind === "op") {
      add(b.from, "page", SFX_VOLUME.page, `${b.id} window in`);
      const cue = OP_SPECS[b.id as keyof typeof OP_SPECS];
      cue?.taps.forEach((offset, k) => add(beatFrame(b, offset), "tap", SFX_VOLUME.tap, `${b.id} click ${k + 1}`));
      cue?.chimes.forEach((offset, k) => add(beatFrame(b, offset), "chime", 0.36, `${b.id} done ${k + 1}`));
    }
  }

  const security = beatById("security");
  add(security.from + SECURITY_CUES.heading, "pen", SFX_VOLUME.pen, "security heading");
  add(security.from + SECURITY_CUES.frame, "page", 0.28, "security table frame");
  SECURITY_CUES.rows.forEach((f, i) => {
    add(security.from + f, "row", 0.3, `security row ${i + 1}`);
    add(security.from + f + 52, "tap", 0.22, `security row ${i + 1} why`);
  });
  add(security.from + SECURITY_CUES.outro, "chime", 0.34, "security rust circle");

  const outro = beatById("outro");
  add(beatFrame(outro, 10), "pen", 0.28, "outro tagline");
  add(beatFrame(outro, 90), "chime", 0.42, "outro icon");
  add(beatFrame(outro, 180), "tap", SFX_VOLUME.tap, "outro command");

  return cues.sort((a, b) => a.frame - b.frame);
};

/** Every SFX cue, sorted by frame. Soundtrack.tsx plays each one in a Sequence. */
export const SFX_CUES: readonly SfxCue[] = buildSfxCues();
