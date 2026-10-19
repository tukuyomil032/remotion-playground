import type React from "react";
import { useId } from "react";

// Liquid Glass, approximated for Chromium. Layers, back to front:
//   1. the backdrop, bent near the edges by an SVG displacement map (a lens:
//      the middle is neutral grey, the rim ramps red left->right and blue
//      top->bottom), then frosted with blur and extra saturation
//   2. a faint tint so the glass reads on any background
//   3. a specular sheen whose position follows `light` (moves with motion)
//   4. a bright rim: strong on the top edge, faint elsewhere
// plus a soft drop shadow. Chromium supports url() in backdrop-filter, which
// headless Chrome (Remotion's renderer) uses.

export type GlassProps = {
  width: number;
  height: number;
  radius: number;
  /** How far the rim bends the backdrop, px. 0 = flat frosted glass. */
  refraction?: number;
  /** Width of the bending band at the rim, px. */
  bevel?: number;
  blur?: number;
  saturate?: number;
  /** White tint 0..1 (dark glass uses a low value). */
  tint?: number;
  /** Darkening 0..1 under the tint, for legibility over bright backgrounds. */
  shade?: number;
  /** Sheen position 0..1 across the diagonal. */
  light?: number;
  shadow?: boolean;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

/** Lens map as an SVG data URI: neutral in the middle, ramps at the rim. */
const lensMap = (w: number, h: number, r: number, bevel: number): string => {
  const inner = Math.max(0, r - bevel * 0.6);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<defs>` +
    `<linearGradient id="r" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#f00"/></linearGradient>` +
    `<linearGradient id="b" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#00f"/></linearGradient>` +
    `<filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${bevel * 0.35}"/></filter>` +
    `</defs>` +
    `<rect width="${w}" height="${h}" fill="#000"/>` +
    `<rect width="${w}" height="${h}" rx="${r}" fill="url(#r)"/>` +
    `<rect width="${w}" height="${h}" rx="${r}" fill="url(#b)" style="mix-blend-mode:screen"/>` +
    `<rect x="${bevel}" y="${bevel}" width="${Math.max(0, w - bevel * 2)}" height="${Math.max(0, h - bevel * 2)}" rx="${inner}" fill="#808080" filter="url(#s)"/>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const Glass: React.FC<GlassProps> = ({
  width,
  height,
  radius,
  refraction = 28,
  bevel = 22,
  blur = 14,
  saturate = 1.7,
  tint = 0.08,
  shade = 0,
  light = 0.3,
  shadow = true,
  style,
  children,
}) => {
  const id = `lg${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const r = Math.min(radius, w / 2, h / 2);
  const lx = -40 + light * 180;
  const backdrop =
    refraction > 0
      ? `url(#${id}) blur(${blur}px) saturate(${saturate})`
      : `blur(${blur}px) saturate(${saturate})`;

  return (
    <div
      style={{
        position: "absolute",
        width: w,
        height: h,
        borderRadius: r,
        boxShadow: shadow ? "0 24px 60px rgba(4,8,30,0.38), 0 3px 10px rgba(4,8,30,0.22)" : undefined,
        ...style,
      }}
    >
      {refraction > 0 ? (
        <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
          <filter id={id} x="0" y="0" width={w} height={h} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feImage href={lensMap(w, h, r, bevel)} x={0} y={0} width={w} height={h} result="map" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={-refraction} xChannelSelector="R" yChannelSelector="B" />
          </filter>
        </svg>
      ) : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: r,
          backdropFilter: backdrop,
          WebkitBackdropFilter: backdrop,
          background: `linear-gradient(180deg, rgba(255,255,255,${tint * 1.4}) 0%, rgba(255,255,255,${tint}) 45%, rgba(255,255,255,${tint * 0.7}) 100%)${shade > 0 ? `, rgba(8,10,24,${shade})` : ""}`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(115deg, transparent ${lx}%, rgba(255,255,255,0.16) ${lx + 14}%, transparent ${lx + 34}%)`,
            mixBlendMode: "screen",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: r,
          boxShadow:
            "inset 0 1.5px 0 rgba(255,255,255,0.55), inset 0 0 0 1px rgba(255,255,255,0.16), inset 0 -1px 0 rgba(255,255,255,0.10), inset 0 0 24px rgba(255,255,255,0.05)",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "absolute", inset: 0, borderRadius: r, overflow: "hidden" }}>{children}</div>
    </div>
  );
};
