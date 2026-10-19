// Synthesizes the promo soundtrack (BGM + SFX) from scratch. No external samples.
// Run: bun run generate:audio
//
// Output (48 kHz, stereo, 16-bit PCM):
//   public/mc-vector/audio/bgm.wav           as long as the video (src/mc-vector/layout.ts), 120 BPM, C major, soft half-time groove
//   public/mc-vector/audio/sfx-*.wav         tap / chime / pen / page
//                                  + countdown / ignite / rocket / boom / row (rocket and table scenes)
//
// The BGM follows the scene layout in src/mc-vector/layout.ts: hook, name, speed (rocket),
// features, security (table), outro. Drums are soft: a rounded kick, a brush-like
// snap and closed hats. Felt piano, a soft pad and a thin round bass carry the tune.
// No risers, impacts, drops or claps.
//
// The BGM goes through a gain stage and a look-ahead limiter, measured with
// ffmpeg loudnorm and adjusted to about -14 LUFS integrated with true peak
// <= -1.5 dBTP (Remotion plays it at volume 0.9; with the SFX the final mix is about -15).

import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { FEATURES_START_BAR, OUTRO_START_BAR, SECURITY_START_BAR, TOTAL_BARS } from "../../src/mc-vector/layout";
import {
  Biquad,
  createInstruments,
  type KickOpts,
  makeStereo,
  mulberry32,
  normalizePeak,
  panGains,
  reverb,
  rmsOf,
  SR,
  type Stereo,
  writeMastered,
  writeWav,
} from "../shared/dsp";

const OUT_DIR = fileURLToPath(new URL("../../public/mc-vector/audio/", import.meta.url));

const BPM = 120;
const BEAT = 60 / BPM; // 0.5 s
const BAR = BEAT * 4; // 2 s
// Bar positions come from the video's own layout (src/mc-vector/layout.ts), so the music
// always ends and changes where the scenes do.
const DURATION = TOTAL_BARS * BAR;
/** Drums drop out and the music rings out over the last two bars. */
const RING_BAR = TOTAL_BARS - 2;
const LAST_BAR = TOTAL_BARS - 1;
const TARGET_LUFS = -14;
const TARGET_TP = -1.5;

const rand = mulberry32(0x6d63766);
const { noise, humanize, renderPiano, renderPad, renderBass, renderSoftKick, renderHat, renderSnap } =
  createInstruments(rand);

// ---------------------------------------------------------------------------
// BGM
//
// Arrangement (bars of 2 s; section edges come from src/mc-vector/layout.ts, bar numbers
// below are for the current layout of 64 bars = 128 s):
//   bars  0 - 2.5    hook       sparse piano, soft pad, closed hats (quiet)
//   bars  2.5 - 5    name       pad + bass + piano quarter notes; kick on beat 1 of bar 4 only
//   bars  5 - 10     speed      rocket scene (scene frames 60-150 = bars 5.5-6.25):
//                               hats; snap roll over bars 5.5-6 (8ths -> 16ths, crescendo);
//                               one silent beat (bar 6.0-6.25); ascent bars 6.25-8.25
//                               (kick on every beat, 16th hats, snap on 2 and 4, rising bass pulse);
//                               one silent beat at the burst (bar 8.25); bright chord; groove
//   bars  8.5 - security start
//                    features   half-time groove: kick on 1 and 3, snap on 2 and 4, 8th hats;
//                               ghost kick on the & of beat 3 every 8 bars from the first feature bar
//   security         table scene: hats, snap, kick on beat 1 only; piano a bit louder
//   outro start - 2 bars before the end
//                    outro      groove returns
//   last 2 bars      ring out   drums drop out; piano arpeggio, rolled C, pad rings out, tail decays
//
// Harmony: Cmaj7 -> Am7 -> Fmaj7 -> G6, two bars each (8-bar cycle), C major.
// The last two bars rest on C (the cycle would put G there).

type Chord = {
  name: string;
  bass: number;
  /** Pad voicing (E3 is common to all four, so the pad barely moves). */
  pad: readonly number[];
  /** Piano pool: low root, then four notes upward. */
  piano: readonly number[];
  /** Melody: note on beat 1 of the first bar, note on beat 3 of the second bar. */
  melody: readonly [number, number];
};

