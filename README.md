# Remotion Playground

Code-built promo videos made with Remotion. Nothing is recorded or imported; every frame is drawn in code, and the music and sound effects are synthesized by scripts.

| Video | Composition | Sources |
|---|---|---|
| MC-Vector promo | `MCVectorPromo` | `src/mc-vector/`, `scripts/mc-vector/`, `docs/mc-vector/` |
| Snapzy demo (fan-made) | `SnapzyPromo` | `src/snapzy/`, `scripts/snapzy/`, `docs/snapzy/` |

Shared pieces live in `src/shared/` (the warp timing that plays a scene at varying speeds) and `scripts/shared/dsp.ts` (filters, reverb, instruments, WAV output, loudness).

## Set up

~~~sh
bun install
bun run generate:audio:mc-vector   # writes public/mc-vector/audio/*.wav (not committed)
bun run generate:audio:snapzy      # writes public/snapzy/audio/*.wav (not committed)
bun run dev                        # Remotion Studio
~~~

The audio scripts need `ffmpeg` at `/opt/homebrew/bin/ffmpeg`.

## Output preview
<details>
    <summary>
    MC-Vector
    </summary>
<video src="https://github.com/user-attachments/assets/7f76ccb6-ebba-48a3-b9f3-3163c6cfa1a4" controls width="600"></video>
</details>
<details>
    <summary>
    Snapzy
    </summary>
<video src="https://github.com/user-attachments/assets/93756672-e91c-4901-ba1d-d66ed2409fc8" controls width="600"></video>
</details>

## Scripts

- `bun run dev`: open Remotion Studio.
- `bun run render:mc-vector`: render `out/mc-vector-promo.mp4`.
- `bun run render:snapzy`: render `out/snapzy-promo.mp4`.
- `bun run generate:audio:mc-vector` / `generate:audio:snapzy`: synthesize each video's BGM and sound effects.
- `bun run build`: bundle the project.
- `bun run lint`: run oxlint and the TypeScript type check.

## MC-Vector

- `src/mc-vector/layout.ts`: where each scene sits on the timeline (shared by the video and the audio script).
- `src/mc-vector/timeline.ts`: the stage color and the sound cues.
- `src/mc-vector/speed/`, `security/`, `ops/`, `hook/`, `title/`: the scenes.
- `scripts/mc-vector/generate-audio.ts`: the soundtrack.
- `docs/mc-vector/facts.md`: verified facts about MC-Vector (features, design tokens, backend, claims to avoid).
- `docs/mc-vector/video-concept.md`: the video's structure and how it is built.

## Snapzy

A fan-made demo of [Snapzy](https://github.com/duongductrong/Snapzy), the open-source macOS screenshot app by duongductrong. Not affiliated with the Snapzy project.

- `src/snapzy/layout.ts`, `src/snapzy/timing.ts`: scene lengths, every click and capture, and the sound cues built from them.
- `src/snapzy/glass/Glass.tsx`: the Liquid Glass approximation (backdrop refraction, frost, rim light, sheen).
- `src/snapzy/motion.ts`: SwiftUI-style springs (`response` / `dampingFraction`).
- `src/snapzy/desktop/`, `content/`, `ui/`, `ui/editors/`: the Mac desktop, the made-up captured windows, and the Snapzy UI replicas.
- `src/snapzy/scenes/`: Open, Onboard, Capture, Ocr, Annotate, Video, History, Outro.
- `scripts/snapzy/generate-audio.ts`: the soundtrack.
- `docs/snapzy/facts.md`, `docs/snapzy/video-concept.md`: verified facts and the video's structure.

Notes:

- Text is set in SF Pro, which must be installed on the machine that renders (it is on macOS). The font is not included in this repository.
- `public/snapzy/icon.png` is Snapzy's app icon (from Snapzy, BSD-3-Clause, © duongductrong). The app's name and icon belong to its author.
