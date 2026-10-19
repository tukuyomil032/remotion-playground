import type React from "react";
import { interpolate, Sequence, useCurrentFrame } from "remotion";
import { Callout } from "../stage/Callout";
import { clamp01, easeOut } from "../stage/motion";
import { Stage, type CameraKey } from "../stage/Stage";
import { colors, radius } from "../theme";
import { Button, Cursor, type CursorKeyframe, Modal, type NavItem } from "../ui";
import { DashboardStub } from "./DashboardStub";

// op3 "Extend": camera pushes in on the sidebar, opens Plugins / Mods, searches
// "world" across three sources, installs one plugin (dependency check) and ends
// on the Installed tab with an "Update Available" mark.
// All frames are scene-local (0..359). The window slides in over 0..42 and out
// over 324..360, so the operation lives in about 42..324.

const T = {
  cursorIn: 36,
  sidebarClick: 72,
  noteSources: 90,
  hopHangar: 98,
  hopSpigot: 108,
  hopModrinth: 118,
  searchClick: 122,
  typeStart: 126,
  typePerChar: 6,
  resultsAt: 162,
  noteOneClick: 164,
  hoverInstall: 190,
  installClick: 202,
  modalOpen: 204,
  yesClick: 244,
  modalClose: 248,
  tabClick: 262,
  tabSwap: 266,
  updateBadge: 286,
} as const;

const QUERY = "world";
const SOURCES = ["Modrinth", "Hangar", "SpigotMC"] as const;

const CAMERA: readonly CameraKey[] = [
  { frame: 0, x: 800, y: 450, scale: 1 },
  { frame: 44, x: 640, y: 330, scale: 1.5, dur: 46 },
  { frame: 78, x: 960, y: 330, scale: 1.5, dur: 40 },
  { frame: 184, x: 1000, y: 400, scale: 1.6, dur: 36 },
  { frame: 250, x: 900, y: 330, scale: 1.4, dur: 40 },
  { frame: 306, x: 800, y: 450, scale: 1, dur: 44 },
];

// Window-space coordinates. Content card origin is about (261, 97).
const CURSOR_PATH: readonly CursorKeyframe[] = [
  { frame: T.cursorIn, x: 820, y: 560 },
  { frame: T.sidebarClick - 4, x: 112, y: 287 },
  { frame: T.sidebarClick + 22, x: 112, y: 287 },
  { frame: T.searchClick, x: 640, y: 203 },
  { frame: T.searchClick + 30, x: 640, y: 203 },
  { frame: T.installClick - 4, x: 1500, y: 382 },
  { frame: T.installClick + 14, x: 1500, y: 382 },
  { frame: T.yesClick - 4, x: 1030, y: 588 },
  { frame: T.yesClick + 6, x: 1030, y: 588 },
  { frame: T.tabClick - 2, x: 478, y: 141 },
  { frame: T.tabClick + 40, x: 478, y: 141 },
];

const pulse = (frame: number, at: number): number => interpolate(frame, [at, at + 4, at + 10], [0, 1, 0], clamp01);

// ---------- small parts ----------

type Tone = "success" | "warning" | "muted" | "info";
const TONE: Record<Tone, string> = {
  success: colors.success,
  warning: colors.warning,
  muted: colors.textMuted,
  info: colors.info,
};

const Badge: React.FC<{ label: string; tone: Tone }> = ({ label, tone }) => {
  const c = TONE[tone];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: radius.pill,
        fontSize: 13,
        fontWeight: 600,
        color: c,
        background: `${c}22`,
        border: `1px solid ${c}55`,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
};

const Icon: React.FC<{ letter: string; tint: string; size?: number }> = ({ letter, tint, size = 56 }) => (
  <div
    style={{
      width: size,
      height: size,
      flexShrink: 0,
      borderRadius: 14,
      background: `${tint}26`,
      border: `1px solid ${tint}66`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.46,
      fontWeight: 800,
      color: tint,
    }}
  >
    {letter}
  </div>
);

const Toggle: React.FC = () => (
  <div style={{ width: 44, height: 24, borderRadius: 12, background: colors.success, position: "relative" }}>
    <div style={{ position: "absolute", top: 3, right: 3, width: 18, height: 18, borderRadius: "50%", background: "#fff" }} />
  </div>
);