const CHORDS: Record<"C" | "Am" | "F" | "G", Chord> = {
  C: { name: "Cmaj7", bass: 36, pad: [52, 55, 59, 64], piano: [48, 59, 64, 67, 71], melody: [76, 74] },
  Am: { name: "Am7", bass: 33, pad: [52, 55, 57, 60], piano: [45, 60, 64, 67, 72], melody: [72, 71] },
  F: { name: "Fmaj7", bass: 41, pad: [52, 57, 60, 65], piano: [41, 57, 60, 64, 69], melody: [69, 72] },
  G: { name: "G6", bass: 43, pad: [52, 55, 59, 62], piano: [43, 59, 62, 64, 71], melody: [71, 74] },
};

const CYCLE = [CHORDS.C, CHORDS.Am, CHORDS.F, CHORDS.G] as const;

/** Section edges in beats (1 beat = 0.5 s, 4 beats = 1 bar). */
const B_NAME = 10; // bar 2.5
const B_SPEED = 20; // bar 5
const B_ROLL = 22; // bar 5.5: snap roll starts (countdown 3)
const B_ASCENT = 25; // bar 6.25: ignition, drums come back
const B_BURST = 33; // bar 8.25: burst, one silent beat
const B_GROOVE = 34; // bar 8.5
const B_SECURITY = SECURITY_START_BAR * 4;
const B_OUTRO = OUTRO_START_BAR * 4;
const B_RING = RING_BAR * 4;

/** Bars that get a ghost kick on the & of beat 3. */
const GHOST_BARS: readonly number[] = Array.from(
  { length: Math.ceil((SECURITY_START_BAR - FEATURES_START_BAR) / 8) },
  (_, i) => FEATURES_START_BAR + i * 8,
);

/** Harmony: two bars per chord, with the final two bars resting on C. */
const chordAtBar = (b: number): Chord =>
  b >= LAST_BAR ? CHORDS.C : b >= RING_BAR ? CHORDS.F : CYCLE[Math.floor(b / 2) % 4];

/** Eighth-note slots in a bar: [slot, pool index, velocity]. */
const PATTERN_A: readonly [number, number, number][] = [
  [0, 0, 0.5],
  [1, 1, 0.42],
  [2, 2, 0.6],
  [4, 3, 0.56],
  [5, 4, 0.46],
  [6, 2, 0.44],
];
const PATTERN_B: readonly [number, number, number][] = [
  [0, 1, 0.5],
  [2, 3, 0.56],
  [3, 2, 0.38],
  [4, 4, 0.52],
  [6, 3, 0.46],
  [7, 2, 0.34],
];

/** Bus levels (set from measured bus RMS: piano on top, pad and bass under it, drums in the groove). */
const PIANO_GAIN = 0.32;
const PAD_GAIN = 3;
const BASS_GAIN = 0.55;
/** Parallel high-passed piano added on top (about +4 dB above 1.4 kHz). */
const PRESENCE = 0.6;
/** Piano velocity boost in the security section (about +1.2 dB). */
const SECURITY_PIANO_BOOST = 1.15;

/** Drum levels (peaks before the master). */
const KICK_OPTS: KickOpts = { fromHz: 88, toHz: 56, pitchTau: 0.035, decay: 0.15, click: 0.08 };
const KICK_NAME = 0.3;
const KICK_ASCENT = 0.3;
const KICK_GROOVE = 0.4;
const KICK_SECURITY = 0.34;
const GHOST_KICK = 0.14;
const SNAP_ROLL: readonly [number, number] = [0.05, 0.2];
const SNAP_ASCENT = 0.26;
const SNAP_GROOVE = 0.28;
const SNAP_SECURITY = 0.23;
const HAT_HOOK = 0.035;
const HAT_NAME = 0.045;
const HAT_SPEED = 0.05;
const HAT_RISE = 0.065;
const HAT_GROOVE = 0.065;
const HAT_SECURITY = 0.055;
/** Velocity per eighth in a beat (index = 2 * beat-in-bar + eighth), for a little swing in the hats. */
const HAT_PATTERN: readonly number[] = [0.75, 0.45, 0.62, 0.5, 0.72, 0.45, 0.62, 0.5];

