// Synthesizes the Snapzy video's soundtrack (BGM + SFX). No external samples.
// Run: bun run generate:audio:snapzy
//
// Output (48 kHz, stereo, 16-bit PCM):
//   public/snapzy/audio/bgm.wav     as long as the video (src/snapzy/layout.ts), 120 BPM, D major
//   public/snapzy/audio/sfx-*.wav   tap / shutter / glass / tick / chime / scan / key
//
// The BGM is light and bright, in the spirit of a product film: marimba-like
// plucks, an airy pad, a round bass, a soft kick and finger snaps. It follows
// the scenes: open (pad and plucks only), onboarding (kick comes in), the
// feature scenes (full groove), history (lighter), outro (rings out).

import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { FRAMES_PER_BAR, SCENES, TOTAL_BARS } from "../../src/snapzy/layout";
import {
  addAt,
  Biquad,
  createInstruments,
  makeStereo,
  mtof,
  mulberry32,
  normalizePeak,
  panGains,
  reverb,
  SR,
  type Stereo,
  writeMastered,
  writeWav,
} from "../shared/dsp";

const OUT_DIR = fileURLToPath(new URL("../../public/snapzy/audio/", import.meta.url));

const BEAT = 0.5;
const BAR = BEAT * 4;
const DURATION = TOTAL_BARS * BAR;
const TARGET_LUFS = -14;
const TARGET_TP = -1.5;

const rand = mulberry32(0x5a7a2e);
const { noise, humanize, renderPad, renderBass, renderSoftKick, renderHat, renderSnap } = createInstruments(rand);

const startBar = (id: (typeof SCENES)[number]["id"]): number => {
  const s = SCENES.find((e) => e.id === id);
  if (!s) throw new Error(id);
  return s.from / FRAMES_PER_BAR;
};

// ---------------------------------------------------------------------------
// A marimba-like pluck: a sine with the marimba's 4th and 10th partials, a
// fast mallet click and a short decay.

const renderPluck = (dst: Stereo, t0: number, midi: number, vel: number, pan: number): void => {
  const start = Math.round(t0 * SR);
  const len = Math.round(1.4 * SR);
  const f = mtof(midi);
  const w1 = (2 * Math.PI * f) / SR;
  const w4 = w1 * 3.93;
  const w10 = w1 * 9.7;
  const decay = Math.min(0.9, Math.max(0.28, 0.6 * Math.pow(392 / f, 0.5)));
  const click = new Biquad("bandpass", Math.min(9000, f * 6), 1.2);
  const [gl, gr] = panGains(pan);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const atk = Math.min(1, t / 0.002);
    let v = Math.sin(w1 * i) * Math.exp(-t / decay);
    v += 0.32 * Math.sin(w4 * i) * Math.exp(-t / (decay * 0.22));
    v += 0.08 * Math.sin(w10 * i) * Math.exp(-t / (decay * 0.06));
    v += click.process(noise()) * 0.18 * Math.exp(-t / 0.004);
    const s = v * atk * vel;
    addAt(dst, start, s * gl, s * gr, i);
  }
};

// ---------------------------------------------------------------------------
// BGM

type Chord = { root: number; pad: readonly number[]; arp: readonly number[] };

// Dmaj9 -> Bm9 -> Gmaj9 -> A6sus, two bars each.
const CYCLE: readonly Chord[] = [
  { root: 38, pad: [62, 66, 69, 73, 76], arp: [74, 78, 81, 76, 73, 76, 81, 78] },
  { root: 35, pad: [62, 66, 69, 73], arp: [71, 74, 78, 73, 69, 73, 78, 74] },
  { root: 31, pad: [62, 66, 69, 71], arp: [71, 74, 78, 81, 79, 78, 74, 71] },
  { root: 33, pad: [62, 64, 69, 71], arp: [69, 74, 76, 78, 76, 74, 71, 69] },
];

const chordAt = (bar: number): Chord => CYCLE[Math.floor(bar / 2) % CYCLE.length];

