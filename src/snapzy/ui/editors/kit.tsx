import type { CSSProperties, FC, ReactNode } from "react";
import { FONT_TEXT, pt, ui } from "../../theme";

// Shared building blocks for the Snapzy editor replicas: line icons drawn as
// inline SVG, traffic lights, sliders and the left "background" panel that the
// annotate editor and the video editor both use. Everything is a pure function
// of its props.

export type IconName =
  | "crop"
  | "layers"
  | "rotateL"
  | "rotateR"
  | "select"
  | "rect"
  | "filledRect"
  | "ellipse"
  | "arrow"
  | "curvedArrow"
  | "line"
  | "text"
  | "highlight"
  | "blur"
  | "cropFrame"
  | "counter"
  | "polygon"
  | "pen"
  | "magic"
  | "undo"
  | "redo"
  | "chevronDown"
  | "chevronUp"
  | "chevronLeft"
  | "chevronRight"
  | "search"
  | "close"
  | "pin"
  | "collapse"
  | "image"
  | "video"
  | "scissors"
  | "trash"
  | "zoomIn"
  | "quality"
  | "dimensions"
  | "audio"
  | "cube"
  | "annotate"
  | "eye"
  | "save"
  | "share"
  | "copy"
  | "grip"
  | "plus"
  | "speed"
  | "rewind"
  | "forward"
  | "play"
  | "pause"
  | "dashLine"
  | "triangle"
  | "dot"
  | "landscape"
  | "portrait"
  | "film";

