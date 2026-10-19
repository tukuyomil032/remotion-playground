// Sound synthesis shared by the audio scripts: filters, reverb, a few soft
// instruments, WAV output and the loudness stage. No external samples.
//
// Randomness is passed in (createInstruments(rng)), so each script keeps its own
// seeded generator and produces identical files on every run.

import { spawnSync } from "node:child_process";
import { copyFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const FFMPEG = "/opt/homebrew/bin/ffmpeg";
export const SR = 48000;

// ---------------------------------------------------------------------------
// Utilities

export type Stereo = { l: Float32Array; r: Float32Array };

export const makeStereo = (seconds: number): Stereo => {
  const n = Math.round(seconds * SR);
  return { l: new Float32Array(n), r: new Float32Array(n) };
};

/** Deterministic PRNG so every run produces identical files. */
export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export type Rng = () => number;

export const mtof = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);

type FilterType = "lowpass" | "highpass" | "bandpass";

/** RBJ biquad. */
export class Biquad {
  private b0 = 1;
  private b1 = 0;
  private b2 = 0;
  private a1 = 0;
  private a2 = 0;
  private x1 = 0;
  private x2 = 0;
  private y1 = 0;
  private y2 = 0;

  constructor(
    private readonly type: FilterType,
    freq: number,
    q: number,
  ) {
    this.set(freq, q);
  }

  set(freq: number, q: number): void {
    const f = Math.min(Math.max(freq, 10), SR * 0.45);
    const w0 = (2 * Math.PI * f) / SR;
    const cos = Math.cos(w0);
    const alpha = Math.sin(w0) / (2 * q);
    const a0 = 1 + alpha;
    let b0: number;
    let b1: number;
    let b2: number;
    if (this.type === "lowpass") {
      b0 = (1 - cos) / 2;
      b1 = 1 - cos;
      b2 = (1 - cos) / 2;
    } else if (this.type === "highpass") {
      b0 = (1 + cos) / 2;
      b1 = -(1 + cos);
      b2 = (1 + cos) / 2;
    } else {
      b0 = alpha;
      b1 = 0;
      b2 = -alpha;
    }
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = (-2 * cos) / a0;
    this.a2 = (1 - alpha) / a0;
  }

  process(x: number): number {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

/** Naive sawtooth from a phase in cycles. */
export const saw = (phase: number): number => 2 * (phase - Math.floor(phase)) - 1;

export const peakOf = (s: Stereo): number => {
  let p = 0;
  for (let i = 0; i < s.l.length; i++) {
    p = Math.max(p, Math.abs(s.l[i]), Math.abs(s.r[i]));
  }
  return p;
};

export const rmsOf = (s: Stereo): number => {
  let acc = 0;
  for (let i = 0; i < s.l.length; i++) {
    acc += s.l[i] * s.l[i] + s.r[i] * s.r[i];
  }
  return Math.sqrt(acc / (2 * Math.max(1, s.l.length)));
};

export const normalizePeak = (s: Stereo, target: number): Stereo => {
  const p = peakOf(s);
  if (p > 0) {
    const g = target / p;
    for (let i = 0; i < s.l.length; i++) {
      s.l[i] *= g;
      s.r[i] *= g;
    }
  }
  return s;
};

export const writeWav = (path: string, s: Stereo): void => {
  const n = s.l.length;
  const dataSize = n * 4;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0, "ascii");
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write("WAVE", 8, "ascii");
  buf.write("fmt ", 12, "ascii");
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(2, 22); // stereo
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36, "ascii");
  buf.writeUInt32LE(dataSize, 40);
  const toI16 = (x: number): number => Math.max(-32768, Math.min(32767, Math.round(x * 32767)));
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(toI16(s.l[i]), 44 + i * 4);
    buf.writeInt16LE(toI16(s.r[i]), 46 + i * 4);
  }
  writeFileSync(path, buf);
};

