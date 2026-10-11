import { Audio } from "@remotion/media";
import type React from "react";
import { interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { SFX_CUES, type SfxName } from "./timeline";

/**
 * bgm.wav is mastered to about -14 LUFS / -1.5 dBTP or lower by scripts/generate-audio.ts.
 * At 0.9 it sits near -15 LUFS; the quiet SFX on top barely move the final mix.
 */
const BGM_VOLUME = 0.9;
const BGM_FADE_IN_SECONDS = 1;
const BGM_FADE_OUT_SECONDS = 1.5;
/** Bound each SFX Sequence so the timeline stays tidy (the chime is 1.2 s, the rocket climb about 4 s). */
const SFX_MAX_SECONDS: Partial<Record<SfxName, number>> = {
  rocket: 4.2,
  boom: 2.7,
  ignite: 1.7,
};
const SFX_DEFAULT_SECONDS = 1.25;

/** BGM plus every SFX cue from timeline.ts. Mount once at the top of the composition. */
export const Soundtrack: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = Math.round(BGM_FADE_IN_SECONDS * fps);
  const fadeOut = Math.round(BGM_FADE_OUT_SECONDS * fps);

  return (
    <>
      <Audio
        src={staticFile("audio/bgm.wav")}
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
          durationInFrames={Math.min(
            Math.round(fps * (SFX_MAX_SECONDS[cue.sfx] ?? SFX_DEFAULT_SECONDS)),
            durationInFrames - cue.frame,
          )}
          layout="none"
          name={`sfx ${cue.sfx}${cue.note ? ` (${cue.note})` : ""}`}
        >
          <Audio src={staticFile(`audio/sfx-${cue.sfx}.wav`)} volume={cue.volume ?? 1} />
        </Sequence>
      ))}
    </>
  );
};