const PATHS: Record<IconName, ReactNode> = {
  crop: <path d="M6 2v14a2 2 0 0 0 2 2h14M2 6h14a2 2 0 0 1 2 2v14" />,
  layers: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2.5" />
      <path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" />
    </>
  ),
  rotateL: (
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5" />
      <path d="M3.5 3.5v5h5" />
    </>
  ),
  rotateR: (
    <>
      <path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1l2.6 2.6" />
      <path d="M20.5 3.5v5h-5" />
    </>
  ),
  select: <path d="M6 3.5l13 6.6-5.6 1.8-2 5.9z" />,
  rect: <rect x="4" y="5.5" width="16" height="13" rx="2.2" />,
  filledRect: <rect x="4" y="5.5" width="16" height="13" rx="2.2" fill="currentColor" />,
  ellipse: <circle cx="12" cy="12" r="8.2" />,
  arrow: <path d="M5.5 18.5L18.5 5.5M9 5.5h9.5V15" />,
  curvedArrow: <path d="M5 19c0-7 5-12 13-12M14.5 3.5L18.5 7l-3.8 3.8" />,
  line: <path d="M5 19L19 5" />,
  text: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
      <path d="M8 16.5l4-9 4 9M9.4 13.6h5.2" />
    </>
  ),
  highlight: <path d="M14.5 4.5l5 5L9 20H4v-5zM12 7l5 5" />,
  blur: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
      <path d="M4 4l16 16" />
    </>
  ),
  cropFrame: (
    <path d="M4 9V6.5A2.5 2.5 0 0 1 6.5 4H9M15 4h2.5A2.5 2.5 0 0 1 20 6.5V9M20 15v2.5a2.5 2.5 0 0 1-2.5 2.5H15M9 20H6.5A2.5 2.5 0 0 1 4 17.5V15" />
  ),
  counter: <path d="M9.5 6h11M9.5 12h11M9.5 18h11M4.2 6h.01M4.2 12h.01M4.2 18h.01" strokeWidth="2.6" />,
  polygon: <path d="M12 3.2l8 5.8-3 9.8H7L4 9z" />,
  pen: <path d="M4.5 19.5l1-4.2L16.8 4l3.2 3.2L8.7 18.5zM14.5 6.4l3.2 3.2" />,
  magic: <path d="M5 19l10-10M14 3.5v3M12.5 5h3M19.5 11v3M18 12.5h3M9 3.5v.01" />,
  undo: <path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />,
  redo: <path d="M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3" />,
  chevronDown: <path d="M6 9.5l6 6 6-6" />,
  chevronUp: <path d="M6 14.5l6-6 6 6" />,
  chevronLeft: <path d="M14.5 6l-6 6 6 6" />,
  chevronRight: <path d="M9.5 6l6 6-6 6" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5L20.5 20.5" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  pin: <path d="M12 16.5V22M8 3h8l-1 7 3 3.5H6L9 10z" />,
  collapse: <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />,
  image: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <circle cx="8.5" cy="10" r="1.6" />
      <path d="M21 16l-5-5-9 8.5" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="6" width="13" height="12" rx="2.5" />
      <path d="M16 10.5l5-3v9l-5-3" />
    </>
  ),
  scissors: (
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12" />
    </>
  ),
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />,
  zoomIn: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5L20.5 20.5M8 10.5h5M10.5 8v5" />
    </>
  ),
  quality: (
    <>
      <rect x="3" y="4" width="18" height="12.5" rx="2.2" />
      <path d="M8 20.5h8M12 16.5v4M12 7.5v6M9 10.5h6" />
    </>
  ),
  dimensions: (
    <>
      <rect x="3.5" y="4" width="17" height="16" rx="2.5" />
      <path d="M3.5 9.5h17M9.5 9.5V20" />
    </>
  ),
  audio: <path d="M4 9.5h3.8L13 5v14l-5.2-4.5H4zM16.5 9a4.5 4.5 0 0 1 0 6" />,
  cube: <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5" />,
  annotate: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.3 15.7l1-3.2 5.4-5.4 2.2 2.2-5.4 5.4z" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  save: <path d="M12 4v11M7 10.5l5 5 5-5M4.5 20h15" />,
  share: <path d="M12 15V4M8 8l4-4 4 4M5.5 12v7.5h13V12" />,
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15" />
    </>
  ),
  grip: <path d="M6 8h12M6 12h12M6 16h12" />,
  plus: <path d="M12 5v14M5 12h14" />,
  speed: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  rewind: <path d="M11.5 6.5v11L3.5 12zM20.5 6.5v11L12.5 12z" fill="currentColor" strokeWidth="1.2" />,
  forward: <path d="M12.5 6.5v11l8-5.5zM3.5 6.5v11L11.5 12z" fill="currentColor" strokeWidth="1.2" />,
  play: <path d="M8 5.5v13l11-6.5z" fill="currentColor" strokeWidth="1.4" />,
  pause: (
    <>
      <rect x="6.5" y="5" width="3.8" height="14" rx="1" fill="currentColor" />
      <rect x="13.7" y="5" width="3.8" height="14" rx="1" fill="currentColor" />
    </>
  ),
  dashLine: <path d="M4 12h16" />,
  triangle: <path d="M7 5.5v13l11-6.5z" fill="currentColor" />,
  dot: <circle cx="12" cy="12" r="6" fill="currentColor" />,
  landscape: <rect x="3.5" y="6.5" width="17" height="11" rx="2" />,
  portrait: <rect x="6.5" y="3.5" width="11" height="17" rx="2" />,
  film: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="M8 4.5v15M16 4.5v15M3.5 9.5H8M3.5 14.5H8M16 9.5h4.5M16 14.5h4.5" />
    </>
  ),
};

export const Icon: FC<{ name: IconName; size?: number; color?: string; sw?: number; style?: CSSProperties }> = ({
  name,
  size = pt(18),
  color = "currentColor",
  sw = 1.7,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ color, flex: "none", display: "block", ...style }}
  >
    {PATHS[name]}
  </svg>
);

export const TrafficLights: FC<{ size?: number; gap?: number; dim?: boolean }> = ({
  size = pt(12),
  gap = pt(8),
  dim = false,
}) => (
  <div style={{ display: "flex", gap, alignItems: "center" }}>
    {[ui.red, ui.yellow, ui.green].map((c) => (
      <div
        key={c}
        style={{
          width: size,
          height: size,
          borderRadius: size,
          background: dim ? "rgba(255,255,255,0.18)" : c,
          boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.25)",
        }}
      />
    ))}
  </div>
);

