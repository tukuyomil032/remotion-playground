import type React from "react";
import { Sequence } from "remotion";
import type { WarpSegment } from "./warp";

export type SceneProps = { from: number; durationInFrames: number };

// Plays a scene on a warped clock: each segment's Sequence has its own
// playbackRate, so useCurrentFrame() inside advances by `rate` per timeline
// frame. `trimBefore` starts the segment at the scene frame where the previous
// one stopped. The scene gets its inner length as durationInFrames and mounts
// its own Sequence at from=0, which nests cleanly.
export const Warped: React.FC<{
  name: string;
  segments: readonly WarpSegment[];
  innerDurationInFrames: number;
  Scene: React.FC<SceneProps>;
}> = ({ name, segments, innerDurationInFrames, Scene }) => (
  <>
    {segments.map((s, i) => (
      <Sequence
        key={s.from}
        from={s.from}
        durationInFrames={s.duration}
        playbackRate={s.rate}
        trimBefore={s.innerFrom}
        name={`${name}.${i}`}
      >
        <Scene from={0} durationInFrames={innerDurationInFrames} />
      </Sequence>
    ))}
  </>
);
