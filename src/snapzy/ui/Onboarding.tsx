import type React from "react";
import { Img, staticFile } from "remotion";
import { TrafficLights } from "../content/MacWindow";
import { FONT_DISPLAY, FONT_TEXT, pt, ui } from "../theme";

// Snapzy's first-launch onboarding (v2.1.0-beta.6), dark appearance. The header
// stepper (Capture, Recording, Shortcuts, Permissions) ticks off as `step`
// advances; step 4 is the "You're All Set!" page. `enter` 0..1 slides the
// step's content in from the right. Pure function of its props.

export const OB_W = pt(920);
export const OB_H = pt(580);

const STEPS = ["Capture", "Recording", "Shortcuts", "Permissions"] as const;

const Check: React.FC<{ on: boolean; size?: number }> = ({ on, size = pt(16) }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size,
      boxShadow: on ? "none" : `inset 0 0 0 ${pt(1.4)}px rgba(255,255,255,0.35)`,
      background: on ? ui.accent : "transparent",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flex: "none",
    }}
  >
    {on ? (
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 5.2 4.2 7.4 8 2.8" />
      </svg>
    ) : null}
  </div>
);

const Kbd: React.FC<{ k: string }> = ({ k }) => (
  <span
    style={{
      padding: `${pt(1)}px ${pt(6)}px`,
      borderRadius: pt(5),
      background: "rgba(255,255,255,0.08)",
      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
      fontSize: pt(11),
      color: ui.secondary,
      letterSpacing: 1,
    }}
  >
    {k}
  </span>
);

const Button: React.FC<{ label: string; primary?: boolean; pressed?: boolean }> = ({ label, primary = false, pressed = false }) => (
  <div
    style={{
      padding: `${pt(7)}px ${pt(16)}px`,
      borderRadius: pt(20),
      background: primary ? (pressed ? "#e6e6ea" : "white") : "rgba(255,255,255,0.08)",
      color: primary ? "#111" : ui.text,
      fontSize: pt(13),
      fontWeight: 600,
      transform: `scale(${pressed ? 0.96 : 1})`,
      display: "flex",
      alignItems: "center",
      gap: pt(8),
    }}
  >
    {label}
    {primary ? <span style={{ fontSize: pt(11), opacity: 0.5 }}>↩</span> : null}
  </div>
);

const STEP_COPY: readonly { title: string; body: string; items: readonly [string, string][] }[] = [
  {
    title: "Screen Capture & Annotate",
    body: "Press ⇧⌘4 to freeze and select an area. Your capture instantly lands in a floating Quick Access card, ready to copy, save, or open in Annotate.",
    items: [
      ["Select an area on the screen.", "⇧⌘4"],
      ["Capture lands in Quick Access card.", ""],
      ["Click card to open Annotate window.", ""],
    ],
  },
  {
    title: "Screen Recording",
    body: "Record the screen with system audio and microphone, then trim it and export crisp MP4 or GIF.",
    items: [
      ["Start a recording.", "⇧⌘5"],
      ["Stop from the menu bar.", ""],
      ["Trim and export the clip.", ""],
    ],
  },
  {
    title: "Keyboard Shortcuts",
    body: "Snapzy can take over the macOS screenshot shortcuts, so ⇧⌘3 and ⇧⌘4 open Snapzy instead.",
    items: [
      ["Area", "⇧⌘4"],
      ["Fullscreen", "⇧⌘3"],
      ["Record", "⇧⌘5"],
    ],
  },
  {
    title: "Permissions",
    body: "Grant Screen Recording so Snapzy can see your screen. Text recognition, annotations and audio capture stay on your Mac.",
    items: [
      ["Screen Recording", "Granted"],
      ["Save location", "Granted"],
      ["Accessibility", "Granted"],
    ],
  },
];

const DONE_CARDS: readonly [string, string, string][] = [
  ["Area Capture", "⇧⌘4", "Freeze, crop, and drop straight into Annotate or copy."],
  ["Screen Recording", "⇧⌘5", "Capture mic, system audio, and clicks. Export MP4 or GIF."],
  ["Text Grab (OCR)", "⇧⌘2", "Extract text on-device with Apple Vision to clipboard."],
  ["Menu Bar Hub", "", "Access recent captures, history, hotkeys, and preferences."],
];

