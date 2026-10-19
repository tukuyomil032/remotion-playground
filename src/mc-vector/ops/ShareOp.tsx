import type React from "react";
import { interpolate, Sequence, useCurrentFrame } from "remotion";
import { Callout } from "../stage/Callout";
import { clamp01, easeOut } from "../stage/motion";
import { Stage, type CameraKey } from "../stage/Stage";
import { colors, fonts, radius } from "../theme";
import { Button, Cursor, type CursorKeyframe, type NavItem, Toast } from "../ui";
import { DashboardStub } from "./DashboardStub";

// op5 "Share": camera pushes in on the sidebar, opens General Settings, flips the
// ngrok toggle, the tunnel log runs (Initializing -> Ready), an ONLINE badge and
// a public address appear, Copy is clicked and "Address copied!" shows.
// All frames are scene-local (0..359). The window slides in over 0..42 and out
// over 324..360. The address is fictional.

const T = {
  cursorIn: 36,
  sidebarClick: 70,
  toggleClick: 104,
  noteNoPort: 118,
  log1: 112,
  log2: 140,
  log3: 168,
  log4: 192,
  online: 196,
  address: 202,
  noteShare: 216,
  copyClick: 252,
  toast: 256,
  toastHide: 340,
} as const;

const ADDRESS = "https://example-tunnel.ngrok-free.app";

const pulse = (frame: number, at: number): number => interpolate(frame, [at, at + 4, at + 10], [0, 1, 0], clamp01);
const rise = (frame: number, at: number, dur = 14): number =>
  interpolate(frame, [at, at + dur], [0, 1], { ...clamp01, easing: easeOut });
const ramp = (frame: number, from: number, to: number): number => interpolate(frame, [from, to], [0, 1], clamp01);

const LOG_LINES: readonly { at: number; text: string }[] = [
  { at: T.log1, text: "--- Initializing ngrok ---" },
  { at: T.log2, text: "Starting tcp tunnel for port 25565..." },
  { at: T.log3, text: "Tunnel session established" },
  { at: T.log4, text: "Ready" },
];

const Field: React.FC<{ label: string; value: string; flex?: number }> = ({ label, value, flex = 1 }) => (
  <div style={{ flex }}>
    <div style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted, marginBottom: 6 }}>{label}</div>
    <div
      style={{
        height: 42,
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        fontSize: 16,
        background: colors.window,
        border: `1px solid ${colors.borderStrong}`,
        borderRadius: radius.control,
      }}
    >
      {value}
    </div>
  </div>
);

const OnlineBadge: React.FC<{ p: number }> = ({ p }) => (
  <span
    style={{
      display: "inline-block",
      padding: "3px 12px",
      fontSize: 13,
      fontWeight: 800,
      letterSpacing: 0.8,
      color: colors.success,
      background: "rgba(16,185,129,0.14)",
      border: "1px solid rgba(16,185,129,0.45)",
      borderRadius: radius.pill,
      opacity: p,
      transform: `scale(${0.6 + 0.4 * p})`,
      transformOrigin: "left center",
    }}
  >
    ONLINE
  </span>
);

