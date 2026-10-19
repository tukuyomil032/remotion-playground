import type { CSSProperties, FC, ReactNode } from "react";
import { pt, ui } from "../../theme";
import { BackgroundPanel, fitScale, Icon, pressedStyle, TrafficLights, WindowShell, type IconName } from "./kit";

export type ZoomSegment = { start: number; end: number; label: string };

export type VideoEditorProps = {
  width: number;
  height: number;
  /** Trim handles, 0..1 along the timeline. */
  trimStart: number;
  trimEnd: number;
  playhead: number;
  playing: boolean;
  zoomSegments: ZoomSegment[];
  /** 0..1 shows the centered "Exporting Video" card; null hides it. */
  exportProgress: number | null;
  timeLabel: string;
  durationLabel: string;
  /** "play", "rewind", "forward", "cancel", "quality", "dimensions", "audio", "convert", "trim-start", ... */
  pressed?: string;
  /** Natural size of `children` (one video frame) in px. */
  contentWidth?: number;
  contentHeight?: number;
  /** "frames" re-renders `children` in every thumbnail; "tiles" draws plain gradient tiles. */
  stripMode?: "frames" | "tiles";
  /** Timeline length in seconds, used for the ruler. */
  durationSeconds?: number;
  title?: string;
  /** Label of the blue button at the bottom right. */
  actionLabel?: string;
  /** Scroll offset of the left panel, px. */
  panelScroll?: number;
  children?: ReactNode;
};

const TITLE_H = pt(40);
const BOT_H = pt(54);
const TRANSPORT_H = pt(62);
const RULER_H = pt(26);
const STRIP_H = pt(54);
const LANE_H = pt(36);
const TIMELINE_H = RULER_H + STRIP_H + LANE_H * 2 + pt(24);
const PANEL_W = pt(206);
const SIDE = pt(18);
const YELLOW = ui.trim;
const RED = "#ff5247";

const FrameThumb: FC<{ w: number; h: number; fw: number; fh: number; children?: ReactNode }> = ({
  w,
  h,
  fw,
  fh,
  children,
}) => {
  const s = Math.max(w / fw, h / fh);
  return (
    <div style={{ width: w, height: h, overflow: "hidden", position: "relative", flex: "none" }}>
      <div
        style={{
          position: "absolute",
          width: fw,
          height: fh,
          left: (w - fw * s) / 2,
          top: (h - fh * s) / 2,
          transform: `scale(${s})`,
          transformOrigin: "0 0",
        }}
      >
        {children}
      </div>
    </div>
  );
};

const RoundBtn: FC<{ icon: IconName; size?: number; pressed?: boolean; filled?: boolean; iconSize?: number }> = ({
  icon,
  size = pt(32),
  pressed,
  filled,
  iconSize = pt(20),
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: filled ? ui.accent : "transparent",
      color: filled ? "#fff" : "#e6e6ec",
      boxShadow: filled ? "0 2px 10px rgba(30,120,255,0.45)" : "none",
      ...pressedStyle(!!pressed),
    }}
  >
    <Icon name={icon} size={iconSize} sw={1.6} />
  </div>
);

const Chip: FC<{ children: ReactNode; style?: CSSProperties; pressed?: boolean }> = ({ children, style, pressed }) => (
  <div
    style={{
      height: pt(30),
      padding: `0 ${pt(14)}px`,
      borderRadius: pt(15),
      display: "flex",
      alignItems: "center",
      gap: pt(7),
      fontSize: pt(13),
      fontWeight: 600,
      color: "#e8e8ee",
      ...pressedStyle(!!pressed),
      ...style,
    }}
  >
    {children}
  </div>
);

