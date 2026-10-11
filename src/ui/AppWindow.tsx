import type React from "react";
import { colors, fonts, radius } from "../theme";
import { Button } from "./Button";
import { type ServerStatus, StatusDot } from "./StatusDot";

export const NAV_ITEMS = [
  "Dashboard",
  "Console",
  "Users",
  "Files",
  "Plugins / Mods",
  "Backups",
  "Properties",
  "General Settings",
] as const;

export type NavItem = (typeof NAV_ITEMS)[number] | "Proxy Network";

export type SidebarServer = {
  name: string;
  status: ServerStatus;
  group?: string;
};

const SIDEBAR_W = 260;
const HEADER_H = 60;

const SidebarRow: React.FC<{ label: string; active: boolean }> = ({ label, active }) => (
  <div
    style={{
      padding: "9px 14px",
      borderRadius: radius.control,
      fontSize: 15,
      fontWeight: active ? 600 : 500,
      color: active ? colors.text : colors.textMuted,
      background: active ? colors.border : "transparent",
    }}
  >
    {label}
  </div>
);

/**
 * Recreation of the MC-Vector app shell: window chrome, 260px sidebar,
 * 60px header with server actions, and a rounded content card.
 */
export const AppWindow: React.FC<{
  children?: React.ReactNode;
  activeView?: NavItem;
  serverName?: string;
  serverStatus?: ServerStatus;
  servers?: readonly SidebarServer[];
  selectedServer?: string;
  showHeaderActions?: boolean;
  width?: number;
  height?: number;
  /** Overlay layer (modals, toasts, cursor) positioned over the whole window. */
  overlay?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({
  children,
  activeView = "Dashboard",
  serverName = "survival-01",
  serverStatus = "offline",
  servers = [{ name: "survival-01", status: "offline", group: "Ungrouped" }],
  selectedServer,
  showHeaderActions = true,
  width = 1600,
  height = 900,
  overlay,
  style,
}) => {
  const selected = selectedServer ?? serverName;
  const running = serverStatus === "online" || serverStatus === "starting";
  const groups = Array.from(new Set(servers.map((s) => s.group ?? "Ungrouped")));

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        display: "flex",
        flexDirection: "column",
        background: colors.window,
        border: `1px solid ${colors.border}`,
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 40px 120px rgba(0,0,0,0.6)",
        fontFamily: fonts.ui,
        color: colors.text,
        ...style,
      }}
    >
      {/* Title bar */}
      <div style={{ height: 36, display: "flex", alignItems: "center", gap: 8, padding: "0 14px", background: colors.bg }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <span key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
        ))}
      </div>

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* Sidebar */}
        <div
          style={{
            width: SIDEBAR_W,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            background: colors.bg,
            borderRight: `1px solid ${colors.border}`,
            padding: "12px 12px 16px",
          }}
        >
          <div style={{ padding: "8px 14px 16px", fontSize: 22, fontWeight: 800, letterSpacing: -0.3 }}>MC-Vector</div>
          {NAV_ITEMS.map((item) => (
            <SidebarRow key={item} label={item} active={item === activeView} />
          ))}
          <div style={{ height: 1, background: colors.border, margin: "10px 6px" }} />
          <SidebarRow label="Proxy Network" active={activeView === "Proxy Network"} />

          <div style={{ marginTop: 18, flex: 1, overflow: "hidden" }}>
            {groups.map((g) => (
              <div key={g} style={{ marginBottom: 10 }}>
                <div
                  style={{
                    padding: "4px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    color: colors.textFaint,
                  }}
                >
                  {g}
                </div>
                {servers
                  .filter((s) => (s.group ?? "Ungrouped") === g)
                  .map((s) => (
                    <div
                      key={s.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 14px",
                        borderRadius: radius.control,
                        fontSize: 15,
                        background: s.name === selected ? colors.panel : "transparent",
                        color: s.name === selected ? colors.text : colors.textSecondary,
                      }}
                    >
                      <StatusDot status={s.status} size={9} />
                      {s.name}
                    </div>
                  ))}
              </div>
            ))}
          </div>

          <Button variant="dashed" style={{ width: "100%" }}>
            + Add Server
          </Button>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div
            style={{
              height: HEADER_H,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 24px",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {serverName}
              <span style={{ color: colors.textFaint, fontWeight: 500 }}> / {activeView}</span>
            </div>
            {showHeaderActions && activeView !== "Proxy Network" ? (
              <div style={{ display: "flex", gap: 10 }}>
                <Button variant="success" size="sm" disabled={running}>
                  Start
                </Button>
                <Button variant="secondary" size="sm" disabled={!running}>
                  Restart
                </Button>
                <Button variant="danger" size="sm" disabled={!running}>
                  Stop
                </Button>
              </div>
            ) : null}
          </div>
          <div
            style={{
              position: "relative",
              flex: 1,
              minHeight: 0,
              margin: "0 16px 16px 0",
              background: colors.panel,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.card,
              overflow: "hidden",
            }}
          >
            {children}
          </div>
        </div>
      </div>

      {overlay ? <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>{overlay}</div> : null}
    </div>
  );
};