export const addAt = (dst: Stereo, start: number, l: number, r: number, i: number): void => {
  const k = start + i;
  if (k >= 0 && k < dst.l.length) {
    dst.l[k] += l;
    dst.r[k] += r;
  }
};

/** Equal-power-ish pan: -1 (left) .. 1 (right). */
export const panGains = (pan: number): [number, number] => {
  const a = ((pan + 1) * Math.PI) / 4;
  return [Math.cos(a) * Math.SQRT2, Math.sin(a) * Math.SQRT2];
};

// ---------------------------------------------------------------------------
// Reverb (Freeverb-style: 8 damped combs + 4 allpasses per channel)

class Comb {
  private readonly buf: Float32Array;
  private idx = 0;
  private store = 0;

  constructor(
    size: number,
    private readonly feedback: number,
    private readonly damp: number,
  ) {
    this.buf = new Float32Array(size);
  }

  process(x: number): number {
    const y = this.buf[this.idx];
    this.store = y * (1 - this.damp) + this.store * this.damp;
    this.buf[this.idx] = x + this.store * this.feedback;
    this.idx = (this.idx + 1) % this.buf.length;
    return y;
  }
}

class Allpass {
  private readonly buf: Float32Array;
  private idx = 0;

  constructor(size: number) {
    this.buf = new Float32Array(size);
  }

  process(x: number): number {
    const b = this.buf[this.idx];
    const y = -x + b;
    this.buf[this.idx] = x + b * 0.5;
    this.idx = (this.idx + 1) % this.buf.length;
    return y;
  }
}

/** Wet-only stereo reverb of a stereo send. */
export const reverb = (send: Stereo, room: number, damp: number, preDelay: number): Stereo => {
  const scale = SR / 44100;
  const combT = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const apT = [556, 441, 341, 225];
  const spread = 23;
  const mk = (off: number) => ({
    combs: combT.map((t) => new Comb(Math.round((t + off) * scale), room, damp)),
    aps: apT.map((t) => new Allpass(Math.round((t + off) * scale))),
  });
  const L = mk(0);
  const R = mk(spread);
  const hp = new Biquad("highpass", 220, 0.7);
  const lp = new Biquad("lowpass", 5500, 0.7);
  const pd = Math.round(preDelay * SR);
  const n = send.l.length;
  const out = makeStereo(n / SR);
  for (let i = 0; i < n; i++) {
    const j = i - pd;
    const x = j >= 0 ? lp.process(hp.process((send.l[j] + send.r[j]) * 0.5)) * 0.015 : 0;
    let l = 0;
    let r = 0;
    for (let c = 0; c < 8; c++) {
      l += L.combs[c].process(x);
      r += R.combs[c].process(x);
    }
    for (let a = 0; a < 4; a++) {
      l = L.aps[a].process(l);
      r = R.aps[a].process(r);
    }
    out.l[i] = l;
    out.r[i] = r;
  }
  return out;
};

// ---------------------------------------------------------------------------
// Instruments

/** Options for renderSoftKick. Defaults are a 74 -> 52 Hz thump with no click. */
export type KickOpts = { fromHz?: number; toHz?: number; pitchTau?: number; decay?: number; click?: number };

