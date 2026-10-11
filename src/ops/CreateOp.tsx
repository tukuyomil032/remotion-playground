import type React from "react";
import { interpolate, Sequence, useCurrentFrame } from "remotion";
import { fonts } from "../fonts";
import { Callout } from "../stage/Callout";
import { clamp01, drawStroke, easeInOut, easeOut } from "../stage/motion";
import { Stage, type CameraKey } from "../stage/Stage";
import { palette, colors, radius } from "../theme";
import { Button, Cursor, Modal, Toast, type CursorKeyframe } from "../ui";

// op1 "Create": the New server form (Paper, 1.21.10, survival-01, 25565, 4 GB),
// the download toast, and the new server showing up in the sidebar (offline).
// The camera pushes in on "+ Add Server" a little after the cursor gets there,
// follows the form, pulls back for the toast, then leans toward the sidebar.
// All frames are scene-local (360 frames; the window slides in until 42 and
// out from 324).

/** Scene-local frames of the main clicks and state changes (for the sound pass). */
export const CREATE_OP_CUES = {
  addServerClick: 88,
  modalOpen: 88,
  nameClick: 110,
  softwareClick: 138,
  paperClick: 154,
  versionClick: 166,
  versionPick: 180,
  portClick: 190,
  memoryClick: 208,
  createClick: 232,
  modalClose: 236,
  toastShow: 252,
  downloadDone: 296,
  serverAppears: 300,
} as const;

const T = CREATE_OP_CUES;

// Cursor targets in window pixel space (1600 x 900).
const PT = {
  start: { x: 1010, y: 330 },
  addServer: { x: 136, y: 862 },
  name: { x: 560, y: 372 },
  software: { x: 600, y: 462 },
  paper: { x: 560, y: 543 },
  version: { x: 960, y: 462 },
  v1210: { x: 920, y: 505 },
  port: { x: 560, y: 552 },
  memory: { x: 960, y: 552 },
  create: { x: 1112, y: 634 },
  away: { x: 1250, y: 700 },
} as const;

const CURSOR_PATH: readonly CursorKeyframe[] = [
  { frame: 40, ...PT.start },
  { frame: 64, ...PT.addServer },
  { frame: 90, ...PT.addServer },
  { frame: 108, ...PT.name },
  { frame: 134, ...PT.name },
  { frame: 138, ...PT.software },
  { frame: 154, ...PT.paper },
  { frame: 160, ...PT.paper },
  { frame: 166, ...PT.version },
  { frame: 180, ...PT.v1210 },
  { frame: 184, ...PT.v1210 },
  { frame: 190, ...PT.port },
  { frame: 208, ...PT.memory },
  { frame: 224, ...PT.memory },
  { frame: 232, ...PT.create },
  { frame: 240, ...PT.create },
  { frame: 280, ...PT.away },
];

const CLICKS = [
  T.addServerClick,
  T.nameClick,
  T.softwareClick,
  T.paperClick,
  T.versionClick,
  T.versionPick,
  T.portClick,
  T.memoryClick,
  T.createClick,
];

// Camera: wide -> Add Server (12 frames after the cursor arrives at 64+)
// -> form -> wide for the toast -> toward the sidebar row -> wide again to rest.
const CAMERA: readonly CameraKey[] = [
  { frame: 0, x: 800, y: 450, scale: 1 },
  { frame: 76, x: 480, y: 650, scale: 1.55, rotate: -1, dur: 34 },
  { frame: 104, x: 800, y: 440, scale: 1.45, rotate: 0, dur: 38 },
  { frame: 246, x: 800, y: 450, scale: 1, dur: 40 },
  { frame: 308, x: 560, y: 560, scale: 1.3, rotate: -1, dur: 30 },
  { frame: 336, x: 800, y: 450, scale: 1, rotate: 0, dur: 44 },
];

const typed = (text: string, frame: number, start: number, framesPerChar: number): string =>
  text.slice(0, Math.max(0, Math.min(text.length, Math.floor((frame - start) / framesPerChar) + 1)));

