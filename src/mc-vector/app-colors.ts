// Colors of the real MC-Vector app, which is dark-only. src/ui/ recreates the
// app window with these. The video's own warm palette lives in ./theme.

export const zinc = {
  bg: "#07080d",
  window: "#0f0f11",
  panel: "#18181b",
  border: "#27272a",
  borderStrong: "#3f3f46",
  hover: "#3f3f46",
  text: "#f4f4f5",
  textSecondary: "#d4d4d8",
  textMuted: "#a1a1aa",
  textFaint: "#71717a",
  editorBg: "#111214",
  editorText: "#e4e4e7",
} as const;

export const status = {
  success: "#10b981",
  danger: "#ef4444",
  warning: "#eab308",
  info: "#3b82f6",
  offline: "#71717a",
  crashed: "#fca5a5",
} as const;

/** Chart lines in the dashboard replica. */
const chart = {
  sky: "#38bdf8",
  green: "#22c55e",
} as const;

/** Gold of the icon's arrow (sampled from public/mc-vector/brand/icon.png). */
const gold = "#e8b030";

/** App-replica colors (dark). Used by src/ui/ and src/ops/. */
export const colors = { ...zinc, ...status, ...chart, gold } as const;

export const radius = {
  card: 16,
  control: 8,
  pill: 999,
} as const;
