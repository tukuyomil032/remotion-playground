import { Audio } from "@remotion/media";
import type React from "react";
import { interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { SFX_CUES } from "./layout";

/** bgm.wav is mastered to about -14 LUFS by scripts/snapzy/generate-audio.ts. */
const BGM_VOLUME = 0.9;
const SFX_SECONDS = 1.25;

/** BGM plus every sound cue from layout.ts. Mount once at the top of the composition. */
export const Soundtrack: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = Math.round(0.6 * fps);
  const fadeOut = Math.round(1.2 * fps);
  return (
    <>
      <Audio
        src={staticFile("snapzy/audio/bgm.wav")}
        name="bgm"
        volume={(f) =>
          interpolate(f, [0, fadeIn, durationInFrames - fadeOut, durationInFrames], [0, BGM_VOLUME, BGM_VOLUME, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
      {SFX_CUES.map((cue, i) => (
        <Sequence
          key={`${i}-${cue.frame}-${cue.sfx}`}
          from={cue.frame}
          durationInFrames={Math.min(Math.round(fps * SFX_SECONDS), durationInFrames - cue.frame)}
          layout="none"
          name={`sfx ${cue.sfx}`}
        >
          <Audio src={staticFile(`snapzy/audio/sfx-${cue.sfx}.wav`)} volume={cue.volume ?? 1} />
        </Sequence>
      ))}
    </>
  );
};