const TabPill: React.FC<{ label: string; active: boolean }> = ({ label, active }) => (
  <div
    style={{
      padding: "9px 20px",
      borderRadius: radius.control,
      fontSize: 16,
      fontWeight: 600,
      color: active ? colors.text : colors.textMuted,
      background: active ? colors.border : "transparent",
    }}
  >
    {label}
  </div>
);

// Selected chip: white fill, black text (as in the real app).
const Chip: React.FC<{ label: string; active: boolean }> = ({ label, active }) => (
  <div
    style={{
      padding: "8px 16px",
      borderRadius: radius.pill,
      fontSize: 14,
      fontWeight: 600,
      color: active ? "#09090b" : colors.textMuted,
      background: active ? "#ffffff" : "transparent",
      border: `1px solid ${active ? "#ffffff" : colors.borderStrong}`,
    }}
  >
    {label}
  </div>
);

// ---------- Browse ----------

type PluginInfo = { name: string; author: string; desc: string; tint: string };

const DEFAULT_PLUGINS: readonly PluginInfo[] = [
  { name: "EssentialsX", author: "EssentialsX", desc: "Core commands for your server: homes, warps, kits and more.", tint: colors.info },
  { name: "LuckPerms", author: "Luck", desc: "Fast and flexible permissions management for players and groups.", tint: colors.success },
  { name: "Vault", author: "MilkBowl", desc: "Economy and permissions API that other plugins hook into.", tint: colors.warning },
  { name: "CoreProtect", author: "Intelli", desc: "Fast block logging, lookups and rollbacks.", tint: colors.textSecondary },
];

const WORLD_PLUGINS: readonly PluginInfo[] = [
  { name: "WorldEdit", author: "EngineHub", desc: "In-game map editor for building and terraforming at speed.", tint: colors.warning },
  { name: "WorldGuard", author: "EngineHub", desc: "Protect regions of your world from griefing and unwanted changes.", tint: colors.info },
  { name: "Multiverse-Core", author: "Multiverse", desc: "Manage multiple worlds on a single server.", tint: colors.success },
  { name: "Chunky", author: "pop4959", desc: "Pre-generate chunks to keep exploration smooth.", tint: colors.danger },
  { name: "BlueMap", author: "BlueColored", desc: "Live 3D map of your worlds, viewable in the browser.", tint: colors.info },
  { name: "Dynmap", author: "mikeprimm", desc: "Live web map for exploring your worlds from anywhere.", tint: colors.textSecondary },
];

const CARD_W = 630;
const CARD_H = 170;
const GRID_Y = 148;

const PluginCard: React.FC<{
  plugin: PluginInfo;
  x: number;
  y: number;
  enterAt?: number;
  installHover?: number;
  installPressed?: number;
  opacity?: number;
}> = ({ plugin, x, y, enterAt = 0, installHover = 0, installPressed = 0, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [enterAt, enterAt + 22], [0, 1], { ...clamp01, easing: easeOut });
  const checking = frame < enterAt + 20;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: CARD_W,
        height: CARD_H,
        boxSizing: "border-box",
        padding: 20,
        background: colors.window,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.card,
        display: "flex",
        gap: 18,
        opacity: p * opacity,
        transform: `translateY(${(1 - p) * 20}px)`,
      }}
    >
      <Icon letter={plugin.name[0]} tint={plugin.tint} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 21, fontWeight: 700 }}>{plugin.name}</span>
          <Badge label={checking ? "Checking" : "Compatible"} tone={checking ? "muted" : "success"} />
        </div>
        <div style={{ marginTop: 2, fontSize: 14, color: colors.textFaint }}>by {plugin.author}</div>
        <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.45, color: colors.textMuted }}>{plugin.desc}</div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Button variant="secondary" size="sm">
            Details
          </Button>
          <Button variant="primary" size="sm" hover={installHover} pressed={installPressed}>
            Install
          </Button>
        </div>
      </div>
    </div>
  );
};