const pianoPan = (midi: number): number => Math.max(-0.5, Math.min(0.5, (midi - 62) / 36));

/** Piano velocity scale: a little louder in the security section. */
const pianoBoost = (beat: number): number => (beat >= B_SECURITY && beat < B_OUTRO ? SECURITY_PIANO_BOOST : 1);

const generateBgm = (): Stereo => {
  const piano = makeStereo(DURATION);
  const pad = makeStereo(DURATION);
  const bass = makeStereo(DURATION);
  const perc = makeStereo(DURATION);

  // --- Piano -------------------------------------------------------------------
  // Hook: single notes, one per beat, rising then settling (Cmaj7).
  const hookNotes = [60, 64, 67, 71, 72, 71, 67, 64];
  hookNotes.forEach((m, k) => {
    const v = k === 0 || k === 4 ? 0.62 : 0.5;
    renderPiano(piano, k * BEAT + humanize(0.004), m, v, pianoPan(m), 2.8);
  });

  // Name: quarter-note broken chords, from bar 2.5.
  for (let k = B_NAME; k < B_SPEED; k++) {
    const b = Math.floor(k / 4);
    const c = chordAtBar(b);
    const order = b % 2 === 0 ? [0, 2, 3, 4] : [1, 3, 4, 2];
    const m = c.piano[order[k % 4]];
    renderPiano(piano, k * BEAT + humanize(0.005), m, k % 4 === 0 ? 0.6 : 0.5, pianoPan(m));
  }

  // Speed, features, security, outro: eighth-note broken chords, two patterns alternating per bar.
  for (let b = 5; b < RING_BAR; b++) {
    const c = chordAtBar(b);
    const pattern = b % 2 === 0 ? PATTERN_A : PATTERN_B;
    for (const [slot, idx, vel] of pattern) {
      const m = c.piano[idx];
      const beat = b * 4 + slot / 2;
      renderPiano(piano, b * BAR + slot * (BEAT / 2) + humanize(0.005), m, vel * pianoBoost(beat), pianoPan(m));
    }
  }

  // Bright chord when the groove returns after the burst (bar 8.5).
  [60, 64, 67, 72, 76].forEach((m, k) => {
    renderPiano(piano, B_GROOVE * BEAT + k * 0.03 + humanize(0.003), m, 0.42, pianoPan(m), 3);
  });

  // Melody: two notes per chord, quiet, from the features to the outro.
  for (let b = 10; b < 44; b += 2) {
    const c = chordAtBar(b);
    renderPiano(piano, b * BAR + humanize(0.003), c.melody[0], 0.5 * pianoBoost(b * 4), 0.1, 3);
    renderPiano(
      piano,
      (b + 1) * BAR + 2 * BEAT + humanize(0.003),
      c.melody[1],
      0.42 * pianoBoost((b + 1) * 4 + 2),
      0.1,
      2.4,
    );
  }

  // Ring out (bars 45-47): quarter-note arpeggio on F, then a rolled C and one last high note.
  [0, 2, 3, 4].forEach((idx, q) => {
    const m = CHORDS.F.piano[idx];
    renderPiano(piano, RING_BAR * BAR + q * BEAT + humanize(0.005), m, q === 0 ? 0.58 : 0.48, pianoPan(m), 3);
  });
  {
    const roll = [36, 48, 55, 64, 67, 72, 76];
    roll.forEach((m, k) => {
      renderPiano(piano, LAST_BAR * BAR + k * 0.07, m, 0.44 - k * 0.015, pianoPan(m), 4.5);
    });
    renderPiano(piano, LAST_BAR * BAR + 2 * BEAT, 79, 0.36, 0.2, 3.5);
  }

  // --- Pad ---------------------------------------------------------------------
  // Hook: thin (two voices, quieter). Then one chord per two bars, overlapping releases.
  renderPad(pad, 0, [52, 59], 2 * BAR, 1.2, 1.2, 0.03, 650);
  for (let b = 2; b < LAST_BAR; b += 2) {
    renderPad(pad, b * BAR, chordAtBar(b).pad, 2 * BAR, 0.6, 1.0, 0.026, 820);
  }
  // Final C pad rings out with the piano.
  renderPad(pad, LAST_BAR * BAR, CHORDS.C.pad, BAR, 0.5, 2.0, 0.024, 780);

  // --- Bass (from the name card) ------------------------------------------------
  // Root on beat 1, root or fifth on beat 3 (even beats only).
  const bassGroove = (k: number): void => {
    const b = Math.floor(k / 4);
    const c = chordAtBar(b);
    if (k % 4 === 0) {
      renderBass(bass, k * BEAT, c.bass, 2 * BEAT - 0.08, 0.3);
    } else {
      renderBass(bass, k * BEAT, b % 2 === 0 ? c.bass : c.bass + 7, 2 * BEAT - 0.1, 0.24);
    }
  };
  for (let k = B_NAME; k < B_ASCENT; k += 2) bassGroove(k);
  // Rising bass pulse through the ascent: an eighth per pulse, an octave up in the second half.
  for (let i = 0; i < 16; i++) {
    const pos = B_ASCENT + i / 2;
    const c = chordAtBar(Math.floor(pos / 4));
    const octave = i >= 8 ? 12 : 0;
    const gain = 0.16 + 0.12 * (i / 15);
    renderBass(bass, pos * BEAT + humanize(0.003), c.bass + octave, BEAT / 2 - 0.05, gain);
  }
  for (let k = B_GROOVE; k < B_RING; k += 2) bassGroove(k);
  renderBass(bass, LAST_BAR * BAR, 36, 2 * BAR - 0.3, 0.2);

  // --- Drums ---------------------------------------------------------------------
  /** Closed 8th hats for one beat (two hats), with a velocity pattern and a little random variation. */
  const hat8 = (k: number, gain: number): void => {
    for (let j = 0; j < 2; j++) {
      const vel = HAT_PATTERN[(k % 4) * 2 + j] * (0.85 + 0.3 * rand());
      renderHat(perc, (k + j / 2) * BEAT + humanize(0.003), gain * vel, 0.25);
    }
  };

  /** One beat of the half-time groove: kick on 1 (and 3 unless kickOnlyOne), snap on 2 and 4, hats. */
  const grooveBeat = (k: number, hatGain: number, kickGain: number, snapGain: number, kickOnlyOne: boolean): void => {
    hat8(k, hatGain);
    const pos = k % 4;
    if (pos === 0 || (pos === 2 && !kickOnlyOne)) {
      renderSoftKick(perc, k * BEAT + humanize(0.003), kickGain, KICK_OPTS);
    }
    if (pos === 2 && !kickOnlyOne && GHOST_BARS.includes(Math.floor(k / 4))) {
      renderSoftKick(perc, k * BEAT + BEAT / 2, GHOST_KICK, KICK_OPTS);
    }
    if (pos === 1 || pos === 3) {
      renderSnap(perc, k * BEAT + humanize(0.004), snapGain, 0);
    }
  };

  // Hook (bars 0-2.5): closed hats, quiet.
  for (let k = 0; k < B_NAME; k++) hat8(k, HAT_HOOK);

  // Name (bars 2.5-5): hats, and one kick on beat 1 of bar 4.
  for (let k = B_NAME; k < B_SPEED; k++) {
    hat8(k, HAT_NAME);
    if (k === 16) renderSoftKick(perc, k * BEAT, KICK_NAME, KICK_OPTS);
  }

  // Speed, bars 5-5.5: hats.
  for (let k = B_SPEED; k < B_ROLL; k++) hat8(k, HAT_SPEED);

  // Snap roll over bars 5.5-6: eighths for the first half, sixteenths after, crescendo.
  // Beat 24 (bar 6.0-6.25) stays silent before the ignition.
  {
    const rollStart = B_ROLL * BEAT;
    const rollMid = (B_ROLL + 1) * BEAT;
    const rollEnd = (B_ROLL + 2) * BEAT;
    for (let t = rollStart; t < rollEnd - 1e-6; t += t < rollMid ? BEAT / 2 : BEAT / 4) {
      const x = (t - rollStart) / (rollEnd - rollStart);
      const gain = SNAP_ROLL[0] + (SNAP_ROLL[1] - SNAP_ROLL[0]) * x;
      renderSnap(perc, t + humanize(0.002), gain, 0);
    }
    for (let k = B_ROLL; k < B_ROLL + 2; k++) hat8(k, HAT_SPEED);
  }

  // Ascent (bars 6.25-8.25): kick on every beat, 16th hats, snap on 2 and 4, all rising slightly.
  for (let k = B_ASCENT; k < B_BURST; k++) {
    const ramp = (k - B_ASCENT) / (B_BURST - B_ASCENT - 1);
    renderSoftKick(perc, k * BEAT + humanize(0.002), KICK_ASCENT * (0.85 + 0.3 * ramp), KICK_OPTS);
    for (let j = 0; j < 4; j++) {
      const gain = HAT_RISE * (0.8 + 0.4 * ramp) * (j % 2 === 0 ? 1 : 0.6);
      renderHat(perc, (k + j / 4) * BEAT + humanize(0.002), gain, 0.25);
    }
    if (k % 4 === 1 || k % 4 === 3) renderSnap(perc, k * BEAT + humanize(0.003), SNAP_ASCENT, 0);
  }
  // Beat 33 (bar 8.25, the burst) is silent; the groove returns at bar 8.5.

  // Features (bars 8.5-37.5): the half-time groove.
  for (let k = B_GROOVE; k < B_SECURITY; k++) grooveBeat(k, HAT_GROOVE, KICK_GROOVE, SNAP_GROOVE, false);

  // Security (bars 37.5-42.5): quieter, kick on beat 1 only.
  for (let k = B_SECURITY; k < B_OUTRO; k++) grooveBeat(k, HAT_SECURITY, KICK_SECURITY, SNAP_SECURITY, true);

  // Outro (bars 42.5-45): the groove returns.
  for (let k = B_OUTRO; k < B_RING; k++) grooveBeat(k, HAT_GROOVE, KICK_GROOVE, SNAP_GROOVE, false);

  // Bars 45-47: drums drop out.

  // --- Reverb and mix -------------------------------------------------------------
  for (const [bus, g] of [
    [pad, PAD_GAIN],
    [bass, BASS_GAIN],
  ] as const) {
    for (let i = 0; i < bus.l.length; i++) {
      bus.l[i] *= g;
      bus.r[i] *= g;
    }
  }
  const send = makeStereo(DURATION);
  for (let i = 0; i < send.l.length; i++) {
    send.l[i] = piano.l[i] * PIANO_GAIN + pad.l[i] * 0.4 + perc.l[i] * 0.3;
    send.r[i] = piano.r[i] * PIANO_GAIN + pad.r[i] * 0.4 + perc.r[i] * 0.3;
  }
  const wet = reverb(send, 0.86, 0.35, 0.025);
  // Scale the reverb so that it sits about 8 dB under the dry send.
  const wetGain = (rmsOf(send) / Math.max(1e-9, rmsOf(wet))) * Math.pow(10, -8 / 20);

  const db = (x: number): string => (20 * Math.log10(x)).toFixed(1);
  console.log(`  bus RMS dB: piano ${db(rmsOf(piano) * PIANO_GAIN)} pad ${db(rmsOf(pad))} bass ${db(rmsOf(bass))} perc ${db(rmsOf(perc))} wet ${db(rmsOf(wet) * wetGain)}`);
  // Gentle presence lift on the piano (a parallel high-passed copy acts as a soft high shelf).
  const airL = new Biquad("highpass", 1400, 0.6);
  const airR = new Biquad("highpass", 1400, 0.6);
  const mix = makeStereo(DURATION);
  const RING_START = RING_BAR * BAR;
  const TAIL_START = LAST_BAR * BAR;
  for (let i = 0; i < mix.l.length; i++) {
    const t = i / SR;
    // The ring out eases down over bars 45-47, then decays to silence at DURATION
    // (Soundtrack.tsx adds its own final fade on top).
    const settle = t < RING_START ? 1 : 1 - 0.12 * Math.min(1, (t - RING_START) / (2 * BAR));
    const fade =
      settle * (t < TAIL_START ? 1 : Math.pow(Math.max(0, 1 - (t - TAIL_START) / (DURATION - TAIL_START)), 1.3));
    const pl = piano.l[i] * PIANO_GAIN;
    const pr = piano.r[i] * PIANO_GAIN;
    mix.l[i] = (pl + airL.process(pl) * PRESENCE + pad.l[i] + bass.l[i] + perc.l[i] + wet.l[i] * wetGain) * fade;
    mix.r[i] = (pr + airR.process(pr) * PRESENCE + pad.r[i] + bass.r[i] + perc.r[i] + wet.r[i] * wetGain) * fade;
  }
  // Keep the soft clip almost linear: only the rare piano peaks touch its knee.
  normalizePeak(mix, 0.9);
  for (let i = 0; i < mix.l.length; i++) {
    mix.l[i] = Math.tanh(mix.l[i]);
    mix.r[i] = Math.tanh(mix.r[i]);
  }
  return mix;
};

