# MC-Vector Promo

A code-built promo video for MC-Vector, made with Remotion. Nothing is recorded or imported; every frame is drawn in code, and the music and sound effects are synthesized by a script.

## Set up

~~~sh
bun install
bun run generate:audio   # writes public/audio/*.wav (not committed)
bun run dev              # Remotion Studio
~~~

`generate:audio` needs `ffmpeg` at `/opt/homebrew/bin/ffmpeg`.

## Scripts

- `bun run dev`: open Remotion Studio.
- `bun run render`: render `out/mc-vector-promo.mp4`.
- `bun run generate:audio`: synthesize the BGM and sound effects into `public/audio/`.
- `bun run build`: bundle the project.
- `bun run lint`: run oxlint and the TypeScript type check.

## Layout

- `src/layout.ts`: where each scene sits on the timeline (shared by the video and the audio script).
- `src/timeline.ts`: the stage color and the sound cues.
- `src/speed/`, `src/security/`, `src/ops/`, `src/hook/`, `src/title/`: the scenes.
- `scripts/generate-audio.ts`: the soundtrack.

## Docs

- `docs/mc-vector-facts.md`: verified facts about MC-Vector (features, design tokens, backend, claims to avoid).
- `docs/video-concept.md`: the video's structure and how it is built.
