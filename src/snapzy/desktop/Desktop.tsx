import type React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { type SceneId, sceneById } from "../layout";
import { keys } from "../motion";
import { Dock } from "./Dock";
import { MenuBar } from "./MenuBar";
import { Wallpaper } from "./Wallpaper";

// The Mac screen every scene happens on, plus a camera. Scenes render their
// windows as `children` (above the dock, below `overlay`). The wallpaper drifts
// on the video's absolute clock so it is continuous across scenes.

export type Camera = { x: number; y: number; scale: number };
export const WIDE: Camera = { x: 960, y: 540, scale: 1 };

/** Camera eased through [frame, camera] keys. */
export const cameraAt = (frame: number, list: readonly (readonly [number, Camera])[]): Camera => ({
  x: keys(frame, list.map(([f, c]) => [f, c.x] as const)),
  y: keys(frame, list.map(([f, c]) => [f, c.y] as const)),
  scale: keys(frame, list.map(([f, c]) => [f, c.scale] as const)),
});

export const Desktop: React.FC<{
  scene: SceneId;
  camera?: Camera;
  menuApp?: string;
  snapzyActive?: number;
  dockHide?: number;
  chrome?: number;
  children?: React.ReactNode;
  /** Drawn above everything inside the camera (menus, cursor). */
  overlay?: React.ReactNode;
  /** Drawn outside the camera (headlines, key caps). */
  screen?: React.ReactNode;
}> = ({ scene, camera = WIDE, menuApp, snapzyActive = 0, dockHide = 0, chrome = 1, children, overlay, screen }) => {
  const frame = useCurrentFrame();
  const abs = sceneById(scene).from + frame;
  const s = camera.scale;
  // Keep the view inside the screen.
  const cx = Math.min(1920 - 960 / s, Math.max(960 / s, camera.x));
  const cy = Math.min(1080 - 540 / s, Math.max(540 / s, camera.y));
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#0b1235" }}>
      <AbsoluteFill
        style={{
          transformOrigin: "0 0",
          transform: `translate(${960 - cx * s}px, ${540 - cy * s}px) scale(${s})`,
        }}
      >
        <Wallpaper drift={abs} />
        <div style={{ position: "absolute", inset: 0, opacity: chrome }}>
          <MenuBar app={menuApp} snapzyActive={snapzyActive} />
        </div>
        {children}
        <div style={{ position: "absolute", inset: 0, opacity: chrome }}>
          <Dock hide={dockHide} />
        </div>
        {overlay}
      </AbsoluteFill>
      {screen}
    </AbsoluteFill>
  );
};