// ---------------------------------------------------------------------------
// SFX (all soft and short; placed by SFX_CUES in src/timeline.ts)

/** Rounded short tap: a damped ping with a tiny pitch fall and a soft body. */
const sfxTap = (): Stereo => {
  const s = makeStereo(0.09);
  const lp = new Biquad("lowpass", 3500, 0.7);
  let phase = 0;
  for (let i = 0; i < s.l.length; i++) {
    const t = i / SR;
    const f = 1250 * (1 + 0.18 * Math.exp(-t / 0.004));
    phase += f / SR;
    const ping = Math.sin(2 * Math.PI * phase) * Math.exp(-t / 0.011);
    const body = Math.sin(2 * Math.PI * 480 * t) * Math.exp(-t / 0.02) * 0.55;
    const v = lp.process(ping + body) * Math.min(1, t / 0.0012);
    s.l[i] = v;
    s.r[i] = v;
  }
  return normalizePeak(s, 0.5);
};

/** Soft two-note chime (G5 then C6), bell-like with a light inharmonic partial. */
const sfxChime = (): Stereo => {
  const s = makeStereo(1.2);
  const notes = [
    { t0: 0, f: 783.99, g: 0.8, pan: -0.15 },
    { t0: 0.09, f: 1046.5, g: 1, pan: 0.15 },
  ];
  const lp = new Biquad("lowpass", 5000, 0.7);
  const lp2 = new Biquad("lowpass", 5000, 0.7);
  for (let i = 0; i < s.l.length; i++) {
    const t = i / SR;
    let l = 0;
    let r = 0;
    for (const n of notes) {
      if (t < n.t0) continue;
      const u = t - n.t0;
      const p = 2 * Math.PI * n.f * u;
      const v =
        (Math.sin(p) * Math.exp(-u / 0.42) +
          0.16 * Math.sin(2 * p) * Math.exp(-u / 0.12) +
          0.07 * Math.sin(2.76 * p) * Math.exp(-u / 0.07)) *
        (u < 0.005 ? 0.5 - 0.5 * Math.cos((Math.PI * u) / 0.005) : 1) *
        n.g;
      const [gl, gr] = panGains(n.pan);
      l += v * gl;
      r += v * gr;
    }
    const tail = t > 1.1 ? Math.max(0, (1.2 - t) / 0.1) : 1;
    s.l[i] = lp.process(l) * tail;
    s.r[i] = lp2.process(r) * tail;
  }
  return normalizePeak(s, 0.5);
};