const Caret: React.FC<{ active: boolean }> = ({ active }) => {
  const frame = useCurrentFrame();
  if (!active) {
    return null;
  }
  return (
    <span
      style={{
        display: "inline-block",
        width: 2,
        height: 22,
        marginLeft: 2,
        verticalAlign: "middle",
        background: colors.text,
        opacity: Math.floor(frame / 18) % 2 === 0 ? 1 : 0,
      }}
    />
  );
};

const Field: React.FC<{
  label: string;
  value?: string;
  placeholder?: string;
  focused?: boolean;
  caret?: boolean;
  select?: boolean;
  suffix?: string;
  mono?: boolean;
  children?: React.ReactNode;
}> = ({ label, value, placeholder, focused = false, caret = false, select = false, suffix, mono, children }) => (
  <div style={{ position: "relative" }}>
    <div style={{ height: 18, marginBottom: 8, fontSize: 14, fontWeight: 600, color: colors.textMuted }}>{label}</div>
    <div
      style={{
        height: 44,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 14px",
        fontSize: 18,
        fontFamily: mono ? fonts.mono : fonts.ui,
        background: colors.window,
        border: `1px solid ${focused ? colors.textMuted : colors.borderStrong}`,
        boxShadow: focused ? "0 0 0 3px rgba(244,244,245,0.12)" : "none",
        borderRadius: radius.control,
        color: value ? colors.text : colors.textFaint,
      }}
    >
      <span>
        {value || placeholder}
        <Caret active={caret} />
        {suffix && value ? <span style={{ color: colors.textMuted, marginLeft: 8 }}>{suffix}</span> : null}
      </span>
      {select ? <span style={{ color: colors.textMuted, fontSize: 14 }}>v</span> : null}
    </div>
    {children}
  </div>
);

const Dropdown: React.FC<{ items: readonly string[]; active: string; openAt: number; closeAt: number }> = ({
  items,
  active,
  openAt,
  closeAt,
}) => {
  const frame = useCurrentFrame();
  const p =
    interpolate(frame, [openAt, openAt + 8], [0, 1], { ...clamp01, easing: easeOut }) *
    interpolate(frame, [closeAt, closeAt + 6], [1, 0], clamp01);
  if (p <= 0.01) {
    return null;
  }
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 74,
        zIndex: 5,
        padding: 6,
        background: colors.panel,
        border: `1px solid ${colors.borderStrong}`,
        borderRadius: radius.control,
        boxShadow: "0 18px 40px rgba(0,0,0,0.55)",
        opacity: p,
        transform: `translateY(${(1 - p) * -6}px)`,
      }}
    >
      {items.map((it) => (
        <div
          key={it}
          style={{
            height: 38,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            padding: "0 10px",
            fontSize: 17,
            borderRadius: 6,
            background: it === active ? colors.border : "transparent",
            color: it === active ? colors.text : colors.textSecondary,
          }}
        >
          {it}
        </div>
      ))}
    </div>
  );
};

/** Hand-drawn ring around the new sidebar row (world space). */
const RowRing: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 22], [0, 1], { ...clamp01, easing: easeInOut });
  if (p <= 0) {
    return null;
  }
  return (
    <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <path
        d="M 40 535 C 90 523, 200 521, 252 535 C 268 545, 262 569, 240 575 C 190 585, 90 585, 38 573 C 20 565, 24 541, 62 531"
        stroke={palette.tomato}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        pathLength={1}
        {...drawStroke(p)}
      />
    </svg>
  );
};