/** Style for a control drawn in its pressed state. */
export const pressedStyle = (on: boolean): CSSProperties =>
  on ? { transform: "scale(0.92)", filter: "brightness(1.3)" } : {};

/** Dark window shell with rounded corners and a hairline border. */
export const WindowShell: FC<{ width: number; height: number; children: ReactNode; style?: CSSProperties }> = ({
  width,
  height,
  children,
  style,
}) => (
  <div
    style={{
      position: "relative",
      width,
      height,
      borderRadius: pt(14),
      background: ui.window,
      overflow: "hidden",
      boxShadow: `0 0 0 1px rgba(255,255,255,0.1), 0 ${pt(22)}px ${pt(60)}px rgba(0,0,0,0.5)`,
      fontFamily: FONT_TEXT,
      color: ui.text,
      fontSize: pt(13),
      ...style,
    }}
  >
    {children}
  </div>
);

// ----- swatches -----

export const GRADIENTS: [string, string][] = [
  ["#ff7a59", "#f0457a"],
  ["#8b7cf8", "#4ab0ff"],
  ["#3ecf8e", "#3aa6d8"],
  ["#ffa03c", "#ff5e62"],
  ["#ea62d6", "#7a4cff"],
  ["#34d399", "#2563eb"],
  ["#ffd94a", "#ff9f1c"],
  ["#8fdcff", "#2f7bff"],
];

export const gradientCss = (i: number): string => {
  const g = GRADIENTS[((i % GRADIENTS.length) + GRADIENTS.length) % GRADIENTS.length];
  return `linear-gradient(135deg, ${g[0]}, ${g[1]})`;
};

export const WALLPAPERS: string[] = [
  "radial-gradient(circle at 30% 70%, #5b7bff 0, #1a2a9a 45%, #0b1030 100%)",
  "radial-gradient(circle at 70% 30%, #ffd1a3 0, #f0703f 50%, #6a2a50 100%)",
  "conic-gradient(from 200deg at 50% 50%, #f5a9ff, #8fb4ff, #bff5ff, #d6b3ff, #f5a9ff)",
  "radial-gradient(circle at 25% 25%, #ff8ad8 0, #a54bff 55%, #3b1c8c 100%)",
  "linear-gradient(160deg, #7b8cff 0, #3a2fa0 50%, #1a1a5a 100%)",
  "conic-gradient(from 90deg at 40% 60%, #2a6bff, #b9a7ff, #1a1f6a, #62d0ff, #2a6bff)",
  "conic-gradient(from 0deg at 50% 50%, #0b0b1f, #3a5fd0, #0b0b1f, #7a8cff, #0b0b1f)",
  "radial-gradient(circle at 60% 40%, #3a3a46 0, #14141c 70%)",
  "radial-gradient(circle at 50% 50%, #8a8a8a 0, #5a5a5e 100%)",
  "radial-gradient(circle at 50% 50%, #ffffff 0, #d9d9de 100%)",
  "linear-gradient(170deg, #3a5fff 0, #0a1a8a 55%, #08103a 100%)",
  "linear-gradient(150deg, #d8f0ff 0, #5aa2ff 45%, #1f4fd0 100%)",
];

export const BLURRED: string[] = [
  "radial-gradient(circle at 30% 30%, #ff9a6a, #6a4cff)",
  "radial-gradient(circle at 70% 60%, #5ad0ff, #2a2fa0)",
  "radial-gradient(circle at 40% 70%, #7affb8, #2a6aa0)",
  "radial-gradient(circle at 60% 30%, #ffd86a, #c0407a)",
  "radial-gradient(circle at 50% 50%, #c8a0ff, #3a3a8a)",
  "radial-gradient(circle at 30% 60%, #ffffff, #7a8aa0)",
];

export const COLOR_DOTS = [
  "#e8604c",
  "#e8a04c",
  "#f0d94a",
  "#6ec65a",
  "#4a8ef0",
  "#c660e0",
  "#e05068",
  "#a0a0a8",
  "#ffffff",
  "#101014",
];

// ----- background panel geometry (shared by the render and the hotspots) -----