/** Pen on paper: narrow band-passed noise in a few short scratchy strokes. */
const sfxPen = (): Stereo => {
  const dur = 0.3;
  const s = makeStereo(dur);
  const bp = new Biquad("bandpass", 3600, 3);
  const bp2 = new Biquad("bandpass", 5200, 3);
  const hp = new Biquad("highpass", 1800, 0.7);
  let grit = 1;
  for (let i = 0; i < s.l.length; i++) {
    const t = i / SR;
    if (i % 140 === 0) grit = 0.55 + rand() * 0.45;
    // Strokes: a quick wobble of pressure (~13 Hz) under an overall envelope.
    const stroke = 0.35 + 0.65 * Math.pow(Math.max(0, Math.sin(2 * Math.PI * 13 * t + 0.4)), 1.5);
    const env = Math.min(1, t / 0.02) * (t > dur - 0.07 ? Math.max(0, (dur - t) / 0.07) : 1);
    const n = noise();
    const v = hp.process(bp.process(n) + 0.6 * bp2.process(n)) * stroke * env * grit;
    s.l[i] = v * 0.95;
    s.r[i] = v;
  }
  return normalizePeak(s, 0.4);
};

/** Paper page: a soft, rising-then-falling swish with a faint crinkle, panned right to left. */
const sfxPage = (): Stereo => {
  const dur = 0.48;
  const s = makeStereo(dur);
  const bpL = new Biquad("bandpass", 700, 0.9);
  const bpR = new Biquad("bandpass", 700, 0.9);
  const lpL = new Biquad("lowpass", 4500, 0.7);
  const lpR = new Biquad("lowpass", 4500, 0.7);
  const crinkleHp = new Biquad("highpass", 3000, 0.7);
  for (let i = 0; i < s.l.length; i++) {
    const t = i / SR;
    const x = t / dur;
    if (i % 32 === 0) {
      const f = 700 * Math.pow(2600 / 700, Math.sin((Math.PI / 2) * Math.min(1, x * 1.6)));
      bpL.set(f, 0.9);
      bpR.set(f * 1.06, 0.9);
    }
    const env = t < 0.14 ? Math.pow(t / 0.14, 2) : Math.exp(-(t - 0.14) / 0.1);
    const crinkle = rand() < 0.004 ? noise() * 3 : 0;
    const c = crinkleHp.process(crinkle) * env * 0.25;
    const pan = 0.4 - 0.8 * x;
    const [gl, gr] = panGains(pan);
    s.l[i] = (lpL.process(bpL.process(noise())) * env + c) * gl;
    s.r[i] = (lpR.process(bpR.process(noise())) * env + c) * gr;
  }
  return normalizePeak(s, 0.45);
};

