import type React from "react";
import { Easing, interpolate, Sequence, useCurrentFrame } from "remotion";
import { Callout } from "../stage/Callout";
import { clamp01, easeOut } from "../stage/motion";
import { Stage, type CameraKey } from "../stage/Stage";
import { colors, fonts, radius } from "../theme";
import { Button, Cursor, type CursorKeyframe, Modal, type NavItem } from "../ui";
import { DashboardStub } from "./DashboardStub";

// op4 "Back up": camera pushes in on the sidebar, opens Backups, + Create Backup,
// picks targets in a separate window, shows progress, then a "Full" row appears
// and the cursor rests on Restore.
// All frames are scene-local (0..359). The window slides in over 0..42 and out
// over 324..360. No differential backups, no "safe stop": Full and Restore only.

const T = {
  cursorIn: 36,
  sidebarClick: 70,
  createClick: 108,
  modalOpen: 110,
  selectorClick: 126,
  selectorOpen: 128,
  checkWorld: 138,
  checkPlugins: 146,
  checkProps: 154,
  applyClick: 168,
  selectorClose: 170,
  submitClick: 190,
  modalClose: 198,
  progressFrom: 202,
  progressTo: 262,
  done: 266,
  noteRestore: 278,
  restoreArrive: 298,
} as const;

const pulse = (frame: number, at: number): number => interpolate(frame, [at, at + 4, at + 10], [0, 1, 0], clamp01);
const rise = (frame: number, at: number, dur = 14): number =>
  interpolate(frame, [at, at + dur], [0, 1], { ...clamp01, easing: easeOut });
const ramp = (frame: number, from: number, to: number): number => interpolate(frame, [from, to], [0, 1], clamp01);

// ---------- small shared bits ----------

const FolderIcon: React.FC = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path d="M2 6a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" fill={colors.gold} opacity={0.9} />
  </svg>
);

const FileIcon: React.FC = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path d="M6 2h8l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill={colors.textFaint} />
  </svg>
);

const Chevron: React.FC<{ open: boolean }> = ({ open }) => (
  <svg width={20} height={20} viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
    <path
      d={open ? "M5 8l5 5 5-5" : "M8 5l5 5-5 5"}
      fill="none"
      stroke={colors.textMuted}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Checkbox: React.FC<{ state: "checked" | "unchecked"; pop?: number; dim?: boolean }> = ({ state, pop = 0, dim = false }) => {
  const checked = state === "checked";
  return (
    <span
      style={{
        width: 20,
        height: 20,
        flexShrink: 0,
        borderRadius: 5,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: checked ? colors.info : "transparent",
        border: `1.5px solid ${checked ? colors.info : colors.borderStrong}`,
        opacity: dim && checked ? 0.6 : 1,
        transform: `scale(${1 + pop * 0.18})`,
      }}
    >
      {checked ? (
        <svg width={14} height={14} viewBox="0 0 14 14">
          <path d="M3 7.5l2.7 2.7L11 4.5" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </span>
  );
};

const FakeField: React.FC<{ children: React.ReactNode; muted?: boolean; style?: React.CSSProperties }> = ({ children, muted, style }) => (
  <div
    style={{
      height: 42,
      display: "flex",
      alignItems: "center",
      padding: "0 14px",
      fontSize: 16,
      color: muted ? colors.textFaint : colors.text,
      background: colors.window,
      border: `1px solid ${colors.borderStrong}`,
      borderRadius: radius.control,
      ...style,
    }}
  >
    {children}
  </div>
);

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 14, fontWeight: 600, color: colors.textSecondary, marginBottom: 8 }}>{children}</div>
);

const Help: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 13, color: colors.textFaint, marginTop: 6 }}>{children}</div>
);

// ---------- target selector (separate window) ----------

type TreeRow = {
  name: string;
  depth: number;
  dir: boolean;
  open?: boolean;
  size: string;
  /** Frame at which the row itself is ticked. */
  checkAt?: number;
  /** Ticked implicitly because the parent is. */
  inheritFrom?: number;
};

