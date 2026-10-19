import type React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { type SceneId, SCENES } from "./layout";
import { Annotate } from "./scenes/Annotate";
import { Capture } from "./scenes/Capture";
import { History } from "./scenes/History";
import { Ocr } from "./scenes/Ocr";
import { Onboard } from "./scenes/Onboard";
import { Open } from "./scenes/Open";
import { Outro } from "./scenes/Outro";
import { Video } from "./scenes/Video";
import { Soundtrack } from "./Soundtrack";

const SCENE_COMPONENTS: Partial<Record<SceneId, React.FC>> = {
  open: Open,
  onboard: Onboard,
  capture: Capture,
  ocr: Ocr,
  annotate: Annotate,
  video: Video,
  history: History,
  outro: Outro,
};

export const SnapzyPromo: React.FC = () => (
  <AbsoluteFill style={{ background: "#0b1235" }}>
    {SCENES.map((s) => {
      const Scene = SCENE_COMPONENTS[s.id];
      return Scene ? (
        <Sequence key={s.id} from={s.from} durationInFrames={s.durationInFrames} name={s.id}>
          <Scene />
        </Sequence>
      ) : null;
    })}
    <Soundtrack />
  </AbsoluteFill>
);