const BrowseView: React.FC = () => {
  const frame = useCurrentFrame();
  const typed = Math.max(0, Math.min(QUERY.length, Math.floor((frame - T.typeStart) / T.typePerChar) + 1));
  const text = frame < T.typeStart ? "" : QUERY.slice(0, typed);
  const caretOn = Math.floor(frame / 18) % 2 === 0;
  const defaultsOut = interpolate(frame, [T.resultsAt - 12, T.resultsAt - 2], [1, 0], clamp01);
  const installHover = interpolate(frame, [T.hoverInstall, T.hoverInstall + 10], [0, 1], clamp01);
  const installPressed = pulse(frame, T.installClick);
  const focused = frame >= T.searchClick;

  // The source chip hops Modrinth -> Hangar -> SpigotMC -> back to Modrinth.
  const activeSource = frame < T.hopHangar ? 0 : frame < T.hopSpigot ? 1 : frame < T.hopModrinth ? 2 : 0;

  const gx = (i: number): number => 24 + (i % 2) * (CARD_W + 16);
  const gy = (i: number): number => GRID_Y + Math.floor(i / 2) * (CARD_H + 16);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 24, right: 24, top: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <TabPill label="Browse" active />
          <TabPill label="Installed (3)" active={false} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {SOURCES.map((s, i) => (
            <Chip key={s} label={s} active={i === activeSource} />
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", left: 24, right: 24, top: 82, height: 48, display: "flex", gap: 12 }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            padding: "0 18px",
            fontSize: 18,
            background: colors.window,
            border: `1px solid ${focused ? colors.textMuted : colors.borderStrong}`,
            borderRadius: radius.control,
            color: colors.text,
          }}
        >
          {text === "" ? <span style={{ color: colors.textFaint }}>Search plugins on {SOURCES[activeSource]}</span> : text}
          {focused && typed < QUERY.length + 2 && caretOn ? (
            <span style={{ width: 2, height: 22, background: colors.text, marginLeft: 2 }} />
          ) : null}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 18px",
            fontSize: 16,
            color: colors.textMuted,
            border: `1px solid ${colors.borderStrong}`,
            borderRadius: radius.control,
          }}
        >
          Sort: Relevance
        </div>
      </div>

      {frame < T.resultsAt
        ? DEFAULT_PLUGINS.map((pl, i) => <PluginCard key={pl.name} plugin={pl} x={gx(i)} y={gy(i)} opacity={defaultsOut} />)
        : WORLD_PLUGINS.map((pl, i) => (
            <PluginCard
              key={pl.name}
              plugin={pl}
              x={gx(i)}
              y={gy(i)}
              enterAt={T.resultsAt + i * 6}
              installHover={pl.name === "WorldGuard" ? installHover : 0}
              installPressed={pl.name === "WorldGuard" ? installPressed : 0}
            />
          ))}
    </div>
  );
};

// ---------- Installed ----------

type InstalledRow = { name: string; tint: string; state: "new" | "update" | "ok"; newIndex?: number };
const INSTALLED: readonly InstalledRow[] = [
  { name: "WorldGuard", tint: colors.info, state: "new", newIndex: 0 },
  { name: "WorldEdit", tint: colors.warning, state: "new", newIndex: 1 },
  { name: "LuckPerms", tint: colors.success, state: "update" },
  { name: "EssentialsX", tint: colors.info, state: "ok" },
  { name: "Vault", tint: colors.warning, state: "ok" },
];

const InstalledList: React.FC = () => {
  const frame = useCurrentFrame();
  const badgeP = interpolate(frame, [T.updateBadge, T.updateBadge + 14], [0, 1], { ...clamp01, easing: easeOut });
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 24, right: 24, top: 90, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Installed plugins</div>
        <div style={{ opacity: badgeP, transform: `translateX(${(1 - badgeP) * 12}px)` }}>
          <Badge label="1 update available" tone="warning" />
        </div>
      </div>
      {INSTALLED.map((row, i) => {
        const enterAt = row.state === "new" ? T.tabSwap + 4 + (row.newIndex ?? 0) * 8 : T.tabSwap + 10 + i * 4;
        const p = interpolate(frame, [enterAt, enterAt + 20], [0, 1], { ...clamp01, easing: easeOut });
        const isNew = row.state === "new";
        const tint = isNew ? interpolate(frame, [enterAt + 10, enterAt + 40, enterAt + 80], [0, 1, 0], clamp01) : 0;
        return (
          <div
            key={row.name}
            style={{
              position: "absolute",
              left: 24,
              right: 24,
              top: 140 + i * 82,
              height: 70,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "0 20px",
              background: colors.window,
              border: `1px solid ${isNew ? `rgba(16,185,129,${0.15 + tint * 0.6})` : colors.border}`,
              borderRadius: radius.card,
              opacity: p,
              transform: `translateY(${(1 - p) * 16}px)`,
            }}
          >
            <Icon letter={row.name[0]} tint={row.tint} size={42} />
            <div style={{ fontSize: 19, fontWeight: 700 }}>{row.name}.jar</div>
            <div style={{ flex: 1 }} />
            {row.state === "update" ? (
              <div style={{ transform: `scale(${0.6 + 0.4 * badgeP})`, transformOrigin: "right center", opacity: badgeP }}>
                <Badge label="Update Available" tone="warning" />
              </div>
            ) : row.state === "ok" ? (
              <Badge label="Up to Date" tone="muted" />
            ) : (
              <Badge label="Just installed" tone="success" />
            )}
            <Toggle />
          </div>
        );
      })}
    </div>
  );
};

