// Time warp shared by the videos. Pure TypeScript with no Remotion import, so
// the audio scripts can read the same positions as the video.
//
// Every scene keeps its own (inner) timing. A scene is played through one or
// more Sequence segments, each with its own playbackRate, so it can run slowly
// where clicks are close together and rest on the whole window at the start
// and the end. `segments` maps the scene's clock to the timeline.

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

/** How one scene is laid out on the timeline. */
export type WarpPlan = {
  segments: WarpSegment[];
  /** Length of the scene on its own (inner) clock. */
  inner: number;
  /** Length on the timeline. */
  duration: number;
};

/** Anything placed on the timeline through warp segments. */
export type Warped = {
  from: number;
  segments: readonly WarpSegment[];
};

/** Timeline frame of a scene-local (inner clock) frame. */
export const warpFrame = (w: Warped, local: number): number => {
  for (let i = w.segments.length - 1; i >= 0; i--) {
    const s = w.segments[i];
    if (local >= s.innerFrom) {
      return s.from + Math.round((local - s.innerFrom) / s.rate);
    }
  }
  return w.from;
};

/** A scene played at one speed. */
export const planSteady = (start: number, duration: number, rate = 1): WarpPlan => ({
  segments: [{ from: start, duration, innerFrom: 0, rate }],
  inner: Math.round(duration * rate),
  duration,
});

/** Scene frames of the cursor clicks (taps) and the "done" moments (chimes). */
export type OpSpec = {
  taps: readonly number[];
  chimes: readonly number[];
  /** Scene frame where the camera is back on the whole window for good. */
  wideAt: number;
};

export type OpPacing = {
  /** Speed of the stretches between clicks (inner frames per timeline frame). */
  baseRate: number;
  /** Two events are never closer than this on the timeline. */
  minGap: number;
  /** The window slides in (and out) at this speed. */
  edgeRate: number;
  /** Scene frame where the window has landed. */
  enterEnd: number;
  /** Frames the whole window rests in view before the first move / after the last. */
  holdStart: number;
  holdEnd: number;
  /** Rest = almost stopped (Sequence playbackRate must be above 0). */
  holdRate: number;
  /** The window slides out over this many scene frames. */
  exitFrames: number;
  /** The scene is padded to a whole number of these frames (one bar). */
  padTo: number;
};

/** Slow where clicks are close, rest on the whole window at both ends. */
export const planOp = (spec: OpSpec, start: number, p: OpPacing): WarpPlan => {
  const segments: WarpSegment[] = [];
  let t = start;
  let inner = 0;
  const add = (duration: number, rate: number): void => {
    segments.push({ from: t, duration, innerFrom: inner, rate });
    t += duration;
    inner += duration * rate;
  };

  // Slide in, then rest on the whole window.
  add(Math.round(p.enterEnd / p.edgeRate), p.edgeRate);
  add(p.holdStart, p.holdRate);

  // Each stretch between events takes at least minGap on the timeline.
  const events = [...spec.taps, ...spec.chimes].sort((a, b) => a - b).filter((f) => f > inner + 1);
  for (const f of [...events, spec.wideAt]) {
    const gap = f - inner;
    if (gap <= 0) {
      continue;
    }
    const duration = Math.round(Math.max(gap / p.baseRate, p.minGap));
    add(duration, gap / duration);
  }

  // Rest on the whole window again, then slide out. The rest is stretched so the
  // scene ends on a whole bar.
  const exitDuration = Math.round(p.exitFrames / p.edgeRate);
  const total = t - start + p.holdEnd + exitDuration;
  const padded = Math.ceil(total / p.padTo) * p.padTo;
  add(p.holdEnd + (padded - total), p.holdRate);
  add(exitDuration, p.exitFrames / exitDuration);

  return { segments, inner: Math.round(inner), duration: padded };
};