/** The interactive demo pane on the right: a small note window to capture. */
const DemoPane: React.FC<{ step: number }> = ({ step }) => (
  <div
    style={{
      position: "absolute",
      right: pt(24),
      top: pt(70),
      width: pt(420),
      bottom: pt(70),
      borderRadius: pt(14),
      background: "linear-gradient(160deg, #2c3550, #1b1f30)",
      overflow: "hidden",
      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: pt(40),
        top: pt(60),
        right: pt(40),
        height: pt(200),
        borderRadius: pt(10),
        background: "white",
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        padding: pt(14),
        boxSizing: "border-box",
        fontFamily: FONT_TEXT,
        color: "#2c2c2e",
      }}
    >
      <TrafficLights size={pt(8)} />
      <div style={{ fontSize: pt(14), fontWeight: 700, marginTop: pt(12) }}>
        {step === 1 ? "Screen Recording.mp4" : step === 2 ? "Keyboard" : step === 3 ? "Privacy & Security" : "All iCloud"}
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ height: pt(7), borderRadius: pt(4), background: "#e6e6ec", marginTop: pt(11), width: `${[92, 80, 86, 54][i]}%` }} />
      ))}
    </div>
  </div>
);

export const Onboarding: React.FC<{
  step: number;
  enter: number;
  checks?: number;
  cards?: number;
  pressed?: "continue" | "start" | null;
}> = ({ step, enter, checks = 0, cards = 1, pressed = null }) => {
  const done = step >= 4;
  const copy = STEP_COPY[Math.min(3, step)];
  const slide = (1 - enter) * pt(60);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: pt(22),
        background: ui.window,
        overflow: "hidden",
        fontFamily: FONT_TEXT,
        color: ui.text,
        boxShadow: "0 0 0 1px rgba(255,255,255,0.08)",
      }}
    >
      {/* Header: app name, stepper, language */}
      <div style={{ position: "absolute", left: pt(20), top: pt(18) }}>
        <TrafficLights />
      </div>
      <div style={{ position: "absolute", left: pt(96), top: pt(14), display: "flex", alignItems: "center", gap: pt(8) }}>
        <Img src={staticFile("snapzy/icon.png")} style={{ width: pt(22), height: pt(22) }} />
        <span style={{ fontSize: pt(14), fontWeight: 600 }}>Snapzy</span>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: pt(16), display: "flex", justifyContent: "center", gap: pt(10), alignItems: "center" }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: pt(10) }}>
            <div style={{ display: "flex", alignItems: "center", gap: pt(6), opacity: i <= step ? 1 : 0.45 }}>
              {i < step ? (
                <Check on size={pt(15)} />
              ) : (
                <div
                  style={{
                    width: pt(15),
                    height: pt(15),
                    borderRadius: pt(15),
                    background: i === step ? "white" : "transparent",
                    boxShadow: i === step ? "none" : "inset 0 0 0 1px rgba(255,255,255,0.4)",
                    color: "#111",
                    fontSize: pt(9.5),
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {i === step ? i + 1 : ""}
                </div>
              )}
              <span style={{ fontSize: pt(12), color: i <= step ? ui.text : ui.secondary }}>{s}</span>
            </div>
            {i < STEPS.length - 1 ? <div style={{ width: pt(26), height: 1, background: "rgba(255,255,255,0.18)" }} /> : null}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", right: pt(20), top: pt(16), fontSize: pt(12), color: ui.secondary }}>English ⌄</div>

      {done ? (
        <div style={{ position: "absolute", inset: 0, opacity: enter, transform: `translateY(${slide * 0.4}px)` }}>
          <Img
            src={staticFile("snapzy/icon.png")}
            style={{ position: "absolute", left: (OB_W - pt(64)) / 2, top: pt(78), width: pt(64), height: pt(64) }}
          />
          <div style={{ position: "absolute", left: 0, right: 0, top: pt(152), textAlign: "center" }}>
            <div style={{ fontSize: pt(10), letterSpacing: 2, color: ui.secondary, fontWeight: 600 }}>SETUP COMPLETE</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: pt(30), fontWeight: 700, marginTop: pt(6), letterSpacing: -0.5 }}>
              You're All Set!
            </div>
            <div style={{ fontSize: pt(13), color: ui.secondary, marginTop: pt(6) }}>
              Snapzy is ready in your menu bar. Take screenshots, record clips, extract text, and annotate anytime.
            </div>
          </div>
          <div style={{ position: "absolute", left: pt(60), right: pt(60), top: pt(262), display: "flex", gap: pt(14) }}>
            {DONE_CARDS.map(([t, k, d], i) => {
              const c = Math.max(0, Math.min(1, cards * 4 - i));
              return (
                <div
                  key={t}
                  style={{
                    flex: 1,
                    height: pt(170),
                    borderRadius: pt(14),
                    background: ui.panel,
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
                    padding: pt(14),
                    boxSizing: "border-box",
                    opacity: c,
                    transform: `translateY(${(1 - c) * pt(18)}px)`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ width: pt(26), height: pt(26), borderRadius: pt(8), background: "rgba(255,255,255,0.08)" }} />
                    {k ? <Kbd k={k} /> : null}
                  </div>
                  <div style={{ fontSize: pt(14), fontWeight: 600, marginTop: pt(14) }}>{t}</div>
                  <div style={{ fontSize: pt(12), color: ui.secondary, marginTop: pt(6), lineHeight: 1.35 }}>{d}</div>
                </div>
              );
            })}
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: pt(458), display: "flex", justifyContent: "center", gap: pt(10) }}>
            {["Star on GitHub", "Join Discord", "Sponsor Project"].map((l) => (
              <div key={l} style={{ fontSize: pt(11.5), padding: `${pt(5)}px ${pt(12)}px`, borderRadius: pt(14), background: "rgba(255,255,255,0.06)", color: ui.secondary }}>
                {l}
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: pt(500), display: "flex", justifyContent: "center" }}>
            <Button label="Start Using Snapzy" primary pressed={pressed === "start"} />
          </div>
        </div>
      ) : (
        <div style={{ position: "absolute", inset: 0, opacity: enter, transform: `translateX(${slide}px)` }}>
          <div style={{ position: "absolute", left: pt(36), top: pt(80), width: pt(400) }}>
            <div style={{ fontSize: pt(11), letterSpacing: 1.5, color: ui.secondary, fontWeight: 600 }}>STEP {step + 1} OF 4</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: pt(28), fontWeight: 700, marginTop: pt(8), letterSpacing: -0.5 }}>{copy.title}</div>
            <div style={{ fontSize: pt(13), color: ui.secondary, marginTop: pt(10), lineHeight: 1.45 }}>{copy.body}</div>
            <div style={{ marginTop: pt(22), display: "flex", flexDirection: "column", gap: pt(12) }}>
              {copy.items.map(([label, k], i) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: pt(10), fontSize: pt(13) }}>
                  <Check on={step === 3 ? true : i < checks} />
                  <span style={{ flex: 1, color: i < checks || step === 3 ? ui.text : ui.secondary }}>{label}</span>
                  {k === "Granted" ? (
                    <span style={{ color: "#3ad07a", fontSize: pt(12), fontWeight: 600 }}>Granted</span>
                  ) : k ? (
                    <Kbd k={k} />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <DemoPane step={step} />
        </div>
      )}

      {done ? null : (
        <div style={{ position: "absolute", right: pt(24), bottom: pt(20), display: "flex", gap: pt(8) }}>
          <Button label="Skip" />
          <Button label={step === 3 ? "Finish" : "Continue"} primary pressed={pressed === "continue"} />
        </div>
      )}
    </div>
  );
};

/** Center of the Continue / Finish button, relative to the window's top-left. */
export const OB_CONTINUE = { x: OB_W - pt(24) - pt(52), y: OB_H - pt(20) - pt(15) };
/** Center of "Start Using Snapzy", relative to the window's top-left. */
export const OB_START = { x: OB_W / 2, y: pt(500) + pt(15) };