/** Peak for the v4 SFX (about -3 dBFS before the per-cue volume in Soundtrack.tsx). */
const SFX_PEAK_V4 = 0.708;

/** Countdown number: a soft wooden 'tok' at 660 Hz (sine, fast decay) with a tiny noise tick. */
const sfxCountdown = (): Stereo => {
  const s = makeStereo(0.32);
  const tick = new Biquad("highpass", 3000, 0.7);
  let phase = 0;
  for (let i = 0; i < s.l.length; i++) {
    const t = i / SR;
    const f = 660 * (1 + 0.02 * Math.exp(-t / 0.01));
    phase += f / SR;
    const tone = Math.sin(2 * Math.PI * phase) * Math.exp(-t / 0.05) * Math.min(1, t / 0.0015);
    const c = tick.process(noise()) * Math.exp(-t / 0.004) * 0.12;
    s.l[i] = tone + c;
    s.r[i] = tone + c;
  }
  return normalizePeak(s, SFX_PEAK_V4);
};

/** Ignition: a fast-swelling low rumble (noise under 400 Hz) and a soft 'whoomp' sine drop 90 -> 45 Hz. */
const sfxIgnite = (): Stereo => {
  const dur = 1.3;
  const s = makeStereo(dur);
  const lp1 = new Biquad("lowpass", 400, 0.7);
  const lp2 = new Biquad("lowpass", 400, 0.7);
  let phase = 0;
  for (let i = 0; i < s.l.length; i++) {
    const t = i / SR;
    const swell = Math.min(1, Math.pow(t / 0.22, 1.6));
    const tail = t > 0.22 ? Math.exp(-(t - 0.22) / 0.42) : 1;
    const rumble = lp2.process(lp1.process(noise())) * 3 * swell * tail;
    const whoompHz = 45 + 45 * Math.exp(-t / 0.07);
    phase += whoompHz / SR;
    const whoomp = Math.sin(2 * Math.PI * phase) * Math.min(1, t / 0.008) * Math.exp(-t / 0.07) * 0.8;
    const v = (rumble + whoomp) * Math.min(1, (dur - t) / 0.25);
    s.l[i] = v;
    s.r[i] = v;
  }
  return normalizePeak(s, SFX_PEAK_V4);
};