const PANEL_PAD_X = pt(16);
const PANEL_GAP = pt(7);
const GRID_PAD = pt(3);
const TITLE_H = pt(16);
const TITLE_TOP = pt(14);
const TITLE_BOTTOM = pt(8);
const TITLE_BLOCK = TITLE_TOP + TITLE_H + TITLE_BOTTOM;
const PRESET_H = pt(34);
const DIVIDER_TOP = pt(14);
const DIVIDER_BOTTOM = pt(4);
const SLIDER_TOP = pt(10);
const SLIDER_HEAD = pt(20);
const SLIDER_TRACK_TOP = pt(3);
const SLIDER_THUMB = pt(15);
const SLIDER_H = SLIDER_TOP + SLIDER_HEAD + SLIDER_TRACK_TOP + SLIDER_THUMB;

const gridHeight = (rows: number, size: number): number => rows * size + (rows - 1) * PANEL_GAP + GRID_PAD * 2;

export type PanelLayout = {
  inner: number;
  swatch: number;
  colorSwatch: number;
  /** Center of gradient swatch i, relative to the panel's top-left at scroll 0. */
  gradient: (i: number) => { x: number; y: number };
  /** Slider track: thumb center runs x0..x1 as value goes 0..max; y is the track center (scroll 0). */
  sliders: { padding: SliderTrack; shadow: SliderTrack; corners: SliderTrack };
};
export type SliderTrack = { x0: number; x1: number; y: number };

export const panelLayout = (width: number, compact: boolean): PanelLayout => {
  const inner = width - PANEL_PAD_X * 2 - pt(6);
  const swatch = (inner - pt(6) - PANEL_GAP * 5) / 6;
  const colorSwatch = (inner - pt(6) - PANEL_GAP * 7) / 8;
  let y = compact ? 0 : TITLE_BLOCK + PRESET_H + GRID_PAD * 2;
  const gradTop = y + TITLE_BLOCK + GRID_PAD;
  y += TITLE_BLOCK + gridHeight(2, swatch);
  y += TITLE_BLOCK + gridHeight(3, swatch);
  if (!compact) y += TITLE_BLOCK + gridHeight(2, swatch);
  y += TITLE_BLOCK + gridHeight(2, colorSwatch);
  y += DIVIDER_TOP + 1 + DIVIDER_BOTTOM;
  const track = (k: number): SliderTrack => ({
    x0: PANEL_PAD_X + SLIDER_THUMB / 2,
    x1: PANEL_PAD_X + inner - SLIDER_THUMB / 2,
    y: y + k * SLIDER_H + SLIDER_TOP + SLIDER_HEAD + SLIDER_TRACK_TOP + SLIDER_THUMB / 2,
  });
  return {
    inner,
    swatch,
    colorSwatch,
    gradient: (i) => ({
      x: PANEL_PAD_X + GRID_PAD + (i % 6) * (swatch + PANEL_GAP) + swatch / 2,
      y: gradTop + Math.floor(i / 6) * (swatch + PANEL_GAP) + swatch / 2,
    }),
    sliders: { padding: track(0), shadow: track(1), corners: track(2) },
  };
};

const SectionTitle: FC<{ children: ReactNode }> = ({ children }) => (
  <div
    style={{
      fontSize: pt(12),
      color: ui.secondary,
      fontWeight: 500,
      height: TITLE_H,
      lineHeight: `${TITLE_H}px`,
      margin: `${TITLE_TOP}px 0 ${TITLE_BOTTOM}px`,
    }}
  >
    {children}
  </div>
);

const AddTile: FC<{ size: number; round?: boolean }> = ({ size, round }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: round ? size : pt(7),
      border: `1px dashed rgba(255,255,255,0.28)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: ui.secondary,
      boxSizing: "border-box",
    }}
  >
    <Icon name="plus" size={size * 0.55} sw={1.8} />
  </div>
);

const Swatch: FC<{ background: string; size: number; selected?: boolean; pressed?: boolean; round?: boolean }> = ({
  background,
  size,
  selected,
  pressed,
  round,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: round ? size : pt(7),
      background,
      boxSizing: "border-box",
      boxShadow: selected
        ? `0 0 0 ${pt(1.5)}px ${ui.window}, 0 0 0 ${pt(3)}px ${ui.accent}`
        : "inset 0 0 0 1px rgba(255,255,255,0.12)",
      ...pressedStyle(!!pressed),
    }}
  />
);

const SwatchGrid: FC<{ cols: number; size: number; gap: number; children: ReactNode }> = ({
  cols,
  size,
  gap,
  children,
}) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${size}px)`, gap, padding: GRID_PAD }}>
    {children}
  </div>
);