/** Instruments that draw from the caller's random generator. */
export const createInstruments = (rand: Rng) => {
  const noise = (): number => rand() * 2 - 1;

  /** Small, deterministic timing humanization (seconds). */
  const humanize = (amount: number): number => (rand() - 0.5) * 2 * amount;

  /**
   * Felt-piano-like note: a few slightly inharmonic sine partials with short,
   * pitch-dependent decays, a soft attack, a muted hammer thump and a gentle
   * lowpass. Two detuned "strings" on the fundamental give a slow shimmer.
   */
  const renderPiano = (dst: Stereo, t0: number, midi: number, vel: number, pan: number, ring = 2.6): void => {
    const start = Math.round(t0 * SR);
    const len = Math.round(ring * SR);
    const f = mtof(midi);
    const bright = 0.45 + 0.55 * vel;
    const baseDecay = Math.min(2.2, Math.max(0.55, 1.5 * Math.pow(261.6 / f, 0.45)));
    const B = 0.00018;
    const partials = [1, 2, 3, 4, 5, 6, 7].map((k) => ({
      w: (2 * Math.PI * f * k * Math.sqrt(1 + B * k * k)) / SR,
      a: [1, 0.5, 0.24, 0.11, 0.055, 0.028, 0.014][k - 1] * (k === 1 ? 1 : bright),
      d: baseDecay / Math.pow(k, 1.05),
      ph: rand() * Math.PI * 2,
    }));
    const wDet = (2 * Math.PI * f * 1.0009) / SR;
    const thumpLp = new Biquad("lowpass", 380, 0.8);
    const lp = new Biquad("lowpass", 2600 + 2800 * vel, 0.6);
    const [gl, gr] = panGains(pan);
    const atk = 0.006 + 0.004 * (1 - vel);
    const fadeOut = Math.round(0.08 * SR);
    for (let i = 0; i < len; i++) {
      const t = i / SR;
      let v = 0;
      for (const p of partials) {
        v += Math.sin(p.w * i + p.ph) * p.a * Math.exp(-t / p.d);
      }
      // Second string on the fundamental: a slow, quiet beat.
      v += Math.sin(wDet * i + partials[0].ph) * 0.35 * Math.exp(-t / (baseDecay * 1.15));
      v += thumpLp.process(noise()) * 0.5 * Math.exp(-t / 0.012);
      const a = t < atk ? 0.5 - 0.5 * Math.cos((Math.PI * t) / atk) : 1;
      const rel = i > len - fadeOut ? (len - i) / fadeOut : 1;
      const s = lp.process(v) * a * rel * vel;
      addAt(dst, start, s * gl, s * gr, i);
    }
  };

  /** Soft pad: detuned saws through a low lowpass, slow attack and release. */
  const renderPad = (
    dst: Stereo,
    t0: number,
    tones: readonly number[],
    hold: number,
    attack: number,
    release: number,
    gain: number,
    cutoff: number,
  ): void => {
    const start = Math.round(t0 * SR);
    const len = Math.round((hold + release) * SR);
    const lpL = new Biquad("lowpass", cutoff, 0.6);
    const lpR = new Biquad("lowpass", cutoff * 1.05, 0.6);
    const lpL2 = new Biquad("lowpass", cutoff * 1.4, 0.6);
    const lpR2 = new Biquad("lowpass", cutoff * 1.45, 0.6);
    const detune = [-0.0045, 0, 0.004];
    const freqs = tones.map(mtof);
    const phases = freqs.map(() => detune.map(() => rand()));
    for (let i = 0; i < len; i++) {
      const t = i / SR;
      let l = 0;
      let r = 0;
      for (let v = 0; v < freqs.length; v++) {
        for (let d = 0; d < detune.length; d++) {
          phases[v][d] += (freqs[v] * (1 + detune[d])) / SR;
          const s = saw(phases[v][d]);
          if (d === 0) l += s;
          else if (d === 2) r += s;
          else {
            l += s * 0.6;
            r += s * 0.6;
          }
        }
      }
      const a = t < attack ? 0.5 - 0.5 * Math.cos((Math.PI * t) / attack) : 1;
      const rel = t > hold ? Math.max(0, 1 - (t - hold) / release) : 1;
      const breathe = 0.9 + 0.1 * Math.sin(2 * Math.PI * 0.125 * (t0 + t));
      const env = a * rel * rel * breathe * gain;
      addAt(dst, start, lpL2.process(lpL.process(l)) * env, lpR2.process(lpR.process(r)) * env, i);
    }
  };

  /** Thin, round bass: sine with a touch of 2nd and 3rd harmonic. */
  const renderBass = (dst: Stereo, t0: number, midi: number, dur: number, gain: number): void => {
    const start = Math.round(t0 * SR);
    const relT = 0.12;
    const len = Math.round((dur + relT) * SR);
    const w = (2 * Math.PI * mtof(midi)) / SR;
    const lp = new Biquad("lowpass", 700, 0.7);
    for (let i = 0; i < len; i++) {
      const t = i / SR;
      const p = w * i;
      const tone = Math.sin(p) + 0.28 * Math.sin(2 * p) + 0.08 * Math.sin(3 * p);
      const atk = Math.min(1, t / 0.018);
      const body = 0.7 + 0.3 * Math.exp(-t / 0.25);
      const rel = t > dur ? Math.max(0, 1 - (t - dur) / relT) : 1;
      const v = lp.process(tone) * atk * body * rel * gain;
      addAt(dst, start, v, v, i);
    }
  };

  /** Very soft low thump: a sine with a small pitch drop and an optional short click. */
  const renderSoftKick = (dst: Stereo, t0: number, gain: number, opts: KickOpts = {}): void => {
    const { fromHz = 74, toHz = 52, pitchTau = 0.05, decay = 0.16, click = 0 } = opts;
    const start = Math.round(t0 * SR);
    const len = Math.round(0.4 * SR);
    const tick = new Biquad("highpass", 1800, 0.7);
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / SR;
      const f = toHz + (fromHz - toHz) * Math.exp(-t / pitchTau);
      phase += f / SR;
      const env = Math.min(1, t / 0.006) * Math.exp(-t / decay);
      const v = Math.sin(2 * Math.PI * phase) * env * gain;
      const c = click > 0 ? tick.process(noise()) * Math.exp(-t / 0.003) * click * gain : 0;
      addAt(dst, start, v + c, v + c, i);
    }
  };

  /** Closed hat: high-passed noise, 35-60 ms. The open variant rings for 160 ms. */
  const renderHat = (dst: Stereo, t0: number, gain: number, pan: number, open = false): void => {
    const start = Math.round(t0 * SR);
    const len = Math.round((open ? 0.16 : 0.05) * SR);
    const tau = open ? 0.045 : 0.012;
    const hp = new Biquad("highpass", 4500, 0.7);
    const [gl, gr] = panGains(pan);
    for (let i = 0; i < len; i++) {
      const t = i / SR;
      const env = Math.min(1, t / 0.0005) * Math.exp(-t / tau);
      const v = hp.process(noise()) * env * gain;
      addAt(dst, start, v * gl, v * gr, i);
    }
  };

  /** Brush-like soft snare ("snap"): band-passed noise (2-6 kHz), quick decay, tiny 180 Hz body for 30 ms. */
  const renderSnap = (dst: Stereo, t0: number, gain: number, pan: number): void => {
    const start = Math.round(t0 * SR);
    const len = Math.round(0.12 * SR);
    const bp = new Biquad("bandpass", 3600, 0.9);
    const [gl, gr] = panGains(pan);
    for (let i = 0; i < len; i++) {
      const t = i / SR;
      const env = Math.min(1, t / 0.002) * Math.exp(-Math.max(0, t - 0.002) / 0.028);
      const body = t < 0.03 ? Math.sin(2 * Math.PI * 180 * t) * (1 - t / 0.03) * 0.35 : 0;
      const v = (bp.process(noise()) * 0.8 + body) * env * gain;
      addAt(dst, start, v * gl, v * gr, i);
    }
  };

  return { noise, humanize, renderPiano, renderPad, renderBass, renderSoftKick, renderHat, renderSnap };
};

