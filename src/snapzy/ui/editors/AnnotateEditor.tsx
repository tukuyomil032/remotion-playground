import type { CSSProperties, FC, ReactNode } from "react";
import { pt, ui } from "../../theme";
import {
  BackgroundPanel,
  fitScale,
  GRADIENTS,
  gradientCss,
  Icon,
  panelLayout,
  pressedStyle,
  TrafficLights,
  WindowShell,
  type IconName,
} from "./kit";

export type AnnotateTool =
  | "select"
  | "rect"
  | "filledRect"
  | "ellipse"
  | "arrow"
  | "line"
  | "text"
  | "highlight"
  | "blur"
  | "counter"
  | "crop";

export type AnnotateMode = "annotate" | "mockup" | "preview";

export type AnnotateEditorProps = {
  width: number;
  height: number;
  tool: AnnotateTool;
  mode: AnnotateMode;
  showBackgroundPanel: boolean;
  /** Index into the 8 gradient swatches, or null for none. */
  selectedGradient: number | null;
  /** Slider value 0..100. */
  padding: number;
  /** Corner radius of the screenshot, 0..40. */
  corners: number;
  /** Shadow strength 0..100. */
  shadow: number;
  zoomLabel: string;
  /** Id of a control drawn pressed: "done", "save-as", "tool-arrow", "mode-mockup", "gradient-2", ... */
  pressed?: string;
  /** Natural size of `children` in px (the screenshot is scaled to fit the canvas). */
  contentWidth?: number;
  contentHeight?: number;
  /** Scroll offset of the left panel, px. */
  panelScroll?: number;
  /** Selected tilt preset (0..7) in the Mockup tab. */
  mockupPreset?: number;
  /**
   * Annotation overlay (CurvedArrow, MarkRect, ...) in content coordinates. It is
   * drawn on top of `children` inside the same scaled / tilted box, so it follows
   * padding, corners and the Mockup tilt. Not clipped to the rounded corners.
   */
  overlay?: ReactNode;
  /** The screenshot being edited; its coordinate space is contentWidth x contentHeight. */
  children?: ReactNode;
};

const TOP_H = pt(52);
const SET_H = pt(44);
const BOT_H = pt(46);
const PANEL_W = pt(214);
const WIN_PAD = pt(16);
const TB_BTN = pt(32);
const TB_GAP = pt(2);
const SEP_MARGIN = pt(6);
const SEP_W = 1 + SEP_MARGIN * 2;
const LIGHTS_W = pt(12) * 3 + pt(8) * 2;
const LIGHTS_GAP = pt(26);
const SAVE_W = pt(86);
const DONE_W = pt(64);
const RIGHT_GAP = pt(10);
const ZOOM_W = pt(66);
const SEG_PAD = pt(2);
const MODE_W: Record<AnnotateMode, number> = { annotate: pt(98), mockup: pt(92), preview: pt(90) };
const MARGIN = pt(30);
const MOCKUP_RESERVE = pt(76);
const PAD_UNIT = 1.2;
const DEFAULT_CONTENT_W = 960;
const DEFAULT_CONTENT_H = 600;

type TbItem = { kind: "sep" } | { kind: "btn"; key: string; icon: IconName; toolId?: string; alwaysDim?: boolean };

const TOOLS: { id: string; icon: IconName }[] = [
  { id: "select", icon: "select" },
  { id: "rect", icon: "rect" },
  { id: "filledRect", icon: "filledRect" },
  { id: "ellipse", icon: "ellipse" },
  { id: "arrow", icon: "arrow" },
  { id: "line", icon: "line" },
  { id: "text", icon: "text" },
  { id: "highlight", icon: "highlight" },
  { id: "blur", icon: "blur" },
  { id: "crop", icon: "cropFrame" },
  { id: "counter", icon: "counter" },
  { id: "polygon", icon: "polygon" },
  { id: "pen", icon: "pen" },
  { id: "magic", icon: "magic" },
];

const toolIcon = (tool: AnnotateTool): IconName => TOOLS.find((t) => t.id === tool)?.icon ?? "arrow";

