import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { status as statusColors } from "../theme";

export type ServerStatus =
  | "online"
  | "offline"
  | "starting"
  | "stopping"
  | "restarting"
  | "crashed";

const COLOR: Record<ServerStatus, string> = {
  online: statusColors.success,
  offline: statusColors.offline,
  starting: statusColors.warning,
  stopping: statusColors.danger,
  restarting: statusColors.info,
  crashed: statusColors.crashed,
};

export const StatusDot: React.FC<{
  status: ServerStatus;
  size?: number;
  /** Override color (e.g. while interpolating between states). */
  color?: string;
  /** Soft halo around the online dot. Default false (flat). */
  glow?: boolean;
  style?: React.CSSProperties;
}> = ({ status, size = 10, color, glow: withGlow = false, style }) => {
  const frame = useCurrentFrame();
  const fill = color ?? COLOR[status];
  // Blink for starting/crashed: 1 s period at 60 fps.
  const blinking = status === "starting" || status === "crashed";
  const opacity = blinking
    ? interpolate(Math.sin((frame / 60) * Math.PI * 2), [-1, 1], [0.35, 1])
    : 1;
  const glow = withGlow && status === "online" ? `0 0 ${size}px ${fill}88` : "none";

  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        background: fill,
        opacity,
        boxShadow: glow,
        flexShrink: 0,
        ...style,
      }}
    />
  );
};