const TREE: readonly TreeRow[] = [
  { name: "world", depth: 0, dir: true, open: true, size: "842 MB", checkAt: T.checkWorld },
  { name: "region", depth: 1, dir: true, size: "780 MB", inheritFrom: T.checkWorld },
  { name: "playerdata", depth: 1, dir: true, size: "2.1 MB", inheritFrom: T.checkWorld },
  { name: "level.dat", depth: 1, dir: false, size: "1.6 KB", inheritFrom: T.checkWorld },
  { name: "world_nether", depth: 0, dir: true, size: "96 MB" },
  { name: "world_the_end", depth: 0, dir: true, size: "24 MB" },
  { name: "plugins", depth: 0, dir: true, size: "58 MB", checkAt: T.checkPlugins },
  { name: "server.properties", depth: 0, dir: false, size: "1.4 KB", checkAt: T.checkProps },
];

// Window-space box of the selector. Moved left of center (a separate OS window
// can sit anywhere) so a note fits on its right.
const SEL = { x: 330, y: 150, w: 780, h: 580, rowH: 36, treeTop: 192 } as const;
const selRowCenterY = (i: number): number => SEL.y + SEL.treeTop + i * SEL.rowH + SEL.rowH / 2;
const selCheckX = SEL.x + 64;
const applyX = SEL.x + SEL.w - 24 - 85;
const applyY = SEL.y + SEL.h - 38;

const SelectorWindow: React.FC = () => {
  const frame = useCurrentFrame();
  const open = rise(frame, T.selectorOpen, 12);
  const close = interpolate(frame, [T.selectorClose, T.selectorClose + 10], [1, 0], { ...clamp01, easing: easeOut });
  const p = Math.min(open, close);
  if (p <= 0.001) {
    return null;
  }

  const selectedCount = [T.checkWorld, T.checkPlugins, T.checkProps].filter((f) => frame >= f).length;

  return (
    <div
      style={{
        position: "absolute",
        left: SEL.x,
        top: SEL.y,
        width: SEL.w,
        height: SEL.h,
        background: colors.window,
        border: `1px solid ${colors.borderStrong}`,
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 40px 100px rgba(0,0,0,0.7)",
        fontFamily: fonts.ui,
        color: colors.text,
        opacity: p,
        transform: `translateY(${(1 - p) * 16}px) scale(${0.96 + 0.04 * p})`,
      }}
    >
      {/* title bar */}
      <div style={{ height: 36, display: "flex", alignItems: "center", gap: 8, padding: "0 14px", background: colors.bg }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <span key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
        ))}
        <span style={{ marginLeft: 12, fontSize: 13, color: colors.textFaint }}>Backup Target Selector</span>
      </div>

      {/* header */}
      <div style={{ height: 120, padding: "20px 24px 0" }}>
        <div style={{ fontSize: 24, fontWeight: 700 }}>Backup Target Selector</div>
        <div style={{ fontSize: 14, color: colors.textMuted, marginTop: 4 }}>Select targets while checking file/folder type and size.</div>
        <div style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.textFaint, marginTop: 10 }}>.../MC-Vector/servers/survival-01</div>
      </div>

      {/* toolbar */}
      <div
        style={{
          height: 36,
          margin: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 14,
          color: colors.textSecondary,
        }}
      >
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{selectedCount} items selected</span>
        <span style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" size="sm">
            Select All
          </Button>
          <Button variant="secondary" size="sm">
            Clear All
          </Button>
        </span>
      </div>

      {/* tree */}
      <div style={{ position: "absolute", left: 0, right: 0, top: SEL.treeTop, height: SEL.h - SEL.treeTop - 76 }}>
        {TREE.map((row, i) => {
          const own = row.checkAt !== undefined && frame >= row.checkAt;
          const inherited = row.inheritFrom !== undefined && frame >= row.inheritFrom;
          const pop = row.checkAt !== undefined ? pulse(frame, row.checkAt) : 0;
          return (
            <div
              key={row.name}
              style={{
                position: "absolute",
                top: i * SEL.rowH,
                left: 0,
                right: 0,
                height: SEL.rowH,
                display: "flex",
                alignItems: "center",
                gap: 10,
                paddingLeft: 24 + row.depth * 28,
                paddingRight: 24,
                background: own ? "rgba(59,130,246,0.10)" : "transparent",
                fontSize: 15,
              }}
            >
              <span style={{ width: 20, display: "inline-flex" }}>{row.dir ? <Chevron open={Boolean(row.open)} /> : null}</span>
              <Checkbox state={own || inherited ? "checked" : "unchecked"} pop={pop} dim={inherited && !own} />
              {row.dir ? <FolderIcon /> : <FileIcon />}
              <span style={{ flex: 1, color: colors.text }}>{row.name}</span>
              <span style={{ fontSize: 13, color: colors.textFaint, fontVariantNumeric: "tabular-nums" }}>
                {row.dir ? "Folder" : "File"} - {row.size}
              </span>
            </div>
          );
        })}
      </div>

      {/* footer */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 76,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 12,
          padding: "0 24px",
          borderTop: `1px solid ${colors.border}`,
          background: colors.panel,
        }}
      >
        <Button variant="secondary">Cancel</Button>
        <Button variant="primary" pressed={pulse(frame, T.applyClick)} style={{ width: 170 }}>
          Apply Selection
        </Button>
      </div>
    </div>
  );
};