const ExportCard: FC<{ progress: number }> = ({ progress }) => {
  const size = pt(76);
  const r = pt(31);
  const circ = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(8,9,14,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: pt(230),
          padding: `${pt(26)}px 0 ${pt(24)}px`,
          borderRadius: pt(20),
          background: "#2b2c33",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.1), 0 24px 60px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: pt(16),
        }}
      >
        <div style={{ position: "relative", width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={pt(5)} />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={ui.accent}
              strokeWidth={pt(5)}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - p)}
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: pt(17),
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {Math.round(p * 100)}%
          </div>
        </div>
        <div style={{ fontSize: pt(15), fontWeight: 600 }}>Exporting Video</div>
      </div>
    </div>
  );
};

const rulerLabel = (i: number): string => `0:${i < 10 ? "0" : ""}${i}`;

const BOT_PAD = pt(18);
const FRAME_COUNT = 14;
const LANES_TOP = RULER_H + STRIP_H + pt(10);
const PREVIEW_MARGIN = pt(14);
const TIME_W = pt(48);
const CONVERT_W = pt(96);
const timeStyle: CSSProperties = {
  width: TIME_W,
  flex: "none",
  fontSize: pt(14),
  color: ui.secondary,
  fontVariantNumeric: "tabular-nums",
  fontWeight: 500,
};

const DEFAULT_FRAME_W = 1280;
const DEFAULT_FRAME_H = 720;

/** Pure geometry of the editor, from the same constants the component renders with. */
const videoLayout = (p: { width: number; height: number; contentWidth: number; contentHeight: number }) => {
  const mainH = p.height - TITLE_H - TIMELINE_H - BOT_H;
  const previewH = mainH - TRANSPORT_H;
  const rightW = p.width - PANEL_W;
  const trackX = SIDE;
  const trackW = p.width - SIDE * 2;
  const pScale = fitScale(
    rightW - PREVIEW_MARGIN * 2,
    previewH - PREVIEW_MARGIN * 2,
    p.contentWidth,
    p.contentHeight,
  );
  return {
    mainH,
    previewH,
    rightW,
    trackX,
    trackW,
    pScale,
    pw: p.contentWidth * pScale,
    ph: p.contentHeight * pScale,
    timelineTop: TITLE_H + mainH,
  };
};

export type VideoHotspots = {
  play: { x: number; y: number };
  convert: { x: number; y: number };
  /** Frame-strip ends: time 0..1 maps linearly to trackX0..trackX1. */
  trackX0: number;
  trackX1: number;
  /** Center of the frame strip. */
  trackY: number;
  zoomLaneY: number;
  /** Video frame rectangle inside the preview area. */
  preview: { x: number; y: number; w: number; h: number };
};

/** Coordinates (px, relative to the editor's top-left). There is no "add zoom" button, so `addZoom` is omitted. */
export const videoHotspots = (p: {
  width: number;
  height: number;
  contentWidth?: number;
  contentHeight?: number;
}): VideoHotspots => {
  const g = videoLayout({
    width: p.width,
    height: p.height,
    contentWidth: p.contentWidth ?? DEFAULT_FRAME_W,
    contentHeight: p.contentHeight ?? DEFAULT_FRAME_H,
  });
  // The timeline box has a 1px top border; its children are offset by it.
  const inner = g.timelineTop + 1;
  return {
    play: { x: PANEL_W + g.rightW / 2, y: TITLE_H + g.previewH + TRANSPORT_H / 2 },
    convert: { x: p.width - BOT_PAD - CONVERT_W / 2, y: p.height - BOT_H / 2 },
    trackX0: g.trackX,
    trackX1: g.trackX + g.trackW,
    trackY: inner + RULER_H + STRIP_H / 2,
    zoomLaneY: inner + LANES_TOP + LANE_H / 2,
    preview: {
      x: PANEL_W + (g.rightW - g.pw) / 2,
      y: TITLE_H + (g.previewH - g.ph) / 2,
      w: g.pw,
      h: g.ph,
    },
  };
};