export const Slider: FC<{ label: string; value: number; max: number; display?: string }> = ({
  label,
  value,
  max,
  display,
}) => {
  const f = Math.max(0, Math.min(1, value / max));
  const thumb = SLIDER_THUMB;
  return (
    <div style={{ marginTop: SLIDER_TOP }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: pt(12), color: ui.secondary }}>{label}</span>
        <span
          style={{
            minWidth: pt(54),
            height: SLIDER_HEAD,
            padding: `0 ${pt(8)}px`,
            boxSizing: "border-box",
            borderRadius: pt(6),
            background: "rgba(255,255,255,0.07)",
            fontSize: pt(12),
            color: ui.secondary,
            textAlign: "right",
            lineHeight: `${SLIDER_HEAD}px`,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {display ?? Math.round(value)}
        </span>
      </div>
      <div style={{ position: "relative", height: thumb, marginTop: SLIDER_TRACK_TOP }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: (thumb - pt(3)) / 2,
            height: pt(3),
            borderRadius: pt(2),
            background: "rgba(255,255,255,0.14)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            width: `calc(${f * 100}% - ${f * thumb}px + ${thumb / 2}px)`,
            top: (thumb - pt(3)) / 2,
            height: pt(3),
            borderRadius: pt(2),
            background: ui.accent,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: `calc(${f * 100}% - ${f * thumb}px)`,
            width: thumb,
            height: thumb,
            borderRadius: thumb,
            background: "#e9e9ee",
            boxShadow: "0 1px 3px rgba(0,0,0,0.5)",
          }}
        />
      </div>
    </div>
  );
};

export type BackgroundPanelProps = {
  width: number;
  height: number;
  selectedGradient: number | null;
  padding: number;
  corners: number;
  shadow: number;
  pressed?: string;
  /** Scroll offset in px (content moves up). */
  scroll?: number;
  /** Compact variant used by the video editor (no presets, no blurred row). */
  compact?: boolean;
};

