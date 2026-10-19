// Scene layout for the MC-Vector promo (v5). Pure TypeScript with no Remotion
// import, so scripts/generate-audio.ts can read the same bar positions.
//
// 60 fps, 120 BPM -> 1 beat = 30 frames, 1 bar (4/4) = 120 frames = 2 s.
//
// Every scene keeps its own (inner) timing. A beat plays its scene through one
// or more Sequence segments, each with its own playbackRate, so a scene can run
// slowly where clicks are close together and rest on the whole window at the
// start and the end. `segments` maps the scene's clock to the timeline.

export const FPS = 60;
export const BPM = 120;
export const BEATS_PER_BAR = 4;
export const FRAMES_PER_BEAT = (FPS * 60) / BPM; // 30
export const FRAMES_PER_BAR = FRAMES_PER_BEAT * BEATS_PER_BAR; // 120

export const WIDTH = 1920;
export const HEIGHT = 1080;

/** Convert a bar position (may be fractional) into an absolute frame. */
export const bar = (n: number): number => Math.round(n * FRAMES_PER_BAR);

/** Convert a beat count (may be fractional) into frames. */
export const beat = (n: number): number => Math.round(n * FRAMES_PER_BEAT);

/**
 * title: a "Create." card on butter. op: the app window on the clay stage.
 * speed: the rocket scene (size / startup). security: the table scene.
 */
export type BeatKind = "title" | "op" | "hook" | "outro" | "speed" | "security";

export type BeatId =
  | "hook"
  | "name"
  | "speed"
  | "title1"
  | "op1"
  | "title2"
  | "op2"
  | "title3"
  | "op3"
  | "title4"
  | "op4"
  | "title5"
  | "op5"
  | "security"
  | "outro";

/** One stretch of a scene played at a constant speed. */
export type WarpSegment = {
  /** Absolute frame where the segment starts on the timeline. */
  from: number;
  /** Length on the timeline. */
  duration: number;
  /** Scene (inner) frame at the segment start. */
  innerFrom: number;
  /** Inner frames per timeline frame (< 1 = slowed down). */
  rate: number;
};

export type BeatEntry = {
  id: BeatId;
  kind: BeatKind;
  /** First bar (inclusive). */
  startBar: number;
  /** Last bar (exclusive). */
  endBar: number;
  /** First frame (inclusive, absolute). */
  from: number;
  /** Frame after the beat ends (exclusive, absolute). */
  to: number;
  /** Length on the timeline. */
  durationInFrames: number;
  /** Length of the scene on its own (inner) clock. */
  innerDurationInFrames: number;
  /** How the scene's clock maps onto the timeline, in order. */
  segments: readonly WarpSegment[];
  /** Feature index 1..5 for title / op pairs, null for the other beats. */
  section: number | null;
};

/** Timeline frame of a scene-local (inner clock) frame. */
export const beatFrame = (b: BeatEntry, local: number): number => {
  for (let i = b.segments.length - 1; i >= 0; i--) {
    const s = b.segments[i];
    if (local >= s.innerFrom) {
      return s.from + Math.round((local - s.innerFrom) / s.rate);
    }
  }
  return b.from;
};

// ---------------------------------------------------------------------------
// Operation scenes: slow where clicks are close, rest on the whole window
// ---------------------------------------------------------------------------

/** Scene frames of the cursor clicks (taps) and the "done" moments (chimes), taken from src/ops/. */
type OpSpec = {
  taps: readonly number[];
  chimes: readonly number[];
  /** Scene frame where the camera is back on the whole window for good. */
  wideAt: number;
};

export const OP_SPECS: Record<"op1" | "op2" | "op3" | "op4" | "op5", OpSpec> = {
  // Add Server, Paper, 1.21.10, Create
  op1: { taps: [88, 154, 180, 232], chimes: [300], wideAt: 380 },
  // Start, Accept and start, Dashboard tab
  op2: { taps: [80, 142, 238], chimes: [200], wideAt: 376 },
  // Plugins tab, search field, Install, Yes install both, Installed tab
  op3: { taps: [72, 122, 202, 244, 262], chimes: [288], wideAt: 350 },
  // Backups tab, Create Backup, separate window, Apply, Create
  op4: { taps: [70, 108, 126, 168, 190], chimes: [272], wideAt: 358 },
  // General Settings tab, ngrok toggle, Copy
  op5: { taps: [70, 104, 252], chimes: [196], wideAt: 358 },
};