const TOOLBAR: TbItem[] = [
  { kind: "btn", key: "top-crop", icon: "crop" },
  { kind: "btn", key: "top-layers", icon: "layers" },
  { kind: "sep" },
  { kind: "btn", key: "rotateL", icon: "rotateL" },
  { kind: "btn", key: "rotateR", icon: "rotateR" },
  { kind: "sep" },
  ...TOOLS.map((t): TbItem => ({ kind: "btn", key: `tool-${t.id}`, icon: t.icon, toolId: t.id })),
  { kind: "sep" },
  { kind: "btn", key: "undo", icon: "undo" },
  { kind: "btn", key: "redo", icon: "redo", alwaysDim: true },
];

/** Left edge of each toolbar item (and its width), from the shared constants. */
const toolbarPositions = (): { item: TbItem; x: number; w: number }[] => {
  let x = WIN_PAD + LIGHTS_W + LIGHTS_GAP;
  return TOOLBAR.map((item) => {
    const w = item.kind === "sep" ? SEP_W : TB_BTN;
    const out = { item, x, w };
    x += w + TB_GAP;
    return out;
  });
};

/** Pure geometry of the canvas (the screenshot frame) inside the window. */
const canvasPlacement = (p: {
  width: number;
  height: number;
  mode: AnnotateMode;
  showBackgroundPanel: boolean;
  contentWidth: number;
  contentHeight: number;
  padding: number;
}) => {
  const canvasLeft = p.showBackgroundPanel ? PANEL_W : 0;
  const canvasTop = TOP_H + SET_H;
  const canvasW = p.width - canvasLeft;
  const canvasH = p.height - canvasTop - BOT_H;
  const reserve = p.mode === "mockup" ? MOCKUP_RESERVE : 0;
  const padU = p.padding * PAD_UNIT;
  const fullW = p.contentWidth + padU * 2;
  const fullH = p.contentHeight + padU * 2;
  const scale = fitScale(canvasW - MARGIN * 2, canvasH - MARGIN * 2 - reserve, fullW, fullH);
  return { canvasLeft, canvasTop, canvasW, canvasH, reserve, padU, fullW, fullH, scale };
};

export type Pt = { x: number; y: number };
export type SliderHotspot = { x0: number; x1: number; y: number };

export type AnnotateHotspots = {
  tools: Record<AnnotateTool, Pt>;
  done: Pt;
  saveAs: Pt;
  modes: Record<AnnotateMode, Pt>;
  gradients: Pt[];
  padding: SliderHotspot;
  corners: SliderHotspot;
  shadow: SliderHotspot;
  /** content (cx, cy) -> component (x + cx * scale, y + cy * scale). Ignores the Mockup tilt. */
  canvas: { x: number; y: number; scale: number };
  /** panelScroll (px) that brings the Corners slider fully into view; 0 if none is needed. */
  panelScrollForSliders: number;
};

/**
 * Coordinates (px, relative to the editor's top-left) of the controls, from the
 * same constants the component renders with. Slider y values already account
 * for `panelScroll` (default 0). Slider value maps linearly to x0..x1
 * (padding 0..100, shadow 0..100, corners 0..40).
 */