/** Ascent: a rising air stream (noise band-passed 300 -> 1800 Hz, getting louder) over a low rumble. */
const sfxRocket = (): Stereo => {
  const dur = 3.6;
  const s = makeStereo(dur);
  const bpL = new Biquad("bandpass", 300, 0.9);
  const bpR = new Biquad("bandpass", 300, 0.9);
  const rumL = new Biquad("lowpass", 220, 0.7);
  const rumR = new Biquad("lowpass", 220, 0.7);
  for (let i = 0; i < s.l.length; i++) {
    const t = i / SR;
    const x = t / dur;
    if (i % 32 === 0) {
      // Log sweep 300 -> 1800 Hz.
      const f = 300 * Math.pow(6, Math.pow(x, 0.8));
      bpL.set(f, 0.9);
      bpR.set(f * 1.05, 0.9);
    }
    const level = (0.25 + 0.75 * Math.pow(x, 1.4)) * Math.min(1, t / 0.25) * Math.min(1, (dur - t) / 0.6);
    const rumble = 3 * (1 - 0.4 * x);
    const vL = (bpL.process(noise()) * 2.2 + rumL.process(noise()) * rumble) * level;
    const vR = (bpR.process(noise()) * 2.2 + rumR.process(noise()) * rumble) * level;
    s.l[i] = vL;
    s.r[i] = vR;
  }
  return normalizePeak(s, SFX_PEAK_V4);
};

