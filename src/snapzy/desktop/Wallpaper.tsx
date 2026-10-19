import type React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

// The desktop picture: our own abstract wave in the icon's blue, flowing into
// indigo and lilac, drifting slowly. Not a macOS wallpaper. It has bright
// crests and soft folds on purpose, so glass on top of it shows the bending.

export const Wallpaper: React.FC<{ drift?: number }> = ({ drift }) => {
  const frame = useCurrentFrame();
  const t = drift ?? frame;
  const s = Math.sin(t / 240);
  const c = Math.cos(t / 310);
  return (
    <AbsoluteFill style={{ background: "#0b1235" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="wp-sky" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3b2bd6" />
            <stop offset="0.45" stopColor="#1a3cf0" />
            <stop offset="1" stopColor="#0a1a7a" />
          </linearGradient>
          <linearGradient id="wp-wave" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#0f2bd0" />
            <stop offset="0.55" stopColor="#2a5cff" />
            <stop offset="1" stopColor="#9db4ff" />
          </linearGradient>
          <linearGradient id="wp-low" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#b9c4f5" />
            <stop offset="0.5" stopColor="#6f86e8" />
            <stop offset="1" stopColor="#2b44c8" />
          </linearGradient>
          <radialGradient id="wp-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#c7b8ff" stopOpacity={0.85} />
            <stop offset="1" stopColor="#c7b8ff" stopOpacity={0} />
          </radialGradient>
          {/* Soft shapes are radial gradients, not blur filters: a blur over the
              whole screen is recomputed every frame and in every thumbnail. */}
          <radialGradient id="wp-fold" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#b9c4f5" stopOpacity={0.85} />
            <stop offset="0.55" stopColor="#7d92ea" stopOpacity={0.5} />
            <stop offset="1" stopColor="#4a63d8" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="wp-deep" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#0a1680" stopOpacity={0.7} />
            <stop offset="1" stopColor="#0a1680" stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect width={1920} height={1080} fill="url(#wp-sky)" />
        <ellipse cx={420 + 60 * s} cy={300 + 30 * c} rx={520} ry={300} fill="url(#wp-glow)" opacity={0.55} />
        {/* Main wave */}
        <path
          d={`M -100 ${940 + 20 * s} C 380 ${700 + 30 * c}, 760 ${330 + 25 * s}, 1300 ${300 + 20 * c} S 1900 ${420 + 25 * s}, 2040 ${470 + 20 * c} L 2040 1180 L -100 1180 Z`}
          fill="url(#wp-wave)"
        />
        {/* Its bright crest: a wide faint glow under a thin bright line */}
        {[
          [16, 0.16],
          [7, 0.35],
          [3, 0.9],
        ].map(([w, o]) => (
          <path
            key={w}
            d={`M -100 ${940 + 20 * s} C 380 ${700 + 30 * c}, 760 ${330 + 25 * s}, 1300 ${300 + 20 * c} S 1900 ${420 + 25 * s}, 2040 ${470 + 20 * c}`}
            fill="none"
            stroke="#e8eeff"
            strokeWidth={w}
            opacity={o}
          />
        ))}
        {/* Soft fold and a deep shadow */}
        <ellipse cx={1500 + 30 * s} cy={930 + 20 * c} rx={760} ry={330} fill="url(#wp-fold)" />
        <ellipse cx={360 + 20 * c} cy={1080} rx={620} ry={220} fill="url(#wp-deep)" />
      </svg>
    </AbsoluteFill>
  );
};
