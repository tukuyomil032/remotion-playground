import type React from "react";
import { useId } from "react";
import { interpolate, interpolateColors, Sequence, useCurrentFrame } from "remotion";
import { fonts } from "../fonts";
import { Callout } from "../stage/Callout";
import { clamp01, easeOut, swapAmount } from "../stage/motion";
import { Stage, type CameraKey } from "../stage/Stage";
import { colors, radius } from "../theme";
import { Button, Cursor, KpiTile, LogLine, Modal, StatusDot, type CursorKeyframe, type LogLevel } from "../ui";

// op2 "Run": Start -> EULA -> starting (yellow) -> online (green) -> console
// logs -> Dashboard with live TPS, CPU and Memory charts. All numbers and log
// lines are made up. Frames are scene-local (360 frames; the window slides in
// until 42 and out from 324).

/** Scene-local frames of the main clicks and state changes (for the sound pass). */
export const RUN_OP_CUES = {
  startClick: 80,
  eulaOpen: 82,
  checkClick: 118,
  acceptClick: 142,
  eulaClose: 146,
  starting: 146,
  firstLog: 150,
  doneLog: 198,
  online: 200,
  dashboardClick: 238,
  dashboardIn: 240,
  chartsFlow: 258,
} as const;

const T = RUN_OP_CUES;

// ---------------------------------------------------------------------------
// Console
// ---------------------------------------------------------------------------

type Line = { at: number; time: string; level: LogLevel; thread: string; message: string };

const LINES: readonly Line[] = [
  { at: 150, time: "12:04:01", level: "INFO", thread: "main", message: "Starting minecraft server version 1.21.10" },
  { at: 155, time: "12:04:01", level: "INFO", thread: "main", message: "Using server jar: paper-1.21.10.jar" },
  { at: 160, time: "12:04:01", level: "INFO", thread: "main", message: "Loading properties" },
  { at: 165, time: "12:04:02", level: "INFO", thread: "main", message: "Default game type: SURVIVAL" },
  { at: 170, time: "12:04:02", level: "WARN", thread: "main", message: "Plugin config 'chat.yml' is outdated, using defaults" },
  { at: 175, time: "12:04:02", level: "INFO", thread: "Server thread", message: "Starting Minecraft server on *:25565" },
  { at: 180, time: "12:04:03", level: "ERROR", thread: "Server thread", message: "Could not load 'plugins/LegacyChat.jar' in folder 'plugins'" },
  { at: 185, time: "12:04:03", level: "INFO", thread: "Server thread", message: "Preparing level \"world\"" },
  { at: 189, time: "12:04:04", level: "INFO", thread: "Server thread", message: "Preparing spawn area: 62%" },
  { at: 193, time: "12:04:04", level: "INFO", thread: "Server thread", message: "Preparing spawn area: 100%" },
  { at: T.doneLog, time: "12:04:05", level: "INFO", thread: "Server thread", message: "Done (3.2s)! For help, type \"help\"" },
  { at: 212, time: "12:04:06", level: "INFO", thread: "Server thread", message: "Running delayed init tasks" },
  { at: 222, time: "12:04:08", level: "INFO", thread: "Server thread", message: "Loaded 3 plugins (loading took 412ms)" },
];

const Cell: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div
    style={{
      flex: 1,
      padding: "12px 18px",
      background: colors.window,
      border: `1px solid ${colors.border}`,
      borderRadius: radius.control + 4,
    }}
  >
    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: colors.textFaint }}>{label}</div>
    <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 10, fontSize: 20, fontWeight: 600 }}>
      {children}
    </div>
  </div>
);

type Phase = "offline" | "starting" | "online";

