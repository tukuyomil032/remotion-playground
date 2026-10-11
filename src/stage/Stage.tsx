import type React from "react";
import { interpolate, spring, useCurrentFrame } from "remotion";
import { shadows } from "../theme";
import { FPS, HEIGHT, WIDTH } from "../timeline";
import { AppWindow } from "../ui";
import { clamp01, easeIn, easeInOut, easeOut, lerp } from "./motion";

// Operation-scene stage: the real (dark) app window floating on the clay
// background, with a camera and slide-in / slide-out moves.
//
// Coordinate systems
// - World space = the app window's own pixels: (0,0) is the window's top-left
//   corner, (WINDOW_W, WINDOW_H) = (1600, 900) its bottom-right. Cursor paths,
//   overlay content, annotations and camera targets all use this space.
// - Screen space = the 1920 x 1080 frame.
// The camera puts world point (x, y) at the screen center, scaled by `scale`
// and rotated by `rotate` degrees. CAMERA_HOME shows the whole window with a
// 160 px margin left/right and 90 px top/bottom.

export const WINDOW_W = 1600;
export const WINDOW_H = 900;

export type CameraKey = {
  /** Local frame where the move toward this key starts. */
  frame: number;
  /** World x at screen center. */
  x: number;
  /** World y at screen center. */
  y: number;
  /** 1 = whole window in view. 1.6 = 1.6x closer. */
  scale: number;
  /** Degrees. Default 0. */
  rotate?: number;
  /**
   * Frames the move takes. Spring mode: stretches the critically damped
   * spring to settle in this time. Ease mode: exact duration. Default 50.
   */
  dur?: number;
};

export type CameraState = { x: number; y: number; scale: number; rotate: number };

export const CAMERA_HOME: CameraState = { x: WINDOW_W / 2, y: WINDOW_H / 2, scale: 1, rotate: 0 };

const DEFAULT_MOVE = 50;

/**
 * Camera state at a local frame. Each key starts a move from wherever the
 * camera is toward that key; moves can overlap and blend. The first key is
 * the starting framing (its `frame` is ignored for the start state).
 * mode "spring": first-order, no bounce. mode "ease": smooth in-out.
 */
export const cameraAt = (keys: readonly CameraKey[], frame: number, mode: "spring" | "ease" = "spring"): CameraState => {
  if (keys.length === 0) {
    return CAMERA_HOME;
  }
  const first = keys[0];
  const state: CameraState = { x: first.x, y: first.y, scale: first.scale, rotate: first.rotate ?? 0 };
  for (let i = 1; i < keys.length; i++) {
    const prev = keys[i - 1];
    const k = keys[i];
    const dur = k.dur ?? DEFAULT_MOVE;
    const t =
      mode === "spring"
        ? spring({ frame: frame - k.frame, fps: FPS, config: { damping: 200 }, durationInFrames: dur })
        : interpolate(frame, [k.frame, k.frame + dur], [0, 1], { ...clamp01, easing: easeInOut });
    state.x += (k.x - prev.x) * t;
    state.y += (k.y - prev.y) * t;
    // Zoom moves feel even when interpolated in log space.
    state.scale *= Math.pow(k.scale / prev.scale, t);
    state.rotate += ((k.rotate ?? 0) - (prev.rotate ?? 0)) * t;
  }
  return state;
};

type AppWindowProps = React.ComponentProps<typeof AppWindow>;

export type StageProps = {
  /** Length of the scene in frames (needed for the exit slide). */
  durationInFrames: number;
  /** Main content of the app window (inside the rounded content card). */
  children?: React.ReactNode;
  /** AppWindow overlay (modals, toasts, cursor). World space, clipped to the window. */
  overlay?: React.ReactNode;
  /**
   * Layer above the window in world space, NOT clipped to the window and
   * moved by the camera. Put <Callout>s here.
   */
  annotations?: React.ReactNode;
  /** Layer in screen space (no camera, no slide). Rarely needed. */
  screen?: React.ReactNode;
  /** AppWindow props (activeView, serverName, servers, serverStatus ...). */
  windowProps?: Omit<AppWindowProps, "children" | "overlay" | "style" | "width" | "height">;
  /** Camera keyframes. Empty = CAMERA_HOME the whole time. */
  camera?: readonly CameraKey[];
  cameraMode?: "spring" | "ease";
  /** Frames for the window to slide in from the right, tilted. Default 42. 0 = already in place. */
  enterFrames?: number;
  /** Frames for the window to slide out to the left, tilted. Default 36. 0 = stays. */
  exitFrames?: number;
};

/** Slide distance and tilt for enter / exit. */
const SLIDE_X = 1900;
const SLIDE_Y = 60;
const SLIDE_TILT = 9;

export const Stage: React.FC<StageProps> = ({
  durationInFrames,
  children,
  overlay,
  annotations,
  screen,
  windowProps,
  camera = [],
  cameraMode = "spring",
  enterFrames = 42,
  exitFrames = 36,
}) => {
  const frame = useCurrentFrame();
  const cam = cameraAt(camera, frame, cameraMode);

  const enter = enterFrames > 0 ? interpolate(frame, [0, enterFrames], [0, 1], { ...clamp01, easing: easeOut }) : 1;
  const exit =
    exitFrames > 0
      ? interpolate(frame, [durationInFrames - exitFrames, durationInFrames], [0, 1], { ...clamp01, easing: easeIn })
      : 0;

  // Enter from the right tilted clockwise; leave to the left tilted the other way.
  const slideX = lerp(SLIDE_X, 0, enter) - SLIDE_X * exit;
  const slideY = lerp(SLIDE_Y, 0, enter) + SLIDE_Y * 0.6 * exit;
  const tilt = lerp(SLIDE_TILT, 0, enter) - SLIDE_TILT * exit;

  const visible = enter > 0.001 && exit < 0.999;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {visible ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: WIDTH,
            height: HEIGHT,
            transform: `translate(${slideX}px, ${slideY}px) rotate(${tilt}deg)`,
            transformOrigin: "50% 50%",
          }}
        >
          {/* Camera: world (cam.x, cam.y) lands on the screen center. */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: WINDOW_W,
              height: WINDOW_H,
              transformOrigin: "0 0",
              transform: `translate(${WIDTH / 2}px, ${HEIGHT / 2}px) rotate(${cam.rotate}deg) scale(${cam.scale}) translate(${-cam.x}px, ${-cam.y}px)`,
            }}
          >
            <AppWindow
              {...windowProps}
              width={WINDOW_W}
              height={WINDOW_H}
              overlay={overlay}
              style={{ boxShadow: shadows.window }}
            >
              {children}
            </AppWindow>
            {annotations ? (
              <div style={{ position: "absolute", left: 0, top: 0, width: WINDOW_W, height: WINDOW_H, pointerEvents: "none" }}>
                {annotations}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {screen ? <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>{screen}</div> : null}
    </div>
  );
};
