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
import { type SceneProps, Warped } from "../shared/Warped";
import { Soundtrack } from "./Soundtrack";
import { SpeedScene } from "./speed/SpeedScene";
import { Backdrop } from "./stage/Backdrop";
import { Title1, Title2, Title3, Title4, Title5 } from "./title/Titles";
import { type BeatId, beatById } from "./timeline";

// Every beat is mounted at the root with absolute frames. Each scene keeps its
// own inner timing and runs on a warped clock (see src/shared/Warped.tsx).
const Beat: React.FC<{ id: BeatId; Scene: React.FC<SceneProps> }> = ({ id, Scene }) => {
  const b = beatById(id);
  return <Warped name={id} segments={b.segments} innerDurationInFrames={b.innerDurationInFrames} Scene={Scene} />;
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
