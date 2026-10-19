import type React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { Hook, Name } from "./hook/Hook";
import { Outro } from "./hook/Outro";
import { BackupOp } from "./ops/BackupOp";
import { CreateOp } from "./ops/CreateOp";
import { ExtendOp } from "./ops/ExtendOp";
import { RunOp } from "./ops/RunOp";
import { ShareOp } from "./ops/ShareOp";
import { SecurityScene } from "./security/SecurityScene";
import { Soundtrack } from "./Soundtrack";
import { SpeedScene } from "./speed/SpeedScene";
import { Backdrop } from "./stage/Backdrop";
import { Title1, Title2, Title3, Title4, Title5 } from "./title/Titles";
import { type BeatId, beatById } from "./timeline";

type SceneProps = { from: number; durationInFrames: number };

// Every beat is mounted at the root with absolute frames. Each scene keeps its
// own inner timing and runs on a warped clock: a beat is played as consecutive
// segments, and each segment's Sequence has its own playbackRate, so
// useCurrentFrame() inside advances by `rate` per timeline frame. `trimBefore`
// starts the segment at the scene frame where the previous one stopped. The
// scene gets its inner length as durationInFrames and mounts its own Sequence
// at from=0, which nests cleanly.
const Beat: React.FC<{ id: BeatId; Scene: React.FC<SceneProps> }> = ({ id, Scene }) => {
  const b = beatById(id);
  return (
    <>
      {b.segments.map((s, i) => (
        <Sequence
          key={s.from}
          from={s.from}
          durationInFrames={s.duration}
          playbackRate={s.rate}
          trimBefore={s.innerFrom}
          name={`${id}.${i}`}
        >
          <Scene from={0} durationInFrames={b.innerDurationInFrames} />
        </Sequence>
      ))}
    </>
  );
};

const Plain: React.FC<{ id: BeatId; children: React.ReactNode }> = ({ id, children }) => {
  const b = beatById(id);
  return (
    <Sequence from={b.from} durationInFrames={b.durationInFrames} name={id}>
      {children}
    </Sequence>
  );
};

export const Promo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Backdrop />

      <Beat id="hook" Scene={Hook} />
      <Beat id="name" Scene={Name} />

      <Plain id="speed">
        <SpeedScene />
      </Plain>

      <Beat id="title1" Scene={Title1} />
      <Beat id="op1" Scene={CreateOp} />

      <Beat id="title2" Scene={Title2} />
      <Beat id="op2" Scene={RunOp} />

      <Beat id="title3" Scene={Title3} />
      <Beat id="op3" Scene={ExtendOp} />

      <Beat id="title4" Scene={Title4} />
      <Beat id="op4" Scene={BackupOp} />

      <Beat id="title5" Scene={Title5} />
      <Beat id="op5" Scene={ShareOp} />

      <Plain id="security">
        <SecurityScene />
      </Plain>

      <Beat id="outro" Scene={Outro} />

      <Soundtrack />
    </AbsoluteFill>
  );
};