export const annotateHotspots = (p: {
  width: number;
  height: number;
  mode: AnnotateMode;
  showBackgroundPanel: boolean;
  contentWidth?: number;
  contentHeight?: number;
  padding?: number;
  panelScroll?: number;
}): AnnotateHotspots => {
  const cw = p.contentWidth ?? DEFAULT_CONTENT_W;
  const ch = p.contentHeight ?? DEFAULT_CONTENT_H;
  const g = canvasPlacement({
    width: p.width,
    height: p.height,
    mode: p.mode,
    showBackgroundPanel: p.showBackgroundPanel,
    contentWidth: cw,
    contentHeight: ch,
    padding: p.padding ?? 0,
  });
  const scroll = p.panelScroll ?? 0;
  const tools = {} as Record<AnnotateTool, Pt>;
  for (const { item, x, w } of toolbarPositions()) {
    if (item.kind === "btn" && item.toolId) tools[item.toolId as AnnotateTool] = { x: x + w / 2, y: TOP_H / 2 };
  }
  const modes = {} as Record<AnnotateMode, Pt>;
  let mx = WIN_PAD + ZOOM_W + SEG_PAD;
  for (const m of MODES) {
    modes[m.id] = { x: mx + MODE_W[m.id] / 2, y: p.height - BOT_H / 2 };
    mx += MODE_W[m.id];
  }
  const L = panelLayout(PANEL_W, false);
  const place = (s: { x0: number; x1: number; y: number }): SliderHotspot => ({
    x0: s.x0,
    x1: s.x1,
    y: g.canvasTop + s.y - scroll,
  });
  const cx0 = g.canvasLeft + g.canvasW / 2;
  const cy0 = g.canvasTop + 1 + (g.canvasH - g.reserve) / 2;
  return {
    tools,
    done: { x: p.width - WIN_PAD - DONE_W / 2, y: TOP_H / 2 },
    saveAs: { x: p.width - WIN_PAD - DONE_W - RIGHT_GAP - SAVE_W / 2, y: TOP_H / 2 },
    modes,
    gradients: GRADIENTS.map((_, i) => {
      const c = L.gradient(i);
      return { x: c.x, y: g.canvasTop + c.y - scroll };
    }),
    padding: place(L.sliders.padding),
    shadow: place(L.sliders.shadow),
    corners: place(L.sliders.corners),
    canvas: { x: cx0 - (cw * g.scale) / 2, y: cy0 - (ch * g.scale) / 2, scale: g.scale },
    panelScrollForSliders: Math.max(0, L.sliders.corners.y + pt(18) - g.canvasH),
  };
};

/** CSS 3D tilt used by the Mockup tab. Wraps absolutely-positioned content. */
export const MockupTilt: FC<{
  active?: boolean;
  rotateY?: number;
  rotateX?: number;
  perspective?: number;
  children?: ReactNode;
  style?: CSSProperties;
}> = ({ active = true, rotateY = -18, rotateX = 8, perspective = 2000, children, style }) => (
  <div style={{ position: "absolute", inset: 0, perspective, ...style }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        transformOrigin: "50% 50%",
        transform: active ? `rotateY(${rotateY}deg) rotateX(${rotateX}deg)` : "none",
      }}
    >
      {children}
    </div>
  </div>
);

const ToolButton: FC<{ icon: IconName; selected?: boolean; pressed?: boolean; dim?: boolean }> = ({
  icon,
  selected,
  pressed,
  dim,
}) => (
  <div
    style={{
      width: pt(32),
      height: pt(32),
      borderRadius: pt(9),
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: selected ? "rgba(255,255,255,0.14)" : "transparent",
      color: selected ? "#fff" : "#d2d2d8",
      opacity: dim ? 0.45 : 1,
      ...pressedStyle(!!pressed),
    }}
  >
    <Icon name={icon} size={pt(18)} />
  </div>
);

const Sep: FC<{ h?: number }> = ({ h = pt(22) }) => (
  <div style={{ width: 1, height: h, background: "rgba(255,255,255,0.12)", margin: `0 ${SEP_MARGIN}px`, flex: "none" }} />
);

const Pill: FC<{ children: ReactNode; pressed?: boolean; style?: CSSProperties }> = ({ children, pressed, style }) => (
  <div
    style={{
      height: pt(28),
      padding: `0 ${pt(14)}px`,
      boxSizing: "border-box",
      borderRadius: pt(14),
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: pt(12.5),
      fontWeight: 500,
      background: "rgba(255,255,255,0.09)",
      ...pressedStyle(!!pressed),
      ...style,
    }}
  >
    {children}
  </div>
);

const SetLabel: FC<{ children: ReactNode }> = ({ children }) => (
  <span style={{ fontSize: pt(12.5), color: "#d6d6dc", whiteSpace: "nowrap" }}>{children}</span>
);

const SetGroup: FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: pt(8), flex: "none" }}>
    <SetLabel>{label}</SetLabel>
    {children}
  </div>
);

const MiniIcon: FC<{ icon: IconName; selected?: boolean }> = ({ icon, selected }) => (
  <div
    style={{
      width: pt(26),
      height: pt(26),
      borderRadius: pt(7),
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: selected ? "#fff" : "#c4c4cc",
      background: selected ? "rgba(255,255,255,0.14)" : "transparent",
    }}
  >
    <Icon name={icon} size={pt(15)} sw={1.9} />
  </div>
);