export const VideoEditor: FC<VideoEditorProps> = ({
  width,
  height,
  trimStart,
  trimEnd,
  playhead,
  playing,
  zoomSegments,
  exportProgress,
  timeLabel,
  durationLabel,
  pressed,
  contentWidth = DEFAULT_FRAME_W,
  contentHeight = DEFAULT_FRAME_H,
  stripMode = "frames",
  durationSeconds = 14,
  title = "Screen Recording.mp4",
  actionLabel = "Convert",
  panelScroll = pt(30),
  children,
}) => {
  const { mainH, previewH, rightW, trackX, trackW, pScale, pw, ph, timelineTop } = videoLayout({
    width,
    height,
    contentWidth,
    contentHeight,
  });
  const frameCount = FRAME_COUNT;
  const tileW = trackW / frameCount;
  const px = (f: number): number => trackX + f * trackW;
  const stripTop = RULER_H;
  const lanesTop = LANES_TOP;

  return (
    <WindowShell width={width} height={height}>
      {/* title bar */}
      <div
        style={{
          height: TITLE_H,
          display: "flex",
          alignItems: "center",
          padding: `0 ${pt(16)}px`,
          boxSizing: "border-box",
          borderBottom: `1px solid ${ui.separator}`,
          position: "relative",
        }}
      >
        <TrafficLights />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            textAlign: "center",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: pt(8),
            fontSize: pt(13),
            fontWeight: 600,
            color: "#e4e4ea",
          }}
        >
          <Icon name="video" size={pt(15)} color={ui.secondary} />
          {title}
        </div>
      </div>

      {/* background panel */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: TITLE_H,
          width: PANEL_W,
          height: mainH,
          borderRight: `1px solid ${ui.separator}`,
          boxSizing: "border-box",
        }}
      >
        <BackgroundPanel
          width={PANEL_W}
          height={mainH}
          selectedGradient={null}
          padding={0}
          corners={0}
          shadow={0}
          compact
          scroll={panelScroll}
        />
      </div>

      {/* preview */}
      <div style={{ position: "absolute", left: PANEL_W, top: TITLE_H, width: rightW, height: previewH, background: "#14151b" }}>
        <div
          style={{
            position: "absolute",
            left: (rightW - pw) / 2,
            top: (previewH - ph) / 2,
            width: pw,
            height: ph,
            borderRadius: pt(8),
            overflow: "hidden",
            boxShadow: "0 8px 30px rgba(0,0,0,0.45)",
          }}
        >
          <div
            style={{
              width: contentWidth,
              height: contentHeight,
              transform: `scale(${pScale})`,
              transformOrigin: "0 0",
              position: "relative",
            }}
          >
            {children}
          </div>
        </div>
      </div>

      {/* transport */}
      <div
        style={{
          position: "absolute",
          left: PANEL_W,
          top: TITLE_H + previewH,
          width: rightW,
          height: TRANSPORT_H,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: ui.window,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: pt(16),
            display: "flex",
            alignItems: "center",
            gap: pt(2),
            padding: pt(3),
            borderRadius: pt(16),
            background: "rgba(255,255,255,0.04)",
            color: ui.tertiary,
          }}
        >
          <RoundBtn icon="scissors" size={pt(28)} iconSize={pt(16)} />
          <RoundBtn icon="trash" size={pt(28)} iconSize={pt(16)} />
          <RoundBtn icon="cropFrame" size={pt(28)} iconSize={pt(16)} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: pt(16) }}>
          <span style={{ ...timeStyle, textAlign: "right" }}>{timeLabel}</span>
          <RoundBtn icon="rewind" size={pt(34)} iconSize={pt(22)} pressed={pressed === "rewind"} />
          <RoundBtn
            icon={playing ? "pause" : "play"}
            size={pt(44)}
            iconSize={pt(22)}
            filled
            pressed={pressed === "play"}
          />
          <RoundBtn icon="forward" size={pt(34)} iconSize={pt(22)} pressed={pressed === "forward"} />
          <span style={{ ...timeStyle, textAlign: "left" }}>{durationLabel}</span>
        </div>
        <div style={{ position: "absolute", right: pt(16), display: "flex", gap: pt(8) }}>
          <Chip style={{ background: "rgba(255,255,255,0.06)", height: pt(28), fontSize: pt(12.5) }}>
            <Icon name="zoomIn" size={pt(14)} />1
          </Chip>
          <Chip style={{ background: "rgba(255,255,255,0.06)", height: pt(28), fontSize: pt(12.5) }}>
            <Icon name="scissors" size={pt(14)} />
            {durationLabel}
          </Chip>
        </div>
      </div>

      {/* timeline */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: timelineTop,
          width,
          height: TIMELINE_H,
          borderTop: `1px solid ${ui.separator}`,
          boxSizing: "border-box",
          background: "#17181e",
        }}
      >
        {/* ruler */}
        {Array.from({ length: durationSeconds }, (_, i) => {
          const x = px(i / durationSeconds);
          return (
            <div key={i}>
              <div style={{ position: "absolute", left: x, top: pt(10), width: 1, height: pt(6), background: "rgba(255,255,255,0.22)" }} />
              <div
                style={{
                  position: "absolute",
                  left: x + pt(5),
                  top: pt(8),
                  fontSize: pt(10.5),
                  color: ui.tertiary,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {rulerLabel(i)}
              </div>
            </div>
          );
        })}

        {/* frame strip */}
        <div style={{ position: "absolute", left: trackX, top: stripTop, width: trackW, height: STRIP_H, display: "flex", background: "#0e0f14" }}>
          {Array.from({ length: frameCount }, (_, i) =>
            stripMode === "frames" ? (
              <div key={i} style={{ borderRight: "1px solid rgba(0,0,0,0.55)", flex: "none" }}>
                <FrameThumb w={tileW - 1} h={STRIP_H} fw={contentWidth} fh={contentHeight}>
                  {children}
                </FrameThumb>
              </div>
            ) : (
              <div
                key={i}
                style={{
                  width: tileW,
                  height: STRIP_H,
                  flex: "none",
                  borderRight: "1px solid rgba(0,0,0,0.55)",
                  boxSizing: "border-box",
                  background: `linear-gradient(${120 + i * 6}deg, #2f4bff, #101a6a)`,
                }}
              />
            ),
          )}
        </div>
        {/* dimmed outside the trim */}
        <div
          style={{ position: "absolute", left: trackX, top: stripTop, width: Math.max(0, trimStart * trackW), height: STRIP_H, background: "rgba(14,15,20,0.66)" }}
        />
        <div
          style={{ position: "absolute", left: px(trimEnd), top: stripTop, width: Math.max(0, (1 - trimEnd) * trackW), height: STRIP_H, background: "rgba(14,15,20,0.66)" }}
        />
        {/* trim frame */}
        <div
          style={{
            position: "absolute",
            left: px(trimStart),
            top: stripTop - pt(2),
            width: Math.max(0, (trimEnd - trimStart) * trackW),
            height: STRIP_H + pt(4),
            boxSizing: "border-box",
            borderTop: `${pt(3)}px solid ${YELLOW}`,
            borderBottom: `${pt(3)}px solid ${YELLOW}`,
          }}
        />
        {[trimStart, trimEnd].map((f, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: px(f) - (i === 0 ? 0 : pt(12)),
              top: stripTop - pt(2),
              width: pt(12),
              height: STRIP_H + pt(4),
              background: YELLOW,
              borderRadius: i === 0 ? `${pt(5)}px 0 0 ${pt(5)}px` : `0 ${pt(5)}px ${pt(5)}px 0`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#3a2f00",
              ...pressedStyle(pressed === (i === 0 ? "trim-start" : "trim-end")),
            }}
          >
            <Icon name={i === 0 ? "chevronLeft" : "chevronRight"} size={pt(10)} sw={3} />
          </div>
        ))}

        {/* lanes */}
        {[
          { label: "Zooms", icon: "zoomIn" as IconName },
          { label: "Speed", icon: "speed" as IconName },
        ].map((lane, i) => (
          <div
            key={lane.label}
            style={{
              position: "absolute",
              left: trackX,
              top: lanesTop + i * (LANE_H + pt(2)),
              width: trackW,
              height: LANE_H,
              borderRadius: pt(8),
              background: "rgba(255,255,255,0.035)",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: pt(10),
                top: 0,
                height: LANE_H,
                display: "flex",
                alignItems: "center",
                gap: pt(8),
                fontSize: pt(12),
                fontWeight: 500,
                color: ui.secondary,
              }}
            >
              <Icon name={lane.icon} size={pt(13)} />
              {lane.label}
            </div>
          </div>
        ))}
        {zoomSegments.map((z, i) => {
          const w = (z.end - z.start) * trackW;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: px(z.start),
                top: lanesTop + pt(4),
                width: w,
                height: LANE_H - pt(8),
                borderRadius: pt(8),
                background: "linear-gradient(180deg, #4a90ff, #2f74f0)",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.25)",
                display: "flex",
                alignItems: "center",
                padding: `0 ${pt(10)}px`,
                gap: pt(6),
                color: "#fff",
                fontSize: pt(12.5),
                fontWeight: 600,
                overflow: "hidden",
                boxSizing: "border-box",
              }}
            >
              <Icon name="zoomIn" size={pt(14)} sw={1.9} />
              {z.label}
              {w > pt(130) && (
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: pt(10.5),
                    padding: `${pt(2)}px ${pt(8)}px`,
                    borderRadius: pt(8),
                    background: "rgba(255,255,255,0.28)",
                    fontWeight: 600,
                  }}
                >
                  Manual
                </span>
              )}
            </div>
          );
        })}

        {/* playhead */}
        <div
          style={{
            position: "absolute",
            left: px(playhead) - 1,
            top: pt(8),
            width: 2,
            height: TIMELINE_H - pt(14),
            background: RED,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: px(playhead) - pt(6),
            top: pt(5),
            width: 0,
            height: 0,
            borderLeft: `${pt(6)}px solid transparent`,
            borderRight: `${pt(6)}px solid transparent`,
            borderTop: `${pt(9)}px solid ${RED}`,
          }}
        />
      </div>

      {/* bottom bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width,
          height: BOT_H,
          display: "flex",
          alignItems: "center",
          gap: pt(10),
          padding: `0 ${BOT_PAD}px`,
          boxSizing: "border-box",
          borderTop: `1px solid ${ui.separator}`,
          background: ui.window,
        }}
      >
        <Chip
          pressed={pressed === "cancel"}
          style={{ background: "rgba(255,255,255,0.09)", height: pt(32), padding: `0 ${pt(18)}px` }}
        >
          Cancel
        </Chip>
        <Chip pressed={pressed === "quality"} style={{ height: pt(32) }}>
          <Icon name="quality" size={pt(16)} />
          Quality
        </Chip>
        <Chip pressed={pressed === "dimensions"} style={{ height: pt(32) }}>
          <Icon name="dimensions" size={pt(16)} />
          Dimensions
        </Chip>
        <Chip pressed={pressed === "audio"} style={{ height: pt(32) }}>
          <Icon name="audio" size={pt(16)} />
          Audio
        </Chip>
        <div style={{ flex: 1 }} />
        <Chip
          pressed={pressed === "convert"}
          style={{
            background: ui.accent,
            color: "#fff",
            height: pt(32),
            width: CONVERT_W,
            justifyContent: "center",
            boxSizing: "border-box",
          }}
        >
          {actionLabel}
        </Chip>
      </div>

      {exportProgress !== null && <ExportCard progress={exportProgress} />}
    </WindowShell>
  );
};
