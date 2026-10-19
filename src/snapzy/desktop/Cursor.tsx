import type React from "react";
import { pt } from "../theme";

// macOS pointer (drawn here, black with a white outline), and the crosshair
// used while selecting an area. `press` 0..1 shrinks it a little on click.

export const Cursor: React.FC<{ x: number; y: number; press?: number; kind?: "arrow" | "cross" | "hand"; opacity?: number }> = ({
  x,
  y,
  press = 0,
  kind = "arrow",
  opacity = 1,
}) => {
  const s = 1 - 0.12 * press;
  if (kind === "cross") {
    const r = pt(11);
    return (
      <svg
        width={r * 2}
        height={r * 2}
        viewBox="-11 -11 22 22"
        style={{ position: "absolute", left: x - r, top: y - r, opacity, transform: `scale(${s})` }}
      >
        <g stroke="black" strokeWidth={3.2} strokeLinecap="round">
          <path d="M0 -10V-3M0 3V10M-10 0H-3M3 0H10" />
        </g>
        <g stroke="white" strokeWidth={1.4} strokeLinecap="round">
          <path d="M0 -10V-3M0 3V10M-10 0H-3M3 0H10" />
        </g>
      </svg>
    );
  }
  const w = pt(17);
  return (
    <svg
      width={w}
      height={w * 1.5}
      viewBox="0 0 17 25.5"
      style={{
        position: "absolute",
        left: x - 2,
        top: y - 2,
        opacity,
        transform: `scale(${s})`,
        transformOrigin: "2px 2px",
        filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.35))",
      }}
    >
      <path
        d="M2 2v19.2l4.6-4.3 3 6.9 3.3-1.4-3-6.8h6.3Z"
        fill="black"
        stroke="white"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
};