/** Speed of the stretches between clicks (inner frames per timeline frame). */
export const BASE_RATE = 0.65;
/** Two events are never closer than this on the timeline (0.85 s). */
export const MIN_GAP = 50;
/** The window slides in (and out) at this speed. */
export const EDGE_RATE = 0.5;
/** Scene frame where the window has landed (Stage enterFrames). */
export const ENTER_END = 44;
/** Frames the whole window rests in view before the first move / after the last. */
export const HOLD_START = 80;
export const HOLD_END = 90;
/** Rest = almost stopped (Sequence playbackRate must be above 0). */
export const HOLD_RATE = 0.02;
/** Stage exitFrames default: the window slides out over this many scene frames. */
export const EXIT_FRAMES = 36;

type Plan = { segments: WarpSegment[]; inner: number; duration: number };

const planOp = (spec: OpSpec, start: number): Plan => {
  const segments: WarpSegment[] = [];
  let t = start;
  let inner = 0;
  const add = (duration: number, rate: number): void => {
    segments.push({ from: t, duration, innerFrom: inner, rate });
    t += duration;
    inner += duration * rate;
  };

  // Slide in, then rest on the whole window.
  add(Math.round(ENTER_END / EDGE_RATE), EDGE_RATE);
  add(HOLD_START, HOLD_RATE);

  // Each stretch between events takes at least MIN_GAP on the timeline.
  const events = [...spec.taps, ...spec.chimes].sort((a, b) => a - b).filter((f) => f > inner + 1);
  for (const f of [...events, spec.wideAt]) {
    const gap = f - inner;
    if (gap <= 0) {
      continue;
    }
    const duration = Math.round(Math.max(gap / BASE_RATE, MIN_GAP));
    add(duration, gap / duration);
  }

  // Rest on the whole window again, then slide out. The rest is stretched so the
  // scene ends on a whole bar.
  const exitDuration = Math.round(EXIT_FRAMES / EDGE_RATE);
  const total = t - start + HOLD_END + exitDuration;
  const padded = Math.ceil(total / FRAMES_PER_BAR) * FRAMES_PER_BAR;
  add(HOLD_END + (padded - total), HOLD_RATE);
  add(exitDuration, EXIT_FRAMES / exitDuration);

  return { segments, inner: Math.round(inner), duration: padded };
};

// ---------------------------------------------------------------------------
// Scene table
// ---------------------------------------------------------------------------

const TITLE_RATE = 2 / 3; // 1 bar of scene over 1.5 bars

const buildBeats = (): BeatEntry[] => {
  const list: BeatEntry[] = [];
  let cursor = 0;

  const push = (
    id: BeatId,
    kind: BeatKind,
    section: number | null,
    plan: Plan,
  ): void => {
    list.push({
      id,
      kind,
      startBar: cursor / FRAMES_PER_BAR,
      endBar: (cursor + plan.duration) / FRAMES_PER_BAR,
      from: cursor,
      to: cursor + plan.duration,
      durationInFrames: plan.duration,
      innerDurationInFrames: plan.inner,
      segments: plan.segments,
      section,
    });
    cursor += plan.duration;
  };

  /** A scene played at one speed for a whole number of half bars. */
  const steady = (id: BeatId, kind: BeatKind, bars: number, rate = 1, section: number | null = null): void => {
    const duration = bar(bars);
    push(id, kind, section, {
      segments: [{ from: cursor, duration, innerFrom: 0, rate }],
      inner: Math.round(duration * rate),
      duration,
    });
  };

  const op = (id: keyof typeof OP_SPECS, section: number): void => {
    push(id, "op", section, planOp(OP_SPECS[id], cursor));
  };

  steady("hook", "hook", 2.5, 4 / 5);
  steady("name", "hook", 2.5, 4 / 5);
  steady("speed", "speed", 5);
  steady("title1", "title", 1.5, TITLE_RATE, 1); // Create.
  op("op1", 1);
  steady("title2", "title", 1.5, TITLE_RATE, 2); // Run.
  op("op2", 2);
  steady("title3", "title", 1.5, TITLE_RATE, 3); // Extend.
  op("op3", 3);
  steady("title4", "title", 1.5, TITLE_RATE, 4); // Back up.
  op("op4", 4);
  steady("title5", "title", 1.5, TITLE_RATE, 5); // Share.
  op("op5", 5);
  steady("security", "security", 5);
  steady("outro", "outro", 4.5, 8 / 9);
  return list;
};

export const BEATS: readonly BeatEntry[] = buildBeats();

export const beatById = (id: BeatId): BeatEntry => {
  const found = BEATS.find((b) => b.id === id);
  if (!found) {
    throw new Error(`Unknown beat: ${id}`);
  }
  return found;
};

/** Bar positions the music is arranged around (scripts/generate-audio.ts reads these). */
export const SECURITY_START_BAR = beatById("security").startBar;
export const OUTRO_START_BAR = beatById("outro").startBar;
export const FEATURES_START_BAR = beatById("title1").startBar;

export const TOTAL_BARS = BEATS[BEATS.length - 1].endBar;
export const DURATION_IN_FRAMES = bar(TOTAL_BARS);
