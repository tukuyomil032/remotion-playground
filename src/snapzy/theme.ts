// Look of the Snapzy video. The frame is a 1440 x 810 pt Mac screen drawn at
// 1920 x 1080, so 1 pt = 4/3 px. Fonts are the system's SF Pro (installed on
// this Mac; nothing is bundled). Colors of the app UI are sampled from Snapzy
// v2.1.0-beta.6 screenshots (dark appearance).

/** Points to pixels. */
export const pt = (n: number): number => (n * 4) / 3;

export const FONT_TEXT = '"SF Pro Text", "SF Pro", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';
export const FONT_DISPLAY =
  '"SF Pro Display", "SF Pro", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';
export const FONT_MONO = '"SF Mono", Menlo, monospace';

/** Snapzy's dark UI. */
export const ui = {
  window: "#1e1f24",
  sidebar: "#25262c",
  panel: "#2a2b31",
  field: "#34353c",
  control: "#3a3b42",
  separator: "rgba(255,255,255,0.08)",
  text: "#ececef",
  secondary: "#9c9ca4",
  tertiary: "#6d6e76",
  accent: "#1e78ff",
  accentSoft: "rgba(30,120,255,0.18)",
  red: "#ff5f57",
  yellow: "#febc2e",
  green: "#28c840",
  beta: "#f0a24a",
  trim: "#f5c518",
} as const;

/** The video's own colors: the icon's blue on a deep night-blue desktop. */
export const brand = {
  blue: "#1a4dff",
  blueLight: "#5b84ff",
  ink: "#0b1026",
  white: "#ffffff",
} as const;
