import type { FC } from "react";
import { Composition } from "remotion";
import { Promo } from "./Promo";
import { DURATION_IN_FRAMES, FPS, HEIGHT, WIDTH } from "./timeline";

export const RemotionRoot: FC = () => {
  return (
    <Composition
      id="Promo"
      component={Promo}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