const SettingsContent: React.FC = () => {
  const frame = useCurrentFrame();

  const toggle = interpolate(frame, [T.toggleClick, T.toggleClick + 10], [0, 1], { ...clamp01, easing: easeOut });
  const online = rise(frame, T.online, 12);
  const address = rise(frame, T.address, 16);
  const trackColor = toggle > 0.5 ? colors.success : colors.borderStrong;

  return (
    <div style={{ position: "absolute", inset: 0, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Basic card */}
      <div
        style={{
          height: 150,
          padding: "18px 22px",
          background: colors.window,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.card,
        }}
      >
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 14 }}>Basic</div>
        <div style={{ display: "flex", gap: 16 }}>
          <Field label="Name" value="survival-01" flex={1.4} />
          <Field label="Software" value="Paper" />
          <Field label="Version" value="1.21.10" />
          <Field label="Port" value="25565" />
        </div>
      </div>

      {/* Ngrok panel */}
      <div
        style={{
          position: "relative",
          flex: 1,
          padding: 24,
          background: colors.window,
          border: `1px solid ${toggle > 0.5 ? "rgba(16,185,129,0.45)" : colors.border}`,
          borderRadius: radius.card,
        }}
      >
        <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 20, fontWeight: 700 }}>
              <span>Public Access (ngrok)</span>
              {online > 0.01 ? <OnlineBadge p={online} /> : null}
            </div>
            <div style={{ marginTop: 6, fontSize: 15, color: colors.textMuted }}>Allow external connections without port forwarding.</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Button variant="secondary" size="sm">
              Connection Guide
            </Button>
            <Button variant="secondary" size="sm">
              Change Token
            </Button>
            <div
              style={{
                width: 64,
                height: 34,
                borderRadius: 17,
                background: trackColor,
                position: "relative",
                transform: `scale(${1 - pulse(frame, T.toggleClick) * 0.05})`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 4,
                  left: 4 + toggle * 30,
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "#ffffff",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Address card (space is reserved so the log panel never jumps) */}
        <div
          style={{
            marginTop: 20,
            height: 120,
            padding: 18,
            background: colors.panel,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.card - 4,
            opacity: address,
            transform: `translateY(${(1 - address) * 12}px)`,
          }}
        >
          <div style={{ fontSize: 14, color: colors.textMuted }}>Public Address (Share this with friends):</div>
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <code style={{ fontFamily: fonts.mono, fontSize: 26, fontWeight: 500, color: colors.text }}>{ADDRESS}</code>
            <Button
              variant="secondary"
              pressed={pulse(frame, T.copyClick)}
              hover={ramp(frame, T.copyClick - 8, T.copyClick)}
              style={{ width: 96 }}
            >
              Copy
            </Button>
          </div>
        </div>

        {/* Tunnel log */}
        <div
          style={{
            marginTop: 20,
            height: 170,
            padding: "14px 18px",
            background: colors.editorBg,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.card - 4,
            fontFamily: fonts.mono,
            fontSize: 17,
            lineHeight: 1.65,
          }}
        >
          {frame < T.log1 ? <div style={{ color: colors.textFaint }}>Ready to start...</div> : null}
          {LOG_LINES.map((line) => {
            const p = rise(frame, line.at, 8);
            if (p <= 0) {
              return null;
            }
            const isReady = line.text === "Ready";
            return (
              <div
                key={line.text}
                style={{
                  color: isReady ? colors.success : colors.editorText,
                  fontWeight: isReady ? 700 : 400,
                  opacity: p,
                  transform: `translateY(${(1 - p) * 8}px)`,
                }}
              >
                {line.text}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Window-space coordinates. General Settings is the last sidebar row (y 409);
// the toggle and the Copy button sit at the right of the ngrok panel.
const CURSOR_PATH: readonly CursorKeyframe[] = [
  { frame: T.cursorIn, x: 820, y: 560 },
  { frame: T.sidebarClick - 4, x: 120, y: 409 },
  { frame: T.sidebarClick + 16, x: 120, y: 409 },
  { frame: T.toggleClick - 2, x: 1503, y: 347 },
  { frame: 234, x: 1503, y: 347 },
  { frame: T.copyClick - 2, x: 1469, y: 464 },
  { frame: T.copyClick + 80, x: 1469, y: 464 },
];

const CAMERA: readonly CameraKey[] = [
  { frame: 0, x: 800, y: 450, scale: 1 },
  { frame: 44, x: 640, y: 360, scale: 1.5, dur: 46 },
  { frame: 80, x: 880, y: 400, scale: 1.35, dur: 40 },
  { frame: 214, x: 960, y: 550, scale: 1.4, dur: 40 },
  { frame: 312, x: 800, y: 450, scale: 1, dur: 46 },
];

const SERVERS = [{ name: "survival-01", status: "online", group: "Ungrouped" }] as const;

const Inner: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const activeView: NavItem = frame >= T.sidebarClick ? "General Settings" : "Dashboard";
  const swapIn = ramp(frame, T.sidebarClick, T.sidebarClick + 12);

  return (
    <Stage
      durationInFrames={durationInFrames}
      camera={CAMERA}
      windowProps={{ activeView, serverName: "survival-01", serverStatus: "online", servers: SERVERS }}
      overlay={
        <>
          <Toast title="Address copied!" tone="success" showAt={T.toast} hideAt={T.toastHide} />
          <Cursor path={CURSOR_PATH} clicks={[T.sidebarClick, T.toggleClick, T.copyClick]} visibleFrom={T.cursorIn} />
        </>
      }
      annotations={
        <>
          <Callout
            text="no port forwarding"
            at={T.noteNoPort}
            x={1090}
            y={112}
            size={46}
            rotate={-3}
            writeFrames={30}
            until={T.address + 8}
            arrow={{ from: { x: 1400, y: 172 }, to: { x: 1490, y: 320 }, bend: 26 }}
            paper
          />
          <Callout
            text="share with friends"
            at={T.noteShare}
            x={1000}
            y={590}
            size={50}
            rotate={2}
            writeFrames={30}
            arrow={{ from: { x: 1060, y: 590 }, to: { x: 892, y: 494 }, bend: 26 }}
            paper
          />
        </>
      }
    >
      {frame < T.sidebarClick + 14 ? (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - swapIn }}>
          <DashboardStub />
        </div>
      ) : null}
      {frame >= T.sidebarClick ? (
        <div style={{ position: "absolute", inset: 0, opacity: swapIn }}>
          <SettingsContent />
        </div>
      ) : null}
    </Stage>
  );
};

export const ShareOp: React.FC<{ from: number; durationInFrames: number }> = ({ from, durationInFrames }) => (
  <Sequence from={from} durationInFrames={durationInFrames} name="op5 Share">
    <Inner durationInFrames={durationInFrames} />
  </Sequence>
);