const ConsoleView: React.FC<{ frame: number; phase: Phase }> = ({ frame, phase }) => {
  const dotColor = interpolateColors(frame, [T.online, T.online + 14], [colors.warning, colors.success]);
  const statusWord = phase === "offline" ? "Offline" : phase === "starting" ? "Starting" : "Online";
  const statusTextColor = phase === "offline" ? colors.textMuted : phase === "starting" ? colors.warning : colors.success;
  const memory = Math.round(interpolate(frame, [T.eulaClose, T.online, 330], [0, 880, 1210], clamp01));
  const visible = LINES.filter((l) => frame >= l.at);

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: 20, gap: 14 }}>
      <div style={{ display: "flex", gap: 14, alignItems: "stretch", fontFamily: fonts.ui }}>
        <Cell label="ADDRESS">localhost:25565</Cell>
        <Cell label="STATUS">
          <StatusDot status={phase} size={12} color={phase === "online" ? dotColor : undefined} />
          <span style={{ color: statusTextColor }}>{statusWord}</span>
        </Cell>
        <Cell label="MEMORY">
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{memory.toLocaleString("en-US")} / 4,096 MB</span>
        </Cell>
        <div style={{ display: "flex", alignItems: "center", paddingLeft: 4 }}>
          <Button variant="secondary" size="md">
            Find
          </Button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "14px 18px",
          background: colors.editorBg,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.control + 4,
          overflow: "hidden",
        }}
      >
        {visible.length === 0 ? (
          <div style={{ fontFamily: fonts.mono, fontSize: 16, fontStyle: "italic", color: colors.textFaint }}>
            Waiting for logs...
          </div>
        ) : null}
        {visible.map((l) => (
          <LogLine
            key={l.at}
            time={l.time}
            level={l.level}
            thread={l.thread}
            message={l.message}
            progress={interpolate(frame, [l.at, l.at + 8], [0, 1], { ...clamp01, easing: easeOut })}
            fontSize={17}
          />
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", fontFamily: fonts.ui }}>
        {["ALL", "INFO", "WARN", "ERROR"].map((f) => (
          <span
            key={f}
            style={{
              padding: "5px 12px",
              fontSize: 13,
              fontWeight: 700,
              borderRadius: radius.pill,
              border: `1px solid ${colors.border}`,
              background: f === "ALL" ? colors.border : "transparent",
              color: f === "ALL" ? colors.text : colors.textMuted,
            }}
          >
            {f}
          </span>
        ))}
        <div
          style={{
            flex: 1,
            height: 40,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 14px",
            background: colors.window,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.control,
            fontFamily: fonts.mono,
            fontSize: 16,
            color: colors.textFaint,
          }}
        >
          <span style={{ color: colors.success }}>{">"}</span>Type a command
        </div>
        <Button variant="secondary" size="sm">
          Send
        </Button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

// Made-up telemetry, sampled continuously so the line glides.
const cpuAt = (t: number): number =>
  33 + 11 * Math.sin(t * 0.21) + 6 * Math.sin(t * 0.53 + 1) + 3 * Math.sin(t * 1.3 + 2);
const memAt = (t: number): number =>
  1240 + 120 * Math.sin(t * 0.09) + 60 * Math.sin(t * 0.37 + 0.5) + 20 * Math.sin(t * 1.1);
const tpsAt = (t: number): number => {
  const s = Math.max(0, Math.sin(t * 0.31 - 1.4));
  return 20 - 0.6 * s * s;
};

const POINTS = 60;
const SPEED = 1 / 12; // data points per frame
const sample = (fn: (t: number) => number, frame: number): number[] => {
  const t0 = 400 + frame * SPEED - (POINTS - 1);
  return Array.from({ length: POINTS }, (_, i) => fn(t0 + i));
};

/** Flat area chart: solid translucent fill under a solid line. No gradient. */
const FlatChart: React.FC<{
  data: readonly number[];
  min: number;
  max: number;
  color: string;
  title: string;
  valueLabel: string;
  reveal: number;
  width: number;
  height: number;
}> = ({ data, min, max, color, title, valueLabel, reveal, width, height }) => {
  const clipId = useId().replace(/:/g, "");
  const padTop = 52;
  const padX = 16;
  const padBottom = 16;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;
  const x = (i: number) => padX + (i / (data.length - 1)) * innerW;
  const y = (v: number) => padTop + innerH * (1 - (Math.max(min, Math.min(max, v)) - min) / (max - min));
  const line = data.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(2)},${padTop + innerH} L${x(0).toFixed(2)},${padTop + innerH} Z`;

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        background: colors.panel,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.card,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 18,
          right: 18,
          display: "flex",
          justifyContent: "space-between",
          fontFamily: fonts.ui,
          fontSize: 16,
          color: colors.textMuted,
          fontWeight: 500,
        }}
      >
        <span>{title}</span>
        <span style={{ color, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{valueLabel}</span>
      </div>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <clipPath id={clipId}>
            <rect x={0} y={0} width={padX + innerW * Math.max(0, Math.min(1, reveal))} height={height} />
          </clipPath>
        </defs>
        {[0, 1, 2, 3, 4].map((i) => {
          const gy = padTop + (innerH / 4) * i;
          return <line key={i} x1={padX} x2={padX + innerW} y1={gy} y2={gy} stroke={colors.border} strokeWidth={1} />;
        })}
        <g clipPath={`url(#${clipId})`}>
          <path d={area} fill={color} fillOpacity={0.22} />
          <path d={line} fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
};

const pad2 = (n: number): string => String(n).padStart(2, "0");

const DashboardView: React.FC<{ frame: number }> = ({ frame }) => {
  const tps = sample(tpsAt, frame);
  const cpu = sample(cpuAt, frame);
  const mem = sample(memAt, frame);
  const tpsNow = tps[POINTS - 1];
  const cpuNow = cpu[POINTS - 1];
  const memNow = mem[POINTS - 1];
  const tpsColor = tpsNow >= 18 ? colors.green : tpsNow >= 15 ? colors.warning : colors.danger;
  const uptimeSec = 6 + Math.max(0, Math.floor((frame - T.dashboardIn) / 60));
  const uptime = `00:${pad2(Math.floor(uptimeSec / 60))}:${pad2(uptimeSec % 60)}`;

  const tileAt = (i: number): number => T.dashboardIn + 6 + i * 4;
  const reveal = (i: number): number =>
    interpolate(frame, [T.chartsFlow + i * 8, T.chartsFlow + 44 + i * 8], [0, 1], { ...clamp01, easing: easeOut });
  const tile: React.CSSProperties = { padding: "14px 22px" };

  return (
    <div style={{ position: "absolute", inset: 0, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          height: 72,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          background: colors.window,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.card,
          fontFamily: fonts.ui,
        }}
      >
        <div style={{ fontSize: 24, fontWeight: 700 }}>Dashboard: survival-01</div>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 18 }}>
          <span style={{ color: colors.textMuted }}>Paper 1.21.10</span>
          <span style={{ display: "flex", alignItems: "center", gap: 8, color: colors.success, fontWeight: 600 }}>
            <StatusDot status="online" size={10} />
            Online
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 16 }}>
          <KpiTile
            calm
            label="Status"
            value="Online"
            accent={colors.success}
            icon={<StatusDot status="online" size={9} />}
            enterAt={tileAt(0)}
            style={tile}
          />
          <KpiTile calm label="Current TPS" value={tpsNow.toFixed(1)} accent={tpsColor} sub="ticks per second" enterAt={tileAt(1)} style={tile} />
          <KpiTile calm label="CPU" value={`${Math.round(cpuNow)}%`} accent={colors.info} enterAt={tileAt(2)} style={tile} />
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <KpiTile calm label="Memory" value={`${Math.round(memNow).toLocaleString("en-US")} MB`} accent={colors.textSecondary} enterAt={tileAt(3)} style={tile} />
          <KpiTile calm label="Software" value="Paper" sub="1.21.10" enterAt={tileAt(4)} style={tile} />
          <KpiTile calm label="Uptime" value={uptime} enterAt={tileAt(5)} style={tile} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        <FlatChart
          data={tps}
          min={0}
          max={22}
          color={colors.green}
          title="TPS"
          valueLabel={tpsNow.toFixed(1)}
          reveal={reveal(0)}
          width={414}
          height={340}
        />
        <FlatChart
          data={cpu}
          min={0}
          max={100}
          color={colors.info}
          title="CPU"
          valueLabel={`${Math.round(cpuNow)}%`}
          reveal={reveal(1)}
          width={414}
          height={340}
        />
        <FlatChart
          data={mem}
          min={0}
          max={3072}
          color={colors.textSecondary}
          title="Memory"
          valueLabel={`${Math.round(memNow).toLocaleString("en-US")} MB`}
          reveal={reveal(2)}
          width={414}
          height={340}
        />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

const PT = {
  start: { x: 1388, y: 66 },
  check: { x: 526, y: 486 },
  accept: { x: 1000, y: 564 },
  rest: { x: 1130, y: 400 },
  dashboardItem: { x: 110, y: 122 },
} as const;

const CURSOR_PATH: readonly CursorKeyframe[] = [
  { frame: 34, x: 700, y: 430 },
  { frame: 66, ...PT.start },
  { frame: 84, ...PT.start },
  { frame: 112, ...PT.check },
  { frame: 124, ...PT.check },
  { frame: 138, ...PT.accept },
  { frame: 150, ...PT.accept },
  { frame: 176, ...PT.rest },
  { frame: 206, ...PT.rest },
  { frame: 232, ...PT.dashboardItem },
  { frame: 252, ...PT.dashboardItem },
  { frame: 290, x: 760, y: 600 },
];

const CLICKS = [T.startClick, T.checkClick, T.acceptClick, T.dashboardClick];

// Camera: wide -> Start button (12 frames after the cursor arrives) -> EULA
// -> console -> dashboard -> in on the tiles -> wide again to rest.
const CAMERA: readonly CameraKey[] = [
  { frame: 0, x: 800, y: 450, scale: 1 },
  { frame: 78, x: 1150, y: 250, scale: 1.5, rotate: 1, dur: 32 },
  { frame: 106, x: 800, y: 450, scale: 1.45, rotate: 0, dur: 36 },
  { frame: 152, x: 520, y: 470, scale: 1.3, dur: 40 },
  { frame: 252, x: 810, y: 450, scale: 1.2, dur: 34 },
  { frame: 298, x: 900, y: 430, scale: 1.4, rotate: -1, dur: 30 },
  { frame: 332, x: 800, y: 450, scale: 1, rotate: 0, dur: 44 },
];

const RunOpScene: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();

  const phase: Phase = frame < T.starting ? "offline" : frame < T.online ? "starting" : "online";
  const checked = frame >= T.checkClick + 2;
  const pressAccept = interpolate(frame, [T.acceptClick, T.acceptClick + 4, T.acceptClick + 10], [0, 1, 0], clamp01);
  const dash = swapAmount(frame, T.dashboardIn, undefined, 14);
  const onDashboard = frame >= T.dashboardIn;

  const overlay = (
    <>
      <Modal
        title="Minecraft EULA"
        openAt={T.eulaOpen}
        closeAt={T.eulaClose}
        width={620}
        footer={
          <>
            <Button variant="ghost">Cancel</Button>
            <Button variant="success" pressed={pressAccept}>
              Accept and start
            </Button>
          </>
        }
      >
        <div style={{ fontSize: 17, lineHeight: 1.55, color: colors.textSecondary }}>
          You need to agree to the Minecraft EULA before this server can run.
        </div>
        <div style={{ marginTop: 6, fontSize: 16, color: colors.info }}>https://aka.ms/MinecraftEULA</div>
        <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 14, fontSize: 18 }}>
          <div
            style={{
              width: 24,
              height: 24,
              boxSizing: "border-box",
              borderRadius: 6,
              border: `2px solid ${checked ? colors.success : colors.borderStrong}`,
              background: checked ? colors.success : "transparent",
              color: "#fff",
              fontSize: 16,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {checked ? "✓" : ""}
          </div>
          I agree to the Minecraft EULA
        </div>
      </Modal>
      <Cursor path={CURSOR_PATH} clicks={CLICKS} visibleFrom={32} />
    </>
  );

  return (
    <Stage
      durationInFrames={durationInFrames}
      camera={CAMERA}
      windowProps={{
        activeView: onDashboard ? "Dashboard" : "Console",
        serverName: "survival-01",
        serverStatus: phase,
        servers: [{ name: "survival-01", status: phase, group: "Ungrouped" }],
      }}
      overlay={overlay}
      annotations={
        <>
          <Callout
            text="one click"
            at={58}
            x={1130}
            y={-92}
            rotate={-3}
            size={54}
            arrow={{ from: { x: 1330, y: -28 }, to: { x: 1384, y: 38 }, bend: 22 }}
            until={118}
          />
          <Callout
            text="live TPS"
            at={266}
            x={640}
            y={108}
            rotate={-4}
            size={46}
            arrow={{ from: { x: 760, y: 176 }, to: { x: 900, y: 206 }, bend: 22 }}
            paper
          />
        </>
      }
    >
      {dash < 0.998 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 1 - dash,
            filter: dash > 0.002 ? `blur(${dash * 10}px)` : undefined,
          }}
        >
          <ConsoleView frame={frame} phase={phase} />
        </div>
      ) : null}
      {dash > 0.002 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: dash,
            filter: dash < 0.998 ? `blur(${(1 - dash) * 10}px)` : undefined,
          }}
        >
          <DashboardView frame={frame} />
        </div>
      ) : null}
    </Stage>
  );
};

export const RunOp: React.FC<{ from: number; durationInFrames: number }> = ({ from, durationInFrames }) => (
  <Sequence from={from} durationInFrames={durationInFrames} name="op2 Run">
    <RunOpScene durationInFrames={durationInFrames} />
  </Sequence>
);