const CreateOpScene: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();

  const created = frame >= T.serverAppears;
  const name = typed("survival-01", frame, T.nameClick + 4, 2);
  const port = typed("25565", frame, T.portClick + 4, 2);
  const mem = typed("4", frame, T.memoryClick + 4, 2);
  const software = frame >= T.paperClick + 2 ? "Paper" : "";
  const version = frame >= T.versionPick + 2 ? "1.21.10" : "";

  const nameFocus = frame >= T.nameClick && frame < T.softwareClick;
  const softFocus = frame >= T.softwareClick && frame < T.paperClick + 4;
  const verFocus = frame >= T.versionClick && frame < T.versionPick + 4;
  const portFocus = frame >= T.portClick && frame < T.memoryClick;
  const memFocus = frame >= T.memoryClick && frame < T.createClick - 6;

  const pressCreate = interpolate(frame, [T.createClick, T.createClick + 4, T.createClick + 10], [0, 1, 0], clamp01);
  const emptyIn = interpolate(frame, [20, 44], [0, 1], clamp01);
  const download = interpolate(frame, [T.toastShow + 6, T.downloadDone], [0, 1], { ...clamp01, easing: easeInOut });
  const toastDone = frame >= T.downloadDone;

  const overlay = (
    <>
      <Modal
        title="New server"
        openAt={T.modalOpen}
        closeAt={T.modalClose}
        width={760}
        footer={
          <>
            <Button variant="ghost">Cancel</Button>
            <Button variant="primary" pressed={pressCreate}>
              Create
            </Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20, height: 250 }}>
          <Field label="Name" value={name} placeholder="my-server" focused={nameFocus} caret={nameFocus} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <Field label="Software" value={software} placeholder="Select software" select focused={softFocus}>
              <Dropdown
                items={["Vanilla", "Paper", "LeafMC", "Fabric"]}
                active="Paper"
                openAt={T.softwareClick}
                closeAt={T.paperClick + 4}
              />
            </Field>
            <Field label="Version" value={version} placeholder="Select version" select focused={verFocus}>
              <Dropdown
                items={["1.21.10", "1.21.9", "1.21.8", "1.21.7"]}
                active="1.21.10"
                openAt={T.versionClick}
                closeAt={T.versionPick + 4}
              />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <Field label="Port" value={port} placeholder="25565" focused={portFocus} caret={portFocus} mono />
            <Field
              label="Memory"
              value={mem}
              placeholder="4"
              suffix="GB"
              focused={memFocus}
              caret={memFocus}
              mono
            />
          </div>
        </div>
      </Modal>
      <Toast
        flat
        title={toastDone ? "Downloaded Paper 1.21.10" : "Downloading Paper 1.21.10"}
        message="survival-01"
        progress={download}
        showAt={T.toastShow}
      />
      <Cursor path={CURSOR_PATH} clicks={CLICKS} visibleFrom={36} />
    </>
  );

  return (
    <Stage
      durationInFrames={durationInFrames}
      camera={CAMERA}
      windowProps={{
        activeView: "Dashboard",
        serverName: created ? "survival-01" : "No server",
        serverStatus: "offline",
        servers: created ? [{ name: "survival-01", status: "offline", group: "Ungrouped" }] : [],
      }}
      overlay={overlay}
      annotations={
        <>
          <Callout
            text="pick Paper"
            at={132}
            x={150}
            y={330}
            rotate={-5}
            size={50}
            arrow={{ from: { x: 290, y: 410 }, to: { x: 436, y: 462 }, bend: 26 }}
            until={176}
            paper
          />
          <Callout
            text="one form"
            at={190}
            x={1222}
            y={716}
            rotate={4}
            size={50}
            arrow={{ from: { x: 1280, y: 712 }, to: { x: 1160, y: 652 }, bend: -24 }}
            until={232}
            paper
          />
          <RowRing at={T.serverAppears + 4} />
        </>
      }
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          opacity: emptyIn,
          fontFamily: fonts.ui,
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 700, color: colors.textSecondary }}>
          {created ? "survival-01" : "No servers yet"}
        </div>
        <div style={{ fontSize: 17, color: colors.textFaint }}>
          {created ? "Paper 1.21.10 / Port 25565 / 4 GB" : "Click Add Server to create one"}
        </div>
      </div>
    </Stage>
  );
};

export const CreateOp: React.FC<{ from: number; durationInFrames: number }> = ({ from, durationInFrames }) => (
  <Sequence from={from} durationInFrames={durationInFrames} name="op1 Create">
    <CreateOpScene durationInFrames={durationInFrames} />
  </Sequence>
);