// ---------------------------------------------------------------------------
// Loudness: gain + look-ahead limiter, measured with ffmpeg loudnorm, adjusted
// until integrated loudness is ~targetLufs and true peak <= targetTp.

const runFfmpeg = (args: string[]): string => {
  const res = spawnSync(FFMPEG, ["-hide_banner", "-nostats", ...args], { encoding: "utf8" });
  if (res.status !== 0) {
    throw new Error(`ffmpeg failed (${res.status}):\n${res.stderr}`);
  }
  return res.stderr;
};

type LoudnessStats = { input_i: string; input_tp: string };

export const measure = (path: string): { i: number; tp: number } => {
  const stderr = runFfmpeg(["-i", path, "-af", "loudnorm=print_format=json", "-f", "null", "-"]);
  const start = stderr.lastIndexOf("{");
  const end = stderr.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error(`loudnorm JSON not found:\n${stderr}`);
  const stats = JSON.parse(stderr.slice(start, end + 1)) as LoudnessStats;
  return { i: Number(stats.input_i), tp: Number(stats.input_tp) };
};

/** Stereo-linked look-ahead peak limiter after a gain stage. */
export const master = (src: Stereo, gainDb: number, ceiling: number): Stereo => {
  const n = src.l.length;
  const g = Math.pow(10, gainDb / 20);
  const look = Math.round(0.003 * SR);
  const need = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const p = Math.max(Math.abs(src.l[i]), Math.abs(src.r[i])) * g;
    need[i] = p > ceiling ? ceiling / p : 1;
  }
  // Running minimum over the look-ahead window (monotonic deque).
  const target = new Float32Array(n);
  const dq = new Int32Array(n);
  let head = 0;
  let tail = 0;
  for (let i = n - 1; i >= 0; i--) {
    while (tail > head && need[dq[tail - 1]] >= need[i]) tail--;
    dq[tail++] = i;
    while (dq[head] > i + look) head++;
    target[i] = need[dq[head]];
  }
  const atk = 1 - Math.exp(-4 / look);
  const rel = 1 - Math.exp(-1 / (0.08 * SR));
  const out = makeStereo(n / SR);
  let env = 1;
  for (let i = 0; i < n; i++) {
    const tg = target[i];
    env += (tg - env) * (tg < env ? atk : rel);
    const l = src.l[i] * g * env;
    const r = src.r[i] * g * env;
    out.l[i] = Math.max(-ceiling, Math.min(ceiling, l));
    out.r[i] = Math.max(-ceiling, Math.min(ceiling, r));
  }
  return out;
};

