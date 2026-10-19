import type React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Desktop } from "../desktop/Desktop";
import { Glass } from "../glass/Glass";
import { BOUNCY, ease, mix, SMOOTH, type SwiftSpring, swift } from "../motion";

/** A slow, slightly springy glide for the glass drop. */
const DRIFT: SwiftSpring = { response: 1.1, dampingFraction: 0.82 };
import { pt } from "../theme";
import { Headline } from "../ui/Headline";

// Open (3 bars). A drop of glass slides in and settles in the middle, the
// icon pops out of it, the name and the README's one-line description follow.
// Then everything lifts away and the menu bar and Dock arrive: we are on the Mac.

export const Open: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // The glass drop: slides from the left, stretched while it moves.
  const slide = swift(frame, fps, DRIFT, 4);
  const speed = Math.abs(swift(frame + 1, fps, DRIFT, 4) - slide);
  const stretch = 1 + Math.min(0.7, speed * 16);
  const dropSize = pt(220);
  const dropX = mix(-pt(260), 960, slide);
  const merge = ease(frame, 78, 112);

  const icon = swift(frame, fps, BOUNCY, 74);
  const leave = swift(frame, fps, SMOOTH, 236);
  const title = swift(frame, fps, SMOOTH, 104) - leave;
  const sub = swift(frame, fps, SMOOTH, 126) - leave;
  const chrome = ease(frame, 250, 310);
  const iconY = mix(250, 150, leave);

  return (
    <Desktop
      scene="open"
      chrome={chrome}
      dockHide={1 - swift(frame, fps, SMOOTH, 262)}
      screen={
        <>
          {merge < 1 ? (
            <Glass
              width={dropSize * stretch * (1 - 0.25 * merge)}
              height={(dropSize / Math.sqrt(stretch)) * (1 - 0.25 * merge)}
              radius={dropSize}
              refraction={40}
              bevel={34}
              tint={0.06}
              light={slide}
              style={{
                left: dropX - (dropSize * stretch * (1 - 0.25 * merge)) / 2,
                top: iconY + pt(85) - (dropSize / Math.sqrt(stretch)) * (1 - 0.25 * merge) / 2,
                opacity: 1 - merge,
              }}
            />
          ) : null}
          {icon > 0.001 ? (
            <Img
              src={staticFile("snapzy/icon.png")}
              style={{
                position: "absolute",
                width: pt(170),
                height: pt(170),
                left: 960 - pt(85),
                top: iconY,
                transform: `scale(${icon * (1 - 0.35 * leave)})`,
                opacity: Math.min(1, icon * 1.5) * (1 - leave),
                filter: `drop-shadow(0 ${pt(14)}px ${pt(30)}px rgba(0,0,40,0.35))`,
              }}
            />
          ) : null}
          <Headline title="Snapzy" show={title} y={iconY + pt(200)} size={pt(110)} />
          <Headline
            title=""
            sub="Native macOS screenshots, recording, annotation, and editing from the menu bar."
            show={sub}
            y={iconY + pt(296)}
            size={pt(80)}
          />
        </>
      }
    />
  );
};
