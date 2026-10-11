import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";
import { loadFont as loadDancing } from "@remotion/google-fonts/DancingScript";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadPacifico } from "@remotion/google-fonts/Pacifico";
import { cancelRender, continueRender, delayRender } from "remotion";

// v3 type roles. One screen uses at most two of the three script faces.

// Main headlines ("Create.", "Run." ...).
const dancing = loadDancing("normal", { weights: ["600", "700"], subsets: ["latin"] });

// Emphasis words and the Hook / Outro punch lines.
const pacifico = loadPacifico("normal", { weights: ["400"], subsets: ["latin"] });

// Hand-written notes, checklists, callouts.
const caveat = loadCaveat("normal", { weights: ["500", "700"], subsets: ["latin"] });

// App UI replicas (src/ui/) and the one-line explanations.
const inter = loadInter("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

// Commands and code.
const mono = loadJetBrainsMono("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
});

export const fonts = {
  /** Dancing Script 600/700. Main headlines. */
  script: dancing.fontFamily,
  /** Pacifico 400. Emphasis words, punch lines. */
  emphasis: pacifico.fontFamily,
  /** Caveat 500/700. Hand-written notes, checklists, callouts. */
  note: caveat.fontFamily,
  /** Inter 400-800. App UI and one-line explanations. */
  ui: inter.fontFamily,
  /** JetBrains Mono 400-700. Commands and code. */
  mono: mono.fontFamily,
} as const;

/** Resolves once every font face above is ready. */
export const fontsReady: Promise<void> = Promise.all([
  dancing.waitUntilDone(),
  pacifico.waitUntilDone(),
  caveat.waitUntilDone(),
  inter.waitUntilDone(),
  mono.waitUntilDone(),
]).then(() => undefined);

// Block rendering until every face is in, so no frame (and no measured
// layout) is ever drawn with a fallback font.
const fontHandle = delayRender("Loading fonts (Dancing Script, Pacifico, Caveat, Inter, JetBrains Mono)");
fontsReady.then(() => continueRender(fontHandle)).catch((err: unknown) => cancelRender(err));