/** The scrolling "Presets / Gradients / Wallpapers ..." panel. */
export const BackgroundPanel: FC<BackgroundPanelProps> = ({
  width,
  height,
  selectedGradient,
  padding,
  corners,
  shadow,
  pressed,
  scroll = 0,
  compact = false,
}) => {
  const L = panelLayout(width, compact);
  const padX = PANEL_PAD_X;
  const inner = L.inner;
  const gap = PANEL_GAP;
  const size = L.swatch;
  const colorSize = L.colorSwatch;
  const ratios = ["Original", "Free", "1:1", "4:3", "3:2", "16:9"];

  return (
    <div style={{ position: "relative", width, height, overflow: "hidden", background: ui.sidebar }}>
      <div
        style={{
          position: "absolute",
          left: padX,
          top: 0,
          width: inner,
          display: "flex",
          flexDirection: "column",
          transform: `translateY(${-scroll}px)`,
        }}
      >
        {!compact && (
          <>
            <SectionTitle>Presets</SectionTitle>
            <div style={{ display: "flex", gap: pt(8), padding: GRID_PAD }}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: PRESET_H,
                    borderRadius: pt(8),
                    background: gradientCss(i * 2 + 1),
                    position: "relative",
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: `${pt(6) + i * 1.5}px ${pt(8) + i * 2}px`,
                      borderRadius: pt(3),
                      background: "rgba(20,22,30,0.82)",
                    }}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        <SectionTitle>Gradients</SectionTitle>
        <SwatchGrid cols={6} size={size} gap={gap}>
          {GRADIENTS.map((_, i) => (
            <Swatch
              key={i}
              background={gradientCss(i)}
              size={size}
              selected={selectedGradient === i}
              pressed={pressed === `gradient-${i}`}
            />
          ))}
        </SwatchGrid>

        <SectionTitle>Wallpapers</SectionTitle>
        <SwatchGrid cols={6} size={size} gap={gap}>
          {WALLPAPERS.map((w, i) => (
            <Swatch key={i} background={w} size={size} pressed={pressed === `wallpaper-${i}`} />
          ))}
          <AddTile size={size} />
        </SwatchGrid>

        {!compact && (
          <>
            <SectionTitle>Blurred</SectionTitle>
            <SwatchGrid cols={6} size={size} gap={gap}>
              {BLURRED.map((w, i) => (
                <div key={i} style={{ width: size, height: size, borderRadius: pt(7), overflow: "hidden" }}>
                  <div style={{ width: "100%", height: "100%", background: w, filter: "blur(3px)", transform: "scale(1.3)" }} />
                </div>
              ))}
              <AddTile size={size} />
            </SwatchGrid>
          </>
        )}

        <SectionTitle>Colors</SectionTitle>
        <SwatchGrid cols={8} size={colorSize} gap={gap}>
          {COLOR_DOTS.map((c) => (
            <Swatch key={c} background={c} size={colorSize} round />
          ))}
          <AddTile size={colorSize} round />
        </SwatchGrid>

        <div style={{ height: 1, background: ui.separator, margin: `${DIVIDER_TOP}px 0 ${DIVIDER_BOTTOM}px` }} />

        <Slider label="Padding" value={padding} max={100} />
        <Slider label="Shadow" value={shadow} max={100} />
        <Slider label="Corners" value={corners} max={40} />

        {!compact && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                margin: `${pt(18)}px 0 ${pt(8)}px`,
              }}
            >
              <span style={{ fontSize: pt(13), fontWeight: 500 }}>Background Ratio</span>
              <div style={{ display: "flex", gap: pt(4) }}>
                <div
                  style={{
                    width: pt(26),
                    height: pt(20),
                    borderRadius: pt(5),
                    background: ui.accentSoft,
                    color: ui.accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `inset 0 0 0 1px ${ui.accent}`,
                  }}
                >
                  <Icon name="landscape" size={pt(13)} sw={2} />
                </div>
                <div
                  style={{
                    width: pt(26),
                    height: pt(20),
                    borderRadius: pt(5),
                    color: ui.secondary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="portrait" size={pt(13)} sw={2} />
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: pt(8) }}>
              {ratios.map((r, i) => (
                <div
                  key={r}
                  style={{
                    height: pt(30),
                    borderRadius: pt(15),
                    background: "rgba(255,255,255,0.07)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: pt(12.5),
                    fontWeight: i === 0 ? 600 : 500,
                    color: i === 0 ? ui.accent : ui.text,
                    boxShadow: i === 0 ? `inset 0 0 0 ${pt(1.5)}px ${ui.accent}` : "none",
                  }}
                >
                  {r}
                </div>
              ))}
            </div>
            <div style={{ fontSize: pt(13), fontWeight: 500, margin: `${pt(18)}px 0 ${pt(8)}px` }}>Alignment</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: pt(3),
                width: pt(86),
                padding: pt(4),
                borderRadius: pt(8),
                background: "rgba(255,255,255,0.05)",
              }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  style={{
                    height: pt(24),
                    borderRadius: pt(4),
                    background: i === 4 ? ui.accent : "rgba(255,255,255,0.12)",
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {/* scrollbar */}
      <div
        style={{
          position: "absolute",
          right: pt(4),
          top: pt(8),
          width: pt(5),
          height: height * 0.52,
          borderRadius: pt(3),
          background: "rgba(255,255,255,0.28)",
          transform: `translateY(${Math.min(height * 0.4, scroll * 0.4)}px)`,
        }}
      />
    </div>
  );
};

/** Largest uniform scale at which (w x h) fits inside (boxW x boxH). */
export const fitScale = (boxW: number, boxH: number, w: number, h: number): number =>
  Math.max(0.0001, Math.min(boxW / w, boxH / h));