/** Gain + limiter passes until the file measures ~targetLufs and <= targetTp, then write it to `out`. */
export const writeMastered = (bgm: Stereo, out: string, tag: string, targetLufs: number, targetTp: number): void => {
  const tmp = join(tmpdir(), `${tag}-bgm-${process.pid}.wav`);
  try {
    writeWav(tmp, normalizePeak(bgm, 0.5));
    const raw = measure(tmp);
    let gainDb = targetLufs - raw.i;
    let ceiling = Math.pow(10, (targetTp - 0.5) / 20);
    let last = raw;
    for (let pass = 1; pass <= 6; pass++) {
      writeWav(tmp, master(bgm, gainDb, ceiling));
      last = measure(tmp);
      console.log(
        `  pass ${pass}: gain ${gainDb.toFixed(2)} dB, ceiling ${(20 * Math.log10(ceiling)).toFixed(2)} dBFS -> ` +
          `${last.i.toFixed(2)} LUFS / ${last.tp.toFixed(2)} dBTP`,
      );
      const loudOk = Math.abs(last.i - targetLufs) <= 0.15;
      const peakOk = last.tp <= targetTp;
      if (loudOk && peakOk) break;
      if (!peakOk) ceiling *= Math.pow(10, (targetTp - 0.1 - last.tp) / 20);
      gainDb += targetLufs - last.i;
    }
    copyFileSync(tmp, out);
    console.log(`wrote ${out} (${(bgm.l.length / SR).toFixed(2)}s) ${last.i.toFixed(2)} LUFS / ${last.tp.toFixed(2)} dBTP`);
  } finally {
    unlinkSync(tmp);
  }
};