const generateBgm = (): Stereo => {
  const mix = makeStereo(DURATION + 3);
  const send = makeStereo(DURATION + 3);

  const ONBOARD = startBar("onboard");
  const FEATURES = startBar("capture");
  const HISTORY = startBar("history");
  const OUTRO = startBar("outro");
  const RING = TOTAL_BARS - 2;

  for (let bar = 0; bar < TOTAL_BARS; bar++) {
    const t = bar * BAR;
    const c = bar >= RING ? CYCLE[0] : chordAt(bar);
    const intro = bar < ONBOARD;
    const groove = bar >= FEATURES && bar < RING;
    const light = bar >= HISTORY && bar < OUTRO;

    // Pad: one per two bars.
    if (bar % 2 === 0 || bar === RING) {
      const hold = bar === RING ? BAR * 2 : BAR * 2 - 0.1;
      const pad = makeStereo(hold + 2.5);
      renderPad(pad, 0, c.pad, hold, 0.6, bar === RING ? 2.4 : 1.2, intro ? 0.035 : 0.03, 2400);
      const s = Math.round(t * SR);
      for (let i = 0; i < pad.l.length; i++) {
        addAt(mix, s, pad.l[i], pad.r[i], i);
        addAt(send, s, pad.l[i] * 0.6, pad.r[i] * 0.6, i);
      }
    }

    // Plucks: 8ths from the arpeggio; sparser in the intro and the ring-out.
    const sparse = intro || bar >= RING;
    for (let k = 0; k < 8; k++) {
      if (sparse && k % 2 === 1) continue;
      if (bar >= RING && k > 4) continue;
      const half = bar % 2;
      const note = c.arp[(k + half * 3) % c.arp.length];
      const vel = (k % 4 === 0 ? 0.5 : 0.36) * (light ? 0.85 : 1);
      const at = t + k * (BEAT / 2) + humanize(0.004);
      const tmp = makeStereo(1.5);
      renderPluck(tmp, 0, note, vel, Math.sin(k * 1.3) * 0.45);
      const s = Math.round(at * SR);
      for (let i = 0; i < tmp.l.length; i++) {
        addAt(mix, s, tmp.l[i], tmp.r[i], i);
        addAt(send, s, tmp.l[i] * 0.35, tmp.r[i] * 0.35, i);
      }
    }

    // Bass from onboarding on: root on 1, fifth on the "and" of 3.
    if (!intro && bar < RING + 1) {
      renderBass(mix, t, c.root, BEAT * 2.4, 0.42);
      if (bar < RING) renderBass(mix, t + BEAT * 2.5, c.root + 7, BEAT * 1.2, 0.3);
    }

    // Drums.
    if (!intro && bar < RING) {
      const kickGain = groove ? 0.42 : 0.3;
      renderSoftKick(mix, t, kickGain, { fromHz: 92, toHz: 54, pitchTau: 0.03, decay: 0.14, click: 0.06 });
      renderSoftKick(mix, t + BEAT * 2, kickGain * 0.9, { fromHz: 92, toHz: 54, pitchTau: 0.03, decay: 0.14, click: 0.06 });
      if (groove || light) {
        renderSnap(mix, t + BEAT, light ? 0.18 : 0.24, 0.15);
        renderSnap(mix, t + BEAT * 3, light ? 0.18 : 0.24, 0.15);
      }
      const n = groove ? 16 : 8;
      for (let k = 0; k < n; k++) {
        const at = t + k * (BAR / n) + humanize(0.003);
        const accent = k % (n / 4) === 0 ? 1 : 0.6;
        renderHat(mix, at, (groove ? 0.04 : 0.03) * accent, k % 2 === 0 ? -0.3 : 0.3);
      }
    }
  }

  // Final chord: a soft pluck roll on D.
  [62, 66, 69, 74, 78].forEach((m, i) => renderPluck(mix, RING * BAR + i * 0.06, m, 0.4, (i - 2) * 0.2));

  const wet = reverb(send, 0.86, 0.35, 0.03);
  for (let i = 0; i < mix.l.length; i++) {
    mix.l[i] += wet.l[i] * 1.1;
    mix.r[i] += wet.r[i] * 1.1;
  }
  // Trim to the video length with a short fade.
  const out = makeStereo(DURATION);
  const fade = Math.round(0.4 * SR);
  for (let i = 0; i < out.l.length; i++) {
    const g = i > out.l.length - fade ? (out.l.length - i) / fade : 1;
    out.l[i] = mix.l[i] * g;
    out.r[i] = mix.r[i] * g;
  }
  return out;
};

// ---------------------------------------------------------------------------
// SFX

const shaped = (seconds: number, fn: (t: number, i: number) => [number, number]): Stereo => {
  const s = makeStereo(seconds);
  for (let i = 0; i < s.l.length; i++) {
    const [l, r] = fn(i / SR, i);
    s.l[i] = l;
    s.r[i] = r;
  }
  return s;
};

/** Trackpad click: a tiny high blip and a soft knock. */
const sfxTap = (): Stereo => {
  const hp = new Biquad("highpass", 2500, 0.7);
  return normalizePeak(
    shaped(0.08, (t) => {
      const v = Math.sin(2 * Math.PI * 2100 * t) * Math.exp(-t / 0.006) * 0.6 + hp.process(noise()) * Math.exp(-t / 0.004) * 0.5;
      const knock = Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t / 0.012) * 0.4;
      return [v + knock, v + knock];
    }),
    0.5,
  );
};

