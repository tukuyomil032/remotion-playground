import type React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { DeskWindows } from "../content/Desk";
import { Desktop } from "../desktop/Desktop";
import { Glass } from "../glass/Glass";
import { BOUNCY, ease, SMOOTH, SNAPPY, swift } from "../motion";
import { FONT_DISPLAY, FONT_MONO, FONT_TEXT, pt } from "../theme";
import { Scrim } from "../ui/Scrim";

// Outro (5 bars). The windows step back, a glass panel rises with the icon,
// the name and the facts that matter: free and open source (BSD-3), the
// Homebrew line, where to get it, and the macOS requirement. A small line
// says this is a fan-made video.

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const windowsOut = 1 - swift(frame, fps, SMOOTH, 0);
  const scrim = ease(frame, 10, 50);
  const panel = swift(frame, fps, SNAPPY, 30);
  const icon = swift(frame, fps, BOUNCY, 60);
  const t = (at: number) => swift(frame, fps, SMOOTH, at);

  const W = pt(760);
  const H = pt(470);
  const line = (at: number): React.CSSProperties => ({
    opacity: Math.min(1, t(at)),
    transform: `translateY(${(1 - t(at)) * pt(14)}px)`,
    filter: `blur(${(1 - Math.min(1, t(at))) * 8}px)`,
  });

  return (
    <Desktop
      scene="outro"
      dockHide={ease(frame, 0, 40)}
      chrome={1 - ease(frame, 0, 40)}
      overlay={<DeskWindows state={{ notes: { show: windowsOut }, finder: { show: windowsOut }, chart: { show: windowsOut } }} />}
      screen={
        <>
          <Scrim amount={scrim * 0.7} />
          {panel > 0.002 ? (
            <Glass
              width={W}
              height={H}
              radius={pt(44)}
              refraction={40}
              bevel={36}
              tint={0.08}
              shade={0.22}
              blur={18}
              light={0.2 + 0.4 * ease(frame, 30, 300)}
              style={{
                left: 960 - W / 2,
                top: 540 - H / 2 + (1 - panel) * pt(40),
                opacity: Math.min(1, panel * 1.4),
                transform: `scale(${0.92 + 0.08 * panel})`,
              }}
            >
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", color: "white" }}>
                <Img
                  src={staticFile("snapzy/icon.png")}
                  style={{
                    width: pt(110),
                    height: pt(110),
                    marginTop: pt(44),
                    transform: `scale(${icon})`,
                    filter: `drop-shadow(0 ${pt(10)}px ${pt(22)}px rgba(0,0,40,0.35))`,
                  }}
                />
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: pt(56), fontWeight: 600, letterSpacing: -1.2, marginTop: pt(14), ...line(90) }}>
                  Snapzy
                </div>
                <div style={{ fontFamily: FONT_TEXT, fontSize: pt(20), fontWeight: 500, color: "rgba(255,255,255,0.86)", marginTop: pt(4), ...line(115) }}>
                  Free and open source.
                </div>
                <div
                  style={{
                    marginTop: pt(28),
                    padding: `${pt(12)}px ${pt(22)}px`,
                    borderRadius: pt(16),
                    background: "rgba(0,0,20,0.35)",
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)",
                    fontFamily: FONT_MONO,
                    fontSize: pt(19),
                    ...line(165),
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>$ </span>brew install --cask snapzy
                </div>
                <div style={{ fontFamily: FONT_TEXT, fontSize: pt(16), fontWeight: 500, marginTop: pt(26), display: "flex", gap: pt(20), ...line(210) }}>
                  <span>snapzy.app</span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span>github.com/duongductrong/Snapzy</span>
                </div>
                <div style={{ fontFamily: FONT_TEXT, fontSize: pt(13), color: "rgba(255,255,255,0.65)", marginTop: pt(10), ...line(232) }}>
                  macOS 13 or later · BSD-3-Clause
                </div>
              </div>
            </Glass>
          ) : null}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: pt(26),
              textAlign: "center",
              fontFamily: FONT_TEXT,
              fontSize: pt(12),
              color: "rgba(255,255,255,0.55)",
              ...line(260),
            }}
          >
            Fan-made video. Not affiliated with the Snapzy project.
          </div>
        </>
      }
    />
  );
};