const LineStyle: FC<{ dash: string; selected?: boolean }> = ({ dash, selected }) => (
  <div
    style={{
      width: pt(34),
      height: pt(26),
      borderRadius: pt(7),
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: selected ? "rgba(255,255,255,0.14)" : "transparent",
    }}
  >
    <svg width={pt(24)} height={4} viewBox="0 0 24 4">
      <path d="M1 2h22" stroke="#e8e8ee" strokeWidth={2} strokeLinecap="round" strokeDasharray={dash} />
    </svg>
  </div>
);

const SettingsBar: FC<{ tool: AnnotateTool; dim: boolean }> = ({ tool, dim }) => (
  <div
    style={{
      height: SET_H,
      display: "flex",
      alignItems: "center",
      gap: pt(12),
      padding: `0 ${pt(14)}px`,
      boxSizing: "border-box",
      opacity: dim ? 0.45 : 1,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        width: pt(30),
        height: pt(30),
        borderRadius: pt(15),
        background: ui.accentSoft,
        boxShadow: `inset 0 0 0 ${pt(1.5)}px ${ui.accent}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        flex: "none",
      }}
    >
      <Icon name={toolIcon(tool)} size={pt(16)} sw={1.9} />
    </div>
    <SetGroup label="Color">
      <div style={{ display: "flex", alignItems: "center", gap: pt(4), color: ui.secondary }}>
        <div style={{ width: pt(20), height: pt(20), borderRadius: pt(10), background: "#ff5a4f" }} />
        <Icon name="chevronDown" size={pt(10)} sw={2.2} />
      </div>
    </SetGroup>
    <Sep />
    <SetGroup label="Stroke">
      <Icon name="line" size={pt(13)} color={ui.secondary} />
      <div style={{ position: "relative", width: pt(92), height: pt(14) }}>
        <div
          style={{
            position: "absolute",
            top: pt(5.5),
            left: 0,
            right: 0,
            height: pt(3),
            borderRadius: pt(2),
            background: "rgba(255,255,255,0.14)",
          }}
        />
        <div
          style={{ position: "absolute", top: pt(5.5), left: 0, width: pt(20), height: pt(3), borderRadius: pt(2), background: ui.accent }}
        />
        <div
          style={{ position: "absolute", top: 0, left: pt(14), width: pt(14), height: pt(14), borderRadius: pt(7), background: "#e9e9ee" }}
        />
      </div>
      <span style={{ fontSize: pt(12.5), color: ui.secondary, width: pt(12) }}>3</span>
    </SetGroup>
    <Sep />
    <SetGroup label="Line Style">
      <div style={{ display: "flex" }}>
        <LineStyle dash="none" selected />
        <LineStyle dash="5 3.5" />
        <LineStyle dash="0.1 4" />
      </div>
    </SetGroup>
    <Sep />
    <SetGroup label="Style">
      <div style={{ display: "flex" }}>
        <MiniIcon icon="arrow" selected />
        <MiniIcon icon="curvedArrow" />
      </div>
    </SetGroup>
    <Sep />
    <SetGroup label="Display">
      <div style={{ display: "flex" }}>
        <MiniIcon icon="arrow" selected />
        <MiniIcon icon="curvedArrow" />
      </div>
    </SetGroup>
    <Sep />
    <SetGroup label="Start">
      <div style={{ display: "flex" }}>
        <MiniIcon icon="dashLine" selected />
        <MiniIcon icon="triangle" />
        <MiniIcon icon="dot" />
      </div>
    </SetGroup>
    <SetGroup label="End">
      <div style={{ display: "flex" }}>
        <MiniIcon icon="dashLine" />
        <MiniIcon icon="triangle" selected />
        <MiniIcon icon="dot" />
      </div>
    </SetGroup>
  </div>
);

const MODES: { id: AnnotateMode; label: string; icon: IconName }[] = [
  { id: "annotate", label: "Annotate", icon: "annotate" },
  { id: "mockup", label: "Mockup", icon: "cube" },
  { id: "preview", label: "Preview", icon: "eye" },
];

const BottomBar: FC<{ mode: AnnotateMode; zoomLabel: string; pressed?: string; width: number }> = ({
  mode,
  zoomLabel,
  pressed,
  width,
}) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: BOT_H,
      borderTop: `1px solid ${ui.separator}`,
      display: "flex",
      alignItems: "center",
      padding: `0 ${WIN_PAD}px`,
      boxSizing: "border-box",
      background: ui.window,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: pt(6), width: ZOOM_W, flex: "none", fontSize: pt(13), fontWeight: 500 }}>
      <Icon name="chevronDown" size={pt(12)} sw={2.2} />
      {zoomLabel}
    </div>
    <div
      style={{
        display: "flex",
        padding: SEG_PAD,
        borderRadius: pt(16),
        background: "rgba(255,255,255,0.04)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
      }}
    >
      {MODES.map((m) => (
        <div
          key={m.id}
          style={{
            height: pt(28),
            width: MODE_W[m.id],
            flex: "none",
            boxSizing: "border-box",
            borderRadius: pt(14),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: pt(7),
            fontSize: pt(13),
            fontWeight: m.id === mode ? 600 : 500,
            color: m.id === mode ? "#fff" : ui.secondary,
            background: m.id === mode ? "rgba(255,255,255,0.1)" : "transparent",
            ...pressedStyle(pressed === `mode-${m.id}`),
          }}
        >
          <Icon name={m.icon} size={pt(15)} sw={1.8} />
          {m.label}
        </div>
      ))}
    </div>
    <div
      style={{
        position: "absolute",
        left: width / 2,
        transform: `translateX(-50%) ${pressed === "drag" ? "scale(0.94)" : ""}`,
        height: pt(30),
        padding: `0 ${pt(16)}px`,
        borderRadius: pt(15),
        display: "flex",
        alignItems: "center",
        gap: pt(10),
        fontSize: pt(13),
        fontWeight: 500,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.03)",
        color: "#e4e4ea",
      }}
    >
      <Icon name="grip" size={pt(11)} sw={2.4} color={ui.secondary} />
      Drag to app
      <Icon name="grip" size={pt(11)} sw={2.4} color={ui.secondary} />
    </div>
    <div style={{ flex: 1 }} />
    <div style={{ display: "flex", gap: pt(6), color: "#cfcfd6" }}>
      {(["save", "share", "pin", "copy", "trash"] as IconName[]).map((n) => (
        <div
          key={n}
          style={{
            width: pt(30),
            height: pt(30),
            borderRadius: pt(8),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...pressedStyle(pressed === `action-${n}`),
          }}
        >
          <Icon name={n} size={pt(16)} sw={1.7} />
        </div>
      ))}
    </div>
  </div>
);

const MockupPresets: FC<{ selected: number }> = ({ selected }) => {
  const tilts: [number, number][] = [
    [0, 0],
    [-22, 8],
    [22, 8],
    [-26, -6],
    [26, -6],
    [0, 26],
    [-34, 14],
    [34, 14],
  ];
  return (
    <div style={{ display: "flex", gap: pt(10) }}>
      {tilts.map(([ry, rx], i) => (
        <div
          key={i}
          style={{
            width: pt(66),
            height: pt(44),
            borderRadius: pt(10),
            background: "rgba(255,255,255,0.06)",
            boxShadow: i === selected ? `inset 0 0 0 ${pt(1.5)}px ${ui.accent}` : "inset 0 0 0 1px rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            perspective: pt(200),
          }}
        >
          <div
            style={{
              width: pt(34),
              height: pt(22),
              borderRadius: pt(3),
              background: "linear-gradient(135deg, #6f86ff, #2a3fc0)",
              boxShadow: "0 2px 5px rgba(0,0,0,0.4)",
              transform: `rotateY(${ry}deg) rotateX(${rx}deg)`,
            }}
          />
        </div>
      ))}
    </div>
  );
};

export const AnnotateEditor: FC<AnnotateEditorProps> = ({
  width,
  height,
  tool,
  mode,
  showBackgroundPanel,
  selectedGradient,
  padding,
  corners,
  shadow,
  zoomLabel,
  pressed,
  contentWidth = DEFAULT_CONTENT_W,
  contentHeight = DEFAULT_CONTENT_H,
  panelScroll = 0,
  mockupPreset = 1,
  overlay,
  children,
}) => {
  const dim = mode !== "annotate";
  const mockup = mode === "mockup";
  const { canvasLeft, canvasTop, canvasW, canvasH, reserve, padU, fullW, fullH, scale } = canvasPlacement({
    width,
    height,
    mode,
    showBackgroundPanel,
    contentWidth,
    contentHeight,
    padding,
  });
  const hasBg = selectedGradient !== null;
  const shadowCss = `0 ${shadow * 0.35}px ${shadow * 1.1}px rgba(0,0,0,${0.12 + shadow / 150})`;

  const frame = (
    <div
      style={{
        position: "absolute",
        left: (canvasW - fullW) / 2,
        top: (canvasH - reserve - fullH) / 2,
        width: fullW,
        height: fullH,
        transform: `scale(${scale})`,
        transformOrigin: "50% 50%",
        background: hasBg ? gradientCss(selectedGradient) : "transparent",
        borderRadius: hasBg ? corners + 8 : 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: padU,
          top: padU,
          width: contentWidth,
          height: contentHeight,
          borderRadius: corners,
          overflow: "hidden",
          boxShadow: shadowCss,
          background: "#fff",
        }}
      >
        {children}
      </div>
      {overlay && (
        <div
          style={{
            position: "absolute",
            left: padU,
            top: padU,
            width: contentWidth,
            height: contentHeight,
            pointerEvents: "none",
          }}
        >
          {overlay}
        </div>
      )}
    </div>
  );

  return (
    <WindowShell width={width} height={height}>
      {/* top toolbar */}
      <div
        style={{
          height: TOP_H,
          display: "flex",
          alignItems: "center",
          padding: `0 ${WIN_PAD}px`,
          boxSizing: "border-box",
        }}
      >
        <TrafficLights />
        <div style={{ width: LIGHTS_GAP, flex: "none" }} />
        <div style={{ display: "flex", gap: TB_GAP, alignItems: "center" }}>
          {TOOLBAR.map((it, i) =>
            it.kind === "sep" ? (
              <Sep key={i} />
            ) : (
              <ToolButton
                key={it.key}
                icon={it.icon}
                dim={dim || !!it.alwaysDim}
                selected={!dim && it.toolId !== undefined && it.toolId === tool}
                pressed={pressed === it.key}
              />
            ),
          )}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: RIGHT_GAP, alignItems: "center" }}>
          <Pill pressed={pressed === "save-as"} style={{ width: SAVE_W }}>
            Save as...
          </Pill>
          <Pill
            pressed={pressed === "done"}
            style={{ background: ui.accent, color: "#fff", fontWeight: 600, width: DONE_W }}
          >
            Done
          </Pill>
        </div>
      </div>
      <div style={{ height: 1, background: ui.separator }} />
      <SettingsBar tool={tool} dim={dim} />
      <div style={{ height: 1, background: ui.separator }} />

      {/* canvas */}
      <div
        style={{
          position: "absolute",
          left: canvasLeft,
          top: canvasTop + 1,
          width: canvasW,
          height: canvasH - 1,
          overflow: "hidden",
          background: "#181a22",
        }}
      >
        <MockupTilt active={mockup}>{frame}</MockupTilt>
        {mockup && (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: pt(14), display: "flex", justifyContent: "center" }}>
            <MockupPresets selected={mockupPreset} />
          </div>
        )}
      </div>

      {showBackgroundPanel && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: canvasTop,
            width: PANEL_W,
            height: canvasH,
            borderRight: `1px solid ${ui.separator}`,
            boxSizing: "border-box",
          }}
        >
          <BackgroundPanel
            width={PANEL_W}
            height={canvasH}
            selectedGradient={selectedGradient}
            padding={padding}
            corners={corners}
            shadow={shadow}
            pressed={pressed}
            scroll={panelScroll}
          />
        </div>
      )}

      <BottomBar mode={mode} zoomLabel={zoomLabel} pressed={pressed} width={width} />
    </WindowShell>
  );
};
