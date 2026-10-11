import { fonts } from "./fonts";

export { fonts };

/**
 * v3 palette: "Clay & butter" (plan B).
 * - butter: title scenes (flat background)
 * - clay:   operation scenes (flat background under the dark app window)
 * - ink:    all text on butter / clay
 * - tomato: emphasis words, underlines, arrows
 * - cocoa:  second accent (doodles, notes)
 * Warm, flat colors only (no cold or electric hues).
 */
export const palette = {
  butter: "#f7e2a6",
  butterLight: "#fbeec2",
  butterDeep: "#eccf86",

  clay: "#e8a87c",
  clayLight: "#f0c39f",
  clayDeep: "#d98f66",

  ink: "#3b2417",
  inkSoft: "rgba(59, 36, 23, 0.74)",
  inkFaint: "rgba(59, 36, 23, 0.42)",

  tomato: "#d9482b",
  tomatoDeep: "#b5371d",

  cocoa: "#7a4a2e",
  cocoaLight: "#a06a48",
} as const;

/** Soft drop shadows only. */
export const shadows = {
  /** Under the app window on the stage. */
  window: "0 44px 90px rgba(70, 40, 20, 0.28), 0 10px 24px rgba(70, 40, 20, 0.16)",
  /** Small paper cards, chips. */
  card: "0 14px 30px rgba(70, 40, 20, 0.22)",
} as const;

/** Stroke widths for hand-drawn lines (px at 1920x1080). */
export const strokes = {
  underline: 9,
  arrow: 6,
  doodle: 5,
} as const;

// Tokens for src/ui/ (the dark app replicas): the real app's own colors.
export { colors, radius, status } from "./app-colors";