// ---------- backups view ----------

const BACKUP_NAME = "survival-01_full.zip";
const SCAN_FILES = [
  "world/level.dat",
  "world/region/r.0.0.mca",
  "world/region/r.0.1.mca",
  "world/region/r.-1.0.mca",
  "world/playerdata/3f2a91c0.dat",
  "plugins/EssentialsX.jar",
  "plugins/LuckPerms.jar",
  "server.properties",
];

const FullBadge: React.FC<{ scale?: number }> = ({ scale = 1 }) => (
  <span
    style={{
      display: "inline-block",
      padding: "3px 10px",
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: 0.3,
      color: colors.success,
      background: "rgba(16,185,129,0.14)",
      border: "1px solid rgba(16,185,129,0.4)",
      borderRadius: radius.pill,
      transform: `scale(${scale})`,
      transformOrigin: "left center",
    }}
  >
    Full
  </span>
);

const BackupsContent: React.FC = () => {
  const frame = useCurrentFrame();
  const processing = frame >= T.submitClick + 4 && frame < T.done;
  const progress = interpolate(frame, [T.progressFrom, T.progressTo], [0, 1], {
    easing: Easing.inOut(Easing.quad),
    ...clamp01,
  });
  const showProgress = frame >= T.progressFrom && frame < T.done;
  const progressOpacity = interpolate(frame, [T.progressFrom, T.progressFrom + 10, T.done - 4, T.done], [0, 1, 1, 0], clamp01);
  const emptyOpacity = interpolate(frame, [T.progressFrom - 6, T.progressFrom + 4], [1, 0], clamp01);
  const rowIn = rise(frame, T.done, 16);
  const badgeIn = rise(frame, T.done + 6, 12);
  const restoreHover = interpolate(frame, [T.restoreArrive - 6, T.restoreArrive + 4], [0, 1], clamp01);
  const flash = interpolate(frame, [T.done, T.done + 14, T.done + 44], [0, 1, 0], clamp01);
  const fileIdx = Math.min(SCAN_FILES.length - 1, Math.floor(progress * SCAN_FILES.length));

  return (
    <div style={{ position: "absolute", inset: 0, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Backup Management</div>
        <Button
          variant="primary"
          pressed={pulse(frame, T.createClick)}
          hover={ramp(frame, T.createClick - 8, T.createClick)}
          disabled={processing}
          style={{ width: 190 }}
        >
          {processing ? "Processing..." : "+ Create Backup"}
        </Button>
      </div>

      <div
        style={{
          position: "relative",
          flex: 1,
          padding: 12,
          background: colors.window,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.card,
          overflow: "hidden",
        }}
      >
        {emptyOpacity > 0.01 ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              color: colors.textFaint,
              opacity: emptyOpacity,
            }}
          >
            No backups yet
          </div>
        ) : null}

        {showProgress ? (
          <div
            style={{
              height: 96,
              padding: "0 22px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              background: colors.panel,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.card - 4,
              opacity: progressOpacity,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17, fontWeight: 600 }}>
              <span>Creating backup...</span>
              <span style={{ color: colors.textMuted, fontVariantNumeric: "tabular-nums" }}>{Math.round(progress * 100)}%</span>
            </div>
            <div style={{ marginTop: 12, height: 8, borderRadius: 4, background: colors.border, overflow: "hidden" }}>
              <div style={{ width: `${progress * 100}%`, height: "100%", background: colors.info }} />
            </div>
            <div style={{ marginTop: 10, fontFamily: fonts.mono, fontSize: 13, color: colors.textFaint }}>{SCAN_FILES[fileIdx]}</div>
          </div>
        ) : null}

        {frame >= T.done ? (
          <div
            style={{
              height: 96,
              padding: "0 18px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              background: colors.panel,
              border: `1px solid rgba(16,185,129,${0.1 + flash * 0.6})`,
              borderRadius: radius.card - 4,
              opacity: rowIn,
              transform: `translateY(${(1 - rowIn) * -16}px)`,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                flexShrink: 0,
                borderRadius: 10,
                background: colors.window,
                border: `1px solid ${colors.borderStrong}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width={24} height={24} viewBox="0 0 24 24">
                <path d="M3 8l9-5 9 5v8l-9 5-9-5z" fill="none" stroke={colors.textSecondary} strokeWidth={1.8} strokeLinejoin="round" />
                <path d="M3 8l9 5 9-5M12 13v8" fill="none" stroke={colors.textSecondary} strokeWidth={1.8} strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{BACKUP_NAME}</div>
              <div style={{ fontSize: 14, color: colors.textMuted, marginTop: 3 }}>3/14/2025, 6:42:10 PM</div>
              <div style={{ marginTop: 7 }}>
                <FullBadge scale={0.6 + 0.4 * badgeIn} />
              </div>
            </div>
            <div style={{ width: 80, textAlign: "right", fontSize: 14, color: colors.textMuted }}>1.2 GB</div>
            <div style={{ display: "flex", gap: 10 }}>
              <Button
                variant="secondary"
                size="sm"
                hover={restoreHover}
                style={{
                  width: 104,
                  borderColor: restoreHover > 0.5 ? colors.textMuted : colors.borderStrong,
                  background: restoreHover > 0.5 ? colors.borderStrong : colors.panel,
                }}
              >
                Restore
              </Button>
              <Button variant="secondary" size="sm" style={{ width: 76 }}>
                Tag
              </Button>
              <Button variant="danger" size="sm" style={{ width: 92 }}>
                Delete
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ---------- create modal ----------

const CreateModalBody: React.FC = () => {
  const frame = useCurrentFrame();
  const applied = frame >= T.selectorClose;
  return (
    <div>
      <div style={{ display: "flex", gap: 20 }}>
        <div style={{ flex: 1 }}>
          <Label>ZIP filename (optional)</Label>
          <FakeField muted>survival-01_full</FakeField>
          <Help>&quot;survival-01_full&quot; will be used if omitted</Help>
        </div>
        <div style={{ width: 170 }}>
          <Label>Compression level (1-9)</Label>
          <FakeField style={{ justifyContent: "space-between" }}>
            <span>5</span>
            <Chevron open />
          </FakeField>
          <Help>1: Low / 9: High</Help>
        </div>
      </div>

      <div style={{ marginTop: 22, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Select backup targets</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            variant="secondary"
            size="sm"
            pressed={pulse(frame, T.selectorClick)}
            hover={ramp(frame, T.selectorClick - 8, T.selectorClick)}
          >
            Select in separate window
          </Button>
          <Button variant="secondary" size="sm">
            Clear all
          </Button>
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          height: 150,
          padding: 14,
          background: colors.window,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.control,
        }}
      >
        {applied ? (
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.info }}>Selected: 3</div>
            <div style={{ marginTop: 8, fontFamily: fonts.mono, fontSize: 15, lineHeight: 1.6, color: colors.textSecondary }}>
              <div>plugins</div>
              <div>server.properties</div>
              <div>world</div>
            </div>
          </div>
        ) : (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: colors.textFaint }}>
            No targets selected. Select targets in a separate window.
          </div>
        )}
      </div>
    </div>
  );
};

const CreateModalFooter: React.FC = () => {
  const frame = useCurrentFrame();
  const creating = frame >= T.submitClick + 4;
  return (
    <>
      <Button variant="secondary" disabled={creating}>
        Cancel
      </Button>
      <Button
        variant="primary"
        pressed={pulse(frame, T.submitClick)}
        hover={ramp(frame, T.submitClick - 8, T.submitClick)}
        disabled={creating}
        style={{ width: 120 }}
      >
        {creating ? "Creating..." : "Create"}
      </Button>
    </>
  );
};

// ---------- scene ----------

// Window-space coordinates. Sidebar rows are about 40 px apart: Backups is at y 328.
const CURSOR_PATH: readonly CursorKeyframe[] = [
  { frame: T.cursorIn, x: 820, y: 560 },
  { frame: T.sidebarClick - 4, x: 112, y: 328 },
  { frame: T.sidebarClick + 16, x: 112, y: 328 },
  { frame: T.createClick - 2, x: 1464, y: 143 },
  { frame: T.createClick + 12, x: 1464, y: 143 },
  { frame: T.selectorClick - 2, x: 944, y: 427 },
  { frame: T.selectorClick + 6, x: 944, y: 427 },
  { frame: T.checkWorld - 2, x: selCheckX, y: selRowCenterY(0) },
  { frame: T.checkWorld, x: selCheckX, y: selRowCenterY(0) },
  { frame: T.checkPlugins - 2, x: selCheckX, y: selRowCenterY(6) },
  { frame: T.checkPlugins, x: selCheckX, y: selRowCenterY(6) },
  { frame: T.checkProps - 2, x: selCheckX, y: selRowCenterY(7) },
  { frame: T.checkProps, x: selCheckX, y: selRowCenterY(7) },
  { frame: T.applyClick - 2, x: applyX, y: applyY },
  { frame: T.applyClick + 6, x: applyX, y: applyY },
  { frame: T.submitClick - 2, x: 1074, y: 669 },
  { frame: T.submitClick + 8, x: 1074, y: 669 },
  { frame: 236, x: 1074, y: 669 },
  { frame: 262, x: 1400, y: 430 },
  { frame: T.restoreArrive, x: 1289, y: 248 },
];

const CAMERA: readonly CameraKey[] = [
  { frame: 0, x: 800, y: 450, scale: 1 },
  { frame: 44, x: 640, y: 330, scale: 1.5, dur: 46 },
  { frame: 84, x: 1000, y: 330, scale: 1.5, dur: 36 },
  { frame: 114, x: 860, y: 440, scale: 1.4, dur: 40 },
  { frame: 222, x: 860, y: 330, scale: 1.5, dur: 44 },
  { frame: 312, x: 800, y: 450, scale: 1, dur: 46 },
];

const SERVERS = [{ name: "survival-01", status: "online", group: "Ungrouped" }] as const;

const Overlay: React.FC = () => (
  <>
    <Modal title="Create Backup" openAt={T.modalOpen} closeAt={T.modalClose} width={720} footer={<CreateModalFooter />}>
      <CreateModalBody />
    </Modal>
    <SelectorWindow />
    <Cursor
      path={CURSOR_PATH}
      clicks={[T.sidebarClick, T.createClick, T.selectorClick, T.checkWorld, T.checkPlugins, T.checkProps, T.applyClick, T.submitClick]}
      visibleFrom={T.cursorIn}
    />
  </>
);

const Inner: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const activeView: NavItem = frame >= T.sidebarClick ? "Backups" : "Dashboard";
  const swapIn = ramp(frame, T.sidebarClick, T.sidebarClick + 12);

  return (
    <Stage
      durationInFrames={durationInFrames}
      camera={CAMERA}
      windowProps={{ activeView, serverName: "survival-01", serverStatus: "online", servers: SERVERS }}
      overlay={<Overlay />}
      annotations={
        <>
          <Callout
            text="pick what to keep"
            at={T.selectorOpen + 10}
            x={1150}
            y={296}
            size={46}
            rotate={3}
            writeFrames={28}
            until={T.applyClick - 4}
            arrow={{ from: { x: 1190, y: 354 }, to: { x: 1092, y: 410 }, bend: 20 }}
            paper
          />
          <Callout
            text="restore anytime"
            at={T.noteRestore}
            x={930}
            y={382}
            size={50}
            rotate={-3}
            writeFrames={26}
            arrow={{ from: { x: 1090, y: 380 }, to: { x: 1274, y: 286 }, bend: 24 }}
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
          <BackupsContent />
        </div>
      ) : null}
    </Stage>
  );
};

export const BackupOp: React.FC<{ from: number; durationInFrames: number }> = ({ from, durationInFrames }) => (
  <Sequence from={from} durationInFrames={durationInFrames} name="op4 Backup">
    <Inner durationInFrames={durationInFrames} />
  </Sequence>
);
