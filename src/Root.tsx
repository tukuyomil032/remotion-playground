import type { FC } from "react";
import { Composition } from "remotion";
import { Promo as MCVectorPromo } from "./mc-vector/Promo";
import { DURATION_IN_FRAMES, FPS, HEIGHT, WIDTH } from "./mc-vector/timeline";

export const RemotionRoot: FC = () => {
  return (
    <>
      <Composition
        id="MCVectorPromo"
        component={MCVectorPromo}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