/** Rounded explosion: a sine drop 120 -> 35 Hz (350 ms decay), a short muffled noise burst and a soft tail. */
const sfxBoom = (): Stereo => {
  const dur = 1.8;
  const s = makeStereo(dur);
  const burstLp1 = new Biquad("lowpass", 1100, 0.7);
  const burstLp2 = new Biquad("lowpass", 1100, 0.7);
  const tailLp = new Biquad("lowpass", 450, 0.7);
  let phase = 0;
  for (let i = 0; i < s.l.length; i++) {
    const t = i / SR;
    const f = 35 + 85 * Math.exp(-t / 0.12);
    phase += f / SR;
    const body = Math.sin(2 * Math.PI * phase) * Math.min(1, t / 0.005) * Math.exp(-t / 0.35) * 0.9;
    const burst = burstLp2.process(burstLp1.process(noise())) * Math.exp(-t / 0.05) * 0.5;
    const tail = tailLp.process(noise()) * Math.min(1, t / 0.02) * Math.exp(-t / 0.45) * 0.4;
    const v = body + burst + tail;
    s.l[i] = v;
    s.r[i] = v;
  }
  return normalizePeak(s, SFX_PEAK_V4);
};

/** Table row appears: a small friendly pop, a 900 Hz sine with a very fast pitch fall and a short noise tick. */
const sfxRow = (): Stereo => {
  const s = makeStereo(0.22);
  const tick = new Biquad("highpass", 2500, 0.7);
  let phase = 0;
  for (let i = 0; i < s.l.length; i++) {
    const t = i / SR;
    const f = 600 + 300 * Math.exp(-t / 0.008);
    phase += f / SR;
    const pop = Math.sin(2 * Math.PI * phase) * Math.min(1, t / 0.001) * Math.exp(-t / 0.05);
    const c = tick.process(noise()) * Math.exp(-t / 0.004) * 0.15;
    s.l[i] = pop + c;
    s.r[i] = pop + c;
  }
  return normalizePeak(s, SFX_PEAK_V4);
};

// ---------------------------------------------------------------------------

const main = (): void => {
  mkdirSync(OUT_DIR, { recursive: true });

  const sfx: Array<[string, () => Stereo]> = [
    ["tap", sfxTap],
    ["chime", sfxChime],
    ["pen", sfxPen],
    ["page", sfxPage],
    ["countdown", sfxCountdown],
    ["ignite", sfxIgnite],
    ["rocket", sfxRocket],
    ["boom", sfxBoom],
    ["row", sfxRow],
  ];
  for (const [name, make] of sfx) {
    const s = make();
    const path = join(OUT_DIR, `sfx-${name}.wav`);
    writeWav(path, s);
    console.log(`wrote ${path} (${((s.l.length / SR) * 1000).toFixed(0)} ms)`);
  }

  console.log("rendering BGM...");
  writeMastered(generateBgm(), join(OUT_DIR, "bgm.wav"), "mc-vector", TARGET_LUFS, TARGET_TP);
};

main();