// ---------- scene ----------

const SERVERS = [
  { name: "survival-01", status: "online", group: "Ungrouped" },
  { name: "creative-02", status: "offline", group: "Ungrouped" },
] as const;

const Overlay: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <Modal
        title="Install WorldGuard"
        openAt={T.modalOpen}
        closeAt={T.modalClose}
        width={640}
        footer={
          <>
            <Button variant="secondary">Not now</Button>
            <Button
              variant="primary"
              hover={interpolate(frame, [T.yesClick - 16, T.yesClick - 6], [0, 1], clamp01)}
              pressed={pulse(frame, T.yesClick)}
            >
              Yes, install both
            </Button>
          </>
        }
      >
        <div style={{ fontSize: 20, fontWeight: 600 }}>Install required dependencies first?</div>
        <div style={{ marginTop: 8, fontSize: 16, color: colors.textMuted }}>WorldGuard needs the following plugin to run.</div>
        <div
          style={{
            marginTop: 18,
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "12px 16px",
            background: colors.window,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.control + 4,
          }}
        >
          <Icon letter="W" tint={colors.warning} size={40} />
          <span style={{ fontSize: 18, fontWeight: 700 }}>WorldEdit</span>
          <div style={{ flex: 1 }} />
          <Badge label="Required" tone="warning" />
        </div>
      </Modal>
      <Cursor path={CURSOR_PATH} clicks={[T.sidebarClick, T.searchClick, T.installClick, T.yesClick, T.tabClick]} visibleFrom={T.cursorIn} />
    </>
  );
};

const Inner: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const activeView: NavItem = frame >= T.sidebarClick ? "Plugins / Mods" : "Dashboard";

  const swapIn = interpolate(frame, [T.sidebarClick, T.sidebarClick + 12], [0, 1], clamp01);
  const browseOpacity = swapIn * interpolate(frame, [T.tabSwap - 6, T.tabSwap + 4], [1, 0], clamp01);
  const installedOpacity = interpolate(frame, [T.tabSwap, T.tabSwap + 10], [0, 1], clamp01);
  const showInstalled = frame >= T.tabSwap - 4;

  return (
    <Stage
      durationInFrames={durationInFrames}
      camera={CAMERA}
      windowProps={{ activeView, serverName: "survival-01", serverStatus: "online", servers: SERVERS }}
      overlay={<Overlay />}
      annotations={
        <>
          <Callout
            text="search three sources"
            at={T.noteSources}
            x={640}
            y={32}
            size={46}
            rotate={-2}
            writeFrames={32}
            until={T.searchClick + 50}
            arrow={{ from: { x: 1070, y: 78 }, to: { x: 1296, y: 126 }, bend: 18 }}
            paper
          />
          <Callout
            text="one click"
            at={T.noteOneClick}
            x={1215}
            y={460}
            size={52}
            rotate={3}
            writeFrames={18}
            until={T.installClick + 4}
            arrow={{ from: { x: 1410, y: 466 }, to: { x: 1490, y: 404 }, bend: 22 }}
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
        <div style={{ position: "absolute", inset: 0, opacity: browseOpacity }}>{frame < T.tabSwap + 4 ? <BrowseView /> : null}</div>
      ) : null}
      {showInstalled ? (
        <div style={{ position: "absolute", inset: 0, opacity: installedOpacity }}>
          <div style={{ position: "absolute", left: 24, right: 24, top: 24, display: "flex", gap: 6 }}>
            <TabPill label="Browse" active={false} />
            <TabPill label="Installed (5)" active />
          </div>
          <InstalledList />
        </div>
      ) : null}
    </Stage>
  );
};

export const ExtendOp: React.FC<{ from: number; durationInFrames: number }> = ({ from, durationInFrames }) => (
  <Sequence from={from} durationInFrames={durationInFrames} name="op3 Extend">
    <Inner durationInFrames={durationInFrames} />
  </Sequence>
);
