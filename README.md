# Remotion Playground

Code-built promo videos made with Remotion. Nothing is recorded or imported; every frame is drawn in code, and the music and sound effects are synthesized by scripts.

| Video | Composition | Sources |
|---|---|---|
| MC-Vector promo | `MCVectorPromo` | `src/mc-vector/`, `scripts/mc-vector/`, `docs/mc-vector/` |

## Set up

~~~sh
bun install
bun run generate:audio:mc-vector   # writes public/mc-vector/audio/*.wav (not committed)
bun run dev                        # Remotion Studio
~~~

The audio scripts need `ffmpeg` at `/opt/homebrew/bin/ffmpeg`.

## Scripts

- `bun run dev`: open Remotion Studio.
- `bun run render:mc-vector`: render `out/mc-vector-promo.mp4`.
- `bun run generate:audio:mc-vector`: synthesize the MC-Vector BGM and sound effects into `public/mc-vector/audio/`.
- `bun run build`: bundle the project.
- `bun run lint`: run oxlint and the TypeScript type check.

## MC-Vector

- `src/mc-vector/layout.ts`: where each scene sits on the timeline (shared by the video and the audio script).
- `src/mc-vector/timeline.ts`: the stage color and the sound cues.
- `src/mc-vector/speed/`, `security/`, `ops/`, `hook/`, `title/`: the scenes.
- `scripts/mc-vector/generate-audio.ts`: the soundtrack.
- `docs/mc-vector/facts.md`: verified facts about MC-Vector (features, design tokens, backend, claims to avoid).
- `docs/mc-vector/video-concept.md`: the video's structure and how it is built.