/** Camera shutter: two quick mechanical clicks with a little body. */
const sfxShutter = (): Stereo => {
  const bp1 = new Biquad("bandpass", 3200, 1.1);
  const bp2 = new Biquad("bandpass", 2400, 1.1);
  return normalizePeak(
    shaped(0.22, (t) => {
      const a = bp1.process(noise()) * Math.exp(-t / 0.008);
      const t2 = t - 0.075;
      const b = t2 > 0 ? bp2.process(noise()) * Math.exp(-t2 / 0.012) * 0.8 : 0;
      const body = Math.sin(2 * Math.PI * 140 * t) * Math.exp(-t / 0.02) * 0.25;
      return [a + b + body, a * 0.9 + b + body];
    }),
    0.7,
  );
};

/** Glass: an airy rising swish with a faint high shimmer. */
const sfxGlass = (): Stereo => {
  const bpL = new Biquad("bandpass", 900, 1.4);
  const bpR = new Biquad("bandpass", 900, 1.4);
  const len = 0.45;
  return normalizePeak(
    shaped(len, (t) => {
      const f = 900 + 3800 * Math.pow(t / len, 0.7);
      bpL.set(f, 1.4);
      bpR.set(f * 1.06, 1.4);
      const env = Math.sin(Math.PI * Math.min(1, t / len)) ** 1.5;
      const shimmer = Math.sin(2 * Math.PI * 2637 * t) * 0.08 * Math.exp(-Math.max(0, t - 0.15) / 0.12) * (t > 0.12 ? 1 : 0);
      return [bpL.process(noise()) * env + shimmer, bpR.process(noise()) * env + shimmer];
    }),
    0.4,
  );
};

/** Countdown tick: a short wooden tok. */
const sfxTick = (): Stereo =>
  normalizePeak(
    shaped(0.12, (t) => {
      const v = Math.sin(2 * Math.PI * 1250 * t) * Math.exp(-t / 0.018) + Math.sin(2 * Math.PI * 620 * t) * Math.exp(-t / 0.03) * 0.5;
      return [v, v];
    }),
    0.5,
  );

/** Done: two soft bell tones (A5, E6). */
const sfxChime = (): Stereo =>
  normalizePeak(
    shaped(1.2, (t) => {
      const bell = (f: number, t0: number) => {
        const u = t - t0;
        if (u < 0) return 0;
        return (Math.sin(2 * Math.PI * f * u) + 0.3 * Math.sin(2 * Math.PI * f * 2.76 * u) * Math.exp(-u / 0.08)) * Math.exp(-u / 0.45) * Math.min(1, u / 0.003);
      };
      const v = bell(880, 0) + bell(1318.5, 0.09) * 0.8;
      return [v, v * 0.95];
    }),
    0.45,
  );

/** Scan: a light shimmer sweeping up. */
const sfxScan = (): Stereo => {
  const bp = new Biquad("bandpass", 2000, 3);
  const len = 0.9;
  return normalizePeak(
    shaped(len, (t) => {
      bp.set(1500 + 5000 * (t / len), 3);
      const env = Math.sin(Math.PI * (t / len));
      const v = bp.process(noise()) * env;
      return [v, v * 0.9];
    }),
    0.3,
  );
};

/** A key press: a short soft clack. */
const sfxKey = (): Stereo => {
  const hp = new Biquad("highpass", 1400, 0.8);
  return normalizePeak(
    shaped(0.07, (t) => {
      const v = hp.process(noise()) * Math.exp(-t / 0.006) + Math.sin(2 * Math.PI * 320 * t) * Math.exp(-t / 0.01) * 0.3;
      return [v, v];
    }),
    0.4,
  );
};

// ---------------------------------------------------------------------------

const main = (): void => {
  mkdirSync(OUT_DIR, { recursive: true });
  const sfx: Array<[string, () => Stereo]> = [
    ["tap", sfxTap],
    ["shutter", sfxShutter],
    ["glass", sfxGlass],
    ["tick", sfxTick],
    ["chime", sfxChime],
    ["scan", sfxScan],
    ["key", sfxKey],
  ];
  for (const [name, make] of sfx) {
    const s = make();
    const path = join(OUT_DIR, `sfx-${name}.wav`);
    writeWav(path, s);
    console.log(`wrote ${path} (${((s.l.length / SR) * 1000).toFixed(0)} ms)`);
  }
  console.log(`rendering BGM (${DURATION}s)...`);
  writeMastered(generateBgm(), join(OUT_DIR, "bgm.wav"), "snapzy", TARGET_LUFS, TARGET_TP);
};

main();
